import React, { Suspense } from "react";
import { connection } from "next/server";
import { getReportData, ReportQueryOptions } from "@/db/queries/reports";
import { PrintToolbar } from "./PrintToolbar";
import { getOptionalUser } from "@/lib/auth/server";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function ReportPrintPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-slate-700">
              กำลังจัดเตรียมเอกสารรายงาน A4...
            </p>
          </div>
        </div>
      }
    >
      <PrintDocumentContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PrintDocumentContent({ searchParams }: PageProps) {
  await connection();
  const user = await getOptionalUser();
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
          <p className="text-base font-bold text-red-600 mb-2">401 ไม่ได้รับอนุญาต (Unauthorized)</p>
          <p className="text-sm text-slate-600 mb-6">
            กรุณาเข้าสู่ระบบผ่านแอปพลิเคชันก่อนเปิดดูเอกสารรายงานตรวจนับ
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition"
          >
            กลับสู่หน้าหลัก
          </a>
        </div>
      </div>
    );
  }

  const params = await searchParams;

  const scope = (params.scope as "current_stock" | "count_round") || "count_round";
  const roundId = (params.roundId as string) || undefined;
  const plantIdStr = params.plantId as string;
  const plantId = plantIdStr ? parseInt(plantIdStr, 10) : undefined;
  const categoryId = (params.categoryId as string) || undefined;
  const differenceOnly = params.differenceOnly === "true";
  const sortBy = (params.sortBy as any) || "sku";

  const options: ReportQueryOptions = {
    scope,
    roundId,
    plantId: isNaN(plantId as number) ? undefined : plantId,
    categoryId,
    differenceOnly,
    sortBy,
  };

  const reportData = await getReportData(options);
  const { summary, rows } = reportData;

  // Build query string for export buttons
  const qParams = new URLSearchParams();
  if (scope) qParams.set("scope", scope);
  if (roundId) qParams.set("roundId", roundId);
  if (plantId) qParams.set("plantId", plantId.toString());
  if (categoryId) qParams.set("categoryId", categoryId);
  if (differenceOnly) qParams.set("differenceOnly", "true");
  if (sortBy) qParams.set("sortBy", sortBy);
  const queryString = qParams.toString();

  const excelUrl = `/api/export/excel?${queryString}`;
  const pdfUrl = `/api/export/pdf?${queryString}`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans print:bg-white print:text-black">
      {/* 1. Interactive Top Control Bar (Hidden when printing) */}
      <PrintToolbar
        excelUrl={excelUrl}
        pdfUrl={pdfUrl}
        reportTitle={summary.title}
        itemCount={rows.length}
      />

      {/* 2. Printable Document Sheet (A4 Landscape) */}
      <main className="max-w-[285mm] mx-auto p-4 sm:p-8 print:p-0 print:max-w-none">
        <div className="bg-white rounded-lg shadow-sm print:shadow-none p-6 print:p-0 border border-slate-200 print:border-none">
          {/* Document Header */}
          <header className="border-b-2 border-slate-800 pb-3 mb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  {summary.logoUrl ? (
                    <img
                      src={summary.logoUrl}
                      alt={summary.brandName || "KCON"}
                      className="h-12 w-auto object-contain"
                    />
                  ) : (
                    <img
                      src="/logo.png"
                      alt={summary.brandName || "KCON"}
                      className="h-12 w-auto object-contain"
                    />
                  )}
                  <div>
                    <h1 className="text-xl font-bold text-blue-900 print:text-black tracking-tight">
                      {summary.companyNameTh || "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด"} ({summary.brandName || "KCON"})
                    </h1>
                    <p className="text-[11px] text-slate-500 print:text-slate-700">
                      {summary.addressTh || "154 หมู่ 9 ถนนมะลิวัลย์ ต.บ้านทุ่ม อ.เมืองขอนแก่น จ.ขอนแก่น 40000"} | โทร. {summary.phone || "043-255-111"}
                    </p>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-800 print:text-black pt-1">
                  {summary.title}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 print:text-slate-700 mt-0.5">
                  {summary.roundPeriod && (
                    <span>
                      ช่วงเวลานับ:{" "}
                      <strong className="text-slate-800 print:text-black">
                        {summary.roundPeriod}
                      </strong>
                    </span>
                  )}
                  {summary.roundStatus && (
                    <span>
                      สถานะรอบ:{" "}
                      <strong className="text-slate-800 print:text-black">
                        {summary.roundStatus}
                      </strong>
                    </span>
                  )}
                  <span>
                    วันที่พิมพ์:{" "}
                    <strong className="text-slate-800 print:text-black">
                      {summary.generatedAt}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-800 border border-slate-300 print:border-black">
                  {summary.scope === "count_round"
                    ? "ใบรายงานผลการตรวจนับ"
                    : "ใบรายงานสต๊อกปัจจุบัน"}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  ทั้งหมด {summary.totalSkus} รายการ ({rows.length} จุดวาง)
                </p>
              </div>
            </div>
          </header>

          {/* KPI Summary Cards */}
          <section
            aria-label="KPI summary"
            className="grid grid-cols-6 gap-2 mb-4 page-break-inside-avoid"
          >
            <div className="border border-slate-300 rounded p-2 text-center bg-slate-50 print:bg-transparent">
              <span className="block text-[10px] text-slate-600 font-medium">จำนวน SKU</span>
              <span className="text-sm font-bold text-slate-900">
                {summary.totalSkus.toLocaleString()}
              </span>
            </div>
            <div className="border border-slate-300 rounded p-2 text-center bg-slate-50 print:bg-transparent">
              <span className="block text-[10px] text-slate-600 font-medium">ตรวจนับเสร็จ</span>
              <span className="text-sm font-bold text-slate-900">
                {summary.countedSkus} ({summary.countedPercentage}%)
              </span>
            </div>
            <div className="border border-slate-300 rounded p-2 text-center bg-slate-50 print:bg-transparent">
              <span className="block text-[10px] text-slate-600 font-medium">ยอดระบบรวม</span>
              <span className="text-sm font-bold text-slate-900">
                {summary.totalSystemQty.toLocaleString()}
              </span>
            </div>
            <div className="border border-slate-300 rounded p-2 text-center bg-slate-50 print:bg-transparent">
              <span className="block text-[10px] text-slate-600 font-medium">ยอดนับจริงรวม</span>
              <span className="text-sm font-bold text-slate-900">
                {summary.totalCountedQty.toLocaleString()}
              </span>
            </div>
            <div
              className={`border rounded p-2 text-center ${
                summary.totalDifferenceQty !== 0
                  ? "border-red-300 bg-red-50/50 print:border-black print:bg-transparent"
                  : "border-slate-300 bg-slate-50 print:bg-transparent"
              }`}
            >
              <span className="block text-[10px] text-slate-600 font-medium">ผลต่างสุทธิ</span>
              <span
                className={`text-sm font-bold ${
                  summary.totalDifferenceQty < 0
                    ? "text-red-600 print:text-black"
                    : summary.totalDifferenceQty > 0
                    ? "text-emerald-700 print:text-black"
                    : "text-slate-900"
                }`}
              >
                {summary.totalDifferenceQty > 0
                  ? `+${summary.totalDifferenceQty.toLocaleString()}`
                  : summary.totalDifferenceQty.toLocaleString()}
              </span>
            </div>
            <div
              className={`border rounded p-2 text-center ${
                summary.itemsWithDiffCount > 0
                  ? "border-amber-300 bg-amber-50/50 print:border-black print:bg-transparent"
                  : "border-slate-300 bg-slate-50 print:bg-transparent"
              }`}
            >
              <span className="block text-[10px] text-slate-600 font-medium">จุดที่พบผลต่าง</span>
              <span
                className={`text-sm font-bold ${
                  summary.itemsWithDiffCount > 0
                    ? "text-amber-700 print:text-black"
                    : "text-slate-900"
                }`}
              >
                {summary.itemsWithDiffCount.toLocaleString()} จุด
              </span>
            </div>
          </section>

          {/* Plant Summary Bar */}
          <div className="border border-slate-300 rounded overflow-hidden mb-5 page-break-inside-avoid">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-200/80 text-slate-800 font-semibold border-b border-slate-300 print:bg-slate-100">
                <tr>
                  <th className="py-1 px-2">โรงงาน</th>
                  <th className="py-1 px-2 text-right">จำนวน SKU</th>
                  <th className="py-1 px-2 text-right">ตรวจนับแล้ว</th>
                  <th className="py-1 px-2 text-right">ยอดระบบรวม</th>
                  <th className="py-1 px-2 text-right">ยอดนับจริงรวม</th>
                  <th className="py-1 px-2 text-right">ผลต่างรวม</th>
                  <th className="py-1 px-2 text-right">จุดมีผลต่าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {summary.plantSummaries.map((p) => (
                  <tr key={p.plantId} className="even:bg-slate-50/50 print:even:bg-transparent">
                    <td className="py-1 px-2 font-medium">{p.plantName}</td>
                    <td className="py-1 px-2 text-right">{p.totalSkus.toLocaleString()}</td>
                    <td className="py-1 px-2 text-right">{p.countedSkus.toLocaleString()}</td>
                    <td className="py-1 px-2 text-right">{p.systemQty.toLocaleString()}</td>
                    <td className="py-1 px-2 text-right font-medium">{p.countedQty.toLocaleString()}</td>
                    <td className="py-1 px-2 text-right font-semibold">
                      <span
                        className={
                          p.differenceQty < 0
                            ? "text-red-600 print:text-black"
                            : p.differenceQty > 0
                            ? "text-emerald-700 print:text-black"
                            : "text-slate-600"
                        }
                      >
                        {p.differenceQty > 0
                          ? `+${p.differenceQty.toLocaleString()}`
                          : p.differenceQty.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-right">{p.diffCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Item & Location Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse border border-slate-300 print:text-[10px]">
              <thead className="bg-slate-800 text-white border-b border-slate-800 print:bg-slate-200 print:text-black print:border-black">
                <tr className="text-center font-semibold">
                  <th className="p-1.5 border border-slate-300 w-8">#</th>
                  <th className="p-1.5 border border-slate-300 text-left w-24">รหัสสินค้า</th>
                  <th className="p-1.5 border border-slate-300 text-left">ชื่อสินค้า</th>
                  <th className="p-1.5 border border-slate-300 text-left w-24">สเปก/ขนาด</th>
                  <th className="p-1.5 border border-slate-300 w-12">หน่วย</th>
                  <th className="p-1.5 border border-slate-300 w-12">โรง</th>
                  <th className="p-1.5 border border-slate-300 w-12">ล็อค</th>
                  <th className="p-1.5 border border-slate-300 w-10">แถว</th>
                  <th className="p-1.5 border border-slate-300 text-right w-16">ยอดระบบ</th>
                  <th className="p-1.5 border border-slate-300 text-right w-16">ยอดนับ</th>
                  <th className="p-1.5 border border-slate-300 text-right w-16">ผลต่าง</th>
                  <th className="p-1.5 border border-slate-300 w-16">สถานะจุด</th>
                  <th className="p-1.5 border border-slate-300 text-left">หมายเหตุ</th>
                  <th className="p-1.5 border border-slate-300 text-left w-20">ผู้ตรวจนับ</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="text-center py-8 text-slate-500">
                      ไม่พบข้อมูลรายการที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => {
                    const diffText =
                      r.difference > 0
                        ? `+${r.difference.toLocaleString()}`
                        : r.difference.toLocaleString();

                    const obsBadge =
                      r.locationSource === "NEW" ? (
                        <span className="font-medium text-amber-700 print:text-black">
                          จุดวางใหม่
                        </span>
                      ) : r.observationStatus === "MOVED" ? (
                        <span className="font-medium text-blue-700 print:text-black">ย้าย</span>
                      ) : r.observationStatus === "NOT_FOUND" ? (
                        <span className="font-medium text-red-600 print:text-black">ไม่พบ</span>
                      ) : (
                        <span>ปกติ</span>
                      );

                    const noteText = [r.locationNote, r.generalNote].filter(Boolean).join(" | ");

                    return (
                      <tr
                        key={`${r.productId}-${r.lockCode}-${r.rowCode}-${i}`}
                        className={`border-b border-slate-300 hover:bg-slate-50 page-break-inside-avoid ${
                          i % 2 === 1 ? "bg-slate-50/60 print:bg-transparent" : "bg-white"
                        }`}
                      >
                        <td className="p-1 border border-slate-300 text-center text-slate-500 font-mono">
                          {i + 1}
                        </td>
                        <td className="p-1 border border-slate-300 font-mono font-medium text-slate-800 print:text-black">
                          {r.sku}
                        </td>
                        <td className="p-1 border border-slate-300 font-medium text-slate-900 print:text-black">
                          {r.name}
                        </td>
                        <td className="p-1 border border-slate-300 text-slate-600 print:text-black">
                          {r.spec}
                        </td>
                        <td className="p-1 border border-slate-300 text-center text-slate-700 print:text-black">
                          {r.unit}
                        </td>
                        <td className="p-1 border border-slate-300 text-center font-medium">
                          {r.plantId}
                        </td>
                        <td className="p-1 border border-slate-300 text-center font-semibold text-blue-800 print:text-black">
                          {r.lockCode}
                        </td>
                        <td className="p-1 border border-slate-300 text-center font-medium">
                          {r.rowCode}
                        </td>
                        <td className="p-1 border border-slate-300 text-right font-mono">
                          {r.systemQuantity.toLocaleString()}
                        </td>
                        <td className="p-1 border border-slate-300 text-right font-mono font-semibold">
                          {r.countedQuantity.toLocaleString()}
                        </td>
                        <td
                          className={`p-1 border border-slate-300 text-right font-mono font-bold ${
                            r.difference < 0
                              ? "bg-red-50 text-red-600 print:bg-transparent print:text-black"
                              : r.difference > 0
                              ? "bg-emerald-50 text-emerald-700 print:bg-transparent print:text-black"
                              : "text-slate-500 print:text-black"
                          }`}
                        >
                          {diffText}
                        </td>
                        <td className="p-1 border border-slate-300 text-center text-[10px]">
                          {obsBadge}
                        </td>
                        <td className="p-1 border border-slate-300 text-slate-600 print:text-black text-[10px] max-w-[140px] truncate">
                          {noteText || "-"}
                        </td>
                        <td className="p-1 border border-slate-300 text-slate-600 print:text-black text-[10px]">
                          {r.countedBy || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-200/90 font-bold border-t-2 border-slate-800 print:border-black text-[11px] print:text-[10px]">
                <tr>
                  <td colSpan={8} className="p-1.5 border border-slate-300 text-center">
                    ยอดรวมสุทธิทั้งสิ้น (Total)
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">
                    {summary.totalSystemQty.toLocaleString()}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">
                    {summary.totalCountedQty.toLocaleString()}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">
                    <span
                      className={
                        summary.totalDifferenceQty < 0
                          ? "text-red-600 print:text-black"
                          : summary.totalDifferenceQty > 0
                          ? "text-emerald-700 print:text-black"
                          : ""
                      }
                    >
                      {summary.totalDifferenceQty > 0
                        ? `+${summary.totalDifferenceQty.toLocaleString()}`
                        : summary.totalDifferenceQty.toLocaleString()}
                    </span>
                  </td>
                  <td colSpan={3} className="p-1.5 border border-slate-300"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Formal Signature Section */}
          <footer className="mt-8 pt-4 border-t border-slate-300 page-break-inside-avoid">
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <p className="font-semibold text-slate-800 print:text-black">
                  ผู้จัดทำ / ผู้ตรวจนับสต๊อก
                </p>
                <div className="h-16 flex items-end justify-center">
                  <p className="text-slate-400 print:text-slate-600">
                    (......................................................)
                  </p>
                </div>
                <p className="text-slate-500 print:text-slate-700 mt-1">วันที่ ..... / ..... / .........</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800 print:text-black">
                  หัวหน้าฝ่ายคลังสินค้า / ผู้ตรวจสอบ
                </p>
                <div className="h-16 flex items-end justify-center">
                  <p className="text-slate-400 print:text-slate-600">
                    (......................................................)
                  </p>
                </div>
                <p className="text-slate-500 print:text-slate-700 mt-1">วันที่ ..... / ..... / .........</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800 print:text-black">
                  ผู้จัดการโรงงาน / ผู้อนุมัติ
                </p>
                <div className="h-16 flex items-end justify-center">
                  <p className="text-slate-400 print:text-slate-600">
                    (......................................................)
                  </p>
                </div>
                <p className="text-slate-500 print:text-slate-700 mt-1">วันที่ ..... / ..... / .........</p>
              </div>
            </div>

            <div className="mt-6 text-center text-[10px] text-slate-400 print:text-slate-500">
              เอกสารรายงานผลการตรวจนับคลังสินค้าคอนกรีต • ระบบ Concrete Mobile Stock Counting
            </div>
          </footer>
        </div>
      </main>

      {/* Global Print Stylesheet */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}
