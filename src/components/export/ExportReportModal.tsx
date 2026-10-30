"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Printer,
  SlidersHorizontal,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plant, CountRound } from "@/lib/types";
import { toast } from "sonner";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rounds?: CountRound[];
  activeRoundId?: string;
  plants?: Plant[];
  currentPlantId?: number;
}

export function ExportReportModal({
  isOpen,
  onClose,
  rounds = [],
  activeRoundId,
  plants = [],
  currentPlantId,
}: ExportReportModalProps) {
  const [scope, setScope] = useState<"count_round" | "current_stock">("count_round");
  const [roundId, setRoundId] = useState<string>(activeRoundId || (rounds[0]?.id ?? ""));
  const [plantId, setPlantId] = useState<number>(currentPlantId ?? 0);
  const [differenceOnly, setDifferenceOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"sku" | "name" | "diff_desc" | "location">("sku");
  const [exportingType, setExportingType] = useState<"excel" | "pdf" | null>(null);

  // Keep roundId in sync if activeRoundId changes
  React.useEffect(() => {
    if (activeRoundId && !roundId) {
      setRoundId(activeRoundId);
    }
  }, [activeRoundId, roundId]);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("scope", scope);
    if (scope === "count_round" && roundId) {
      params.set("roundId", roundId);
    }
    if (plantId > 0) {
      params.set("plantId", plantId.toString());
    }
    if (differenceOnly) {
      params.set("differenceOnly", "true");
    }
    params.set("sortBy", sortBy);
    return params.toString();
  };

  const handleExportExcel = async () => {
    try {
      setExportingType("excel");
      const qs = buildQueryString();
      const url = `/api/export/excel?${qs}`;
      const res = await fetch(url, { credentials: "include" });

      if (res.status === 401) {
        toast.error("กรุณาเข้าสู่ระบบก่อนดาวน์โหลดรายงาน (401)");
        window.location.href = `/?redirect=${encodeURIComponent(`/reports/print?${qs}`)}`;
        return;
      }

      if (!res.ok) {
        throw new Error(`ดาวน์โหลดไม่สำเร็จ (${res.status})`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `KCON-Stock-Report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว");
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการดาวน์โหลด Excel");
    } finally {
      setTimeout(() => setExportingType(null), 800);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportingType("pdf");
      const qs = buildQueryString();
      const url = `/api/export/pdf?${qs}`;
      const res = await fetch(url, { credentials: "include" });

      if (res.status === 401) {
        toast.error("กรุณาเข้าสู่ระบบก่อนดาวน์โหลดรายงาน (401)");
        window.location.href = `/?redirect=${encodeURIComponent(`/reports/print?${qs}`)}`;
        return;
      }

      if (!res.ok) {
        throw new Error(`ดาวน์โหลดไม่สำเร็จ (${res.status})`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `KCON-Stock-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("ดาวน์โหลดไฟล์ PDF เรียบร้อยแล้ว");
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการดาวน์โหลด PDF");
    } finally {
      setTimeout(() => setExportingType(null), 800);
    }
  };

  const handleOpenPrint = () => {
    const qs = buildQueryString();
    window.open(`/reports/print?${qs}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-5 sm:p-6 rounded-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                ส่งออกรายงาน & พิมพ์เอกสาร
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Excel (.xlsx), PDF และ พิมพ์ A4 Landscape จากข้อมูลจริงในระบบ
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* 1. Report Scope Segment */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              ประเภทรายงาน
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setScope("count_round")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                  scope === "count_round"
                    ? "bg-white text-blue-700 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                ผลการตรวจนับรอบ
              </button>
              <button
                type="button"
                onClick={() => setScope("current_stock")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                  scope === "current_stock"
                    ? "bg-white text-blue-700 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                สต๊อกปัจจุบัน
              </button>
            </div>
          </div>

          {/* 2. Round Selection (if count_round) */}
          {scope === "count_round" && rounds.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                เลือกรอบตรวจนับ
              </label>
              <select
                value={roundId}
                onChange={(e) => setRoundId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name || r.title} ({r.type} • {r.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Plant Filter */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              ขอบเขตโรงงาน
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPlantId(0)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                  plantId === 0
                    ? "border-blue-600 bg-blue-50/70 text-blue-700 font-semibold"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                ทั้งหมด (ทุกโรง)
              </button>
              {[1, 2, 3, 4].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlantId(id)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                    plantId === id
                      ? "border-blue-600 bg-blue-50/70 text-blue-700 font-semibold"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  โรง {id}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Options: Difference Only & Sort Order */}
          <div className="space-y-2 pt-1 border-t border-slate-200">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-4 h-4 ${differenceOnly ? "text-red-500" : "text-slate-400"}`} />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    เฉพาะรายการที่มีผลต่าง
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    กรองเฉพาะรายการที่ยอดนับไม่ตรงกับระบบ (Diff ≠ 0)
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                id="diffOnly"
                checked={differenceOnly}
                onChange={(e) => setDifferenceOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <label className="text-xs font-semibold text-slate-700">
                  การเรียงลำดับรายการ
                </label>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sku">เรียงตามรหัสสินค้า (SKU A-Z)</option>
                <option value="diff_desc">เรียงตามยอดผลต่าง (มากไปน้อย)</option>
                <option value="location">เรียงตามตำแหน่ง (โรง / ล็อค / แถว)</option>
                <option value="name">เรียงตามชื่อสินค้า</option>
              </select>
            </div>
          </div>

          {/* 5. Action Buttons Block */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            {/* Excel Download Button */}
            <Button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingType !== null}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {exportingType === "excel" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังสร้างไฟล์ Excel (.xlsx)...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  ดาวน์โหลด Excel (.xlsx) รายงานสมบูรณ์
                </>
              )}
            </Button>

            {/* PDF Download Button */}
            <Button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingType !== null}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {exportingType === "pdf" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังสร้างไฟล์ PDF...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  ดาวน์โหลด PDF (.pdf) A4 Landscape
                </>
              )}
            </Button>

            {/* A4 Print View Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenPrint}
              className="w-full border-blue-600 text-blue-700 hover:bg-blue-50 font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              พิมพ์เอกสาร A4 (Print View)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
