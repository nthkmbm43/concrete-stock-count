"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  RefreshCw,
  Layers,
  Settings2,
  Table,
  Check,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import {
  CanonicalFieldKey,
  CANONICAL_FIELDS,
} from "@/lib/import/aliases";
import {
  parseImportFileAction,
  validateImportDataAction,
  executeBatchImportAction,
  exportErrorReportAction,
} from "@/actions/import";
import { RawRowData, ValidatedImportItem, RowErrorItem } from "@/lib/import/engine";

export interface DataImportWizardProps {
  onSuccess?: () => void;
  onNavigateToProducts?: () => void;
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
}

export function DataImportWizard({
  onSuccess,
  onNavigateToProducts,
  currentUser,
}: DataImportWizardProps) {
  // Wizard state: 1 to 7
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Type
  const [importType, setImportType] = useState<string>("product_master");

  // Step 2: File
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Step 3 & 4: Parsed Data
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawRowData[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([]);

  // Step 5: Column Mapping
  const [mapping, setMapping] = useState<Record<string, CanonicalFieldKey | "ignore">>({});

  // Step 6: Validation & Policy
  const [duplicatePolicy, setDuplicatePolicy] = useState<"skip" | "update" | "create_only">("skip");
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    totalRows: number;
    readyCount: number;
    skippedCount: number;
    warningCount: number;
    errorCount: number;
    items: ValidatedImportItem[];
    errors: RowErrorItem[];
  } | null>(null);

  // Step 7: Execution & Results
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executeResult, setExecuteResult] = useState<{
    success: boolean;
    batchId?: string;
    successCount?: number;
    skippedCount?: number;
    errorCount?: number;
    error?: string;
  } | null>(null);

  // Error Report state
  const [isExportingErrors, setIsExportingErrors] = useState<boolean>(false);

  // ────────────────────────────────────────────────────────
  // STEP 2: Handle File Drop & Parse
  // ────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      await processSelectedFile(selected);
    }
  };

  const processSelectedFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsParsing(true);
    setParseError(null);

    const formData = new FormData();
    formData.append("file", uploadedFile);

    const res = await parseImportFileAction(formData);
    setIsParsing(false);

    if (res.success && res.sheetNames && res.headers && res.rawRows) {
      setSheetNames(res.sheetNames);
      setSelectedSheet(res.selectedSheet || res.sheetNames[0]);
      setHeaders(res.headers);
      setRawRows(res.rawRows);
      setPreviewRows(res.previewRows || []);
      setMapping(res.initialMapping || {});

      // If more than 1 sheet, go to Step 3 (Sheet Select), else proceed to Step 4 (Preview)
      if (res.sheetNames.length > 1) {
        setCurrentStep(3);
      } else {
        setCurrentStep(4);
      }
    } else {
      setParseError(res.error || "ไม่สามารถอ่านไฟล์ได้");
    }
  };

  // ────────────────────────────────────────────────────────
  // STEP 5 -> 6: Run Validation
  // ────────────────────────────────────────────────────────
  const handleProceedToValidation = async (customPolicy?: "skip" | "update" | "create_only") => {
    const policy = customPolicy || duplicatePolicy;
    setIsValidating(true);

    const res = await validateImportDataAction({
      rawRows,
      mapping,
      duplicatePolicy: policy,
    });

    setIsValidating(false);

    if (res.success && "items" in res && res.items) {
      setValidationResult({
        totalRows: res.totalRows,
        readyCount: res.readyCount,
        skippedCount: res.skippedCount,
        warningCount: res.warningCount,
        errorCount: res.errorCount,
        items: res.items,
        errors: res.errors,
      });
      setCurrentStep(6);
    } else {
      alert((res as any).error || "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล");
    }
  };

  // Change Policy & revalidate
  const handlePolicyChange = (newPolicy: "skip" | "update" | "create_only") => {
    setDuplicatePolicy(newPolicy);
    handleProceedToValidation(newPolicy);
  };

  // ────────────────────────────────────────────────────────
  // STEP 6 -> 7: Execute Import
  // ────────────────────────────────────────────────────────
  const handleExecuteImport = async () => {
    if (!validationResult || !file) return;

    setIsExecuting(true);
    const res = await executeBatchImportAction({
      fileName: file.name,
      fileSize: file.size,
      sheetName: selectedSheet,
      duplicatePolicy,
      items: validationResult.items,
      errors: validationResult.errors,
    });

    setIsExecuting(false);
    setExecuteResult(res);
    setCurrentStep(7);
    if (res.success && onSuccess) {
      onSuccess();
    }
  };

  // ────────────────────────────────────────────────────────
  // Download Error Report
  // ────────────────────────────────────────────────────────
  const handleDownloadErrorReport = async () => {
    if (!validationResult || !file) return;
    setIsExportingErrors(true);

    const res = await exportErrorReportAction(validationResult.errors, file.name);
    setIsExportingErrors(false);

    if (res.success && res.base64 && res.fileName) {
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.base64}`;
      link.download = res.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("ไม่สามารถสร้างรายงานข้อผิดพลาดได้");
    }
  };

  // Reset Wizard
  const handleReset = () => {
    setFile(null);
    setHeaders([]);
    setRawRows([]);
    setPreviewRows([]);
    setMapping({});
    setValidationResult(null);
    setExecuteResult(null);
    setCurrentStep(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Wizard Progress Stepper */}
      <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 overflow-x-auto no-scrollbar py-1">
          {[
            { num: 1, label: "ประเภท" },
            { num: 2, label: "อัปโหลด" },
            { num: 3, label: "แผ่นงาน" },
            { num: 4, label: "ดูข้อมูล" },
            { num: 5, label: "จับคู่คอลัมน์" },
            { num: 6, label: "ตรวจสอบ" },
            { num: 7, label: "ผลลัพธ์" },
          ].map((s, idx) => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <div key={s.num} className="flex items-center gap-1.5 flex-shrink-0">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-100"
                      : isDone
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : s.num}
                </div>
                <span className={isActive ? "text-blue-700 font-bold" : isDone ? "text-slate-800" : "text-slate-400"}>
                  {s.label}
                </span>
                {idx < 6 && <div className="h-0.5 w-3 sm:w-6 bg-slate-200 mx-1" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* ──────────────────────────────────────────────────────── */}
        {/* STEP 1: IMPORT TYPE */}
        {/* ──────────────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-6 max-w-xl mx-auto py-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">เลือกประเภทข้อมูลที่ต้องการนำเข้า</h3>
              <p className="text-xs text-slate-500">
                ระบบรองรับการนำเข้าข้อมูล Master สินค้า สต๊อกยกมา และจุดวางสินค้า
              </p>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => setImportType("product_master")}
                className={`cursor-pointer rounded-2xl border p-4 transition flex items-start gap-3.5 ${
                  importType === "product_master"
                    ? "border-blue-600 bg-blue-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">
                      รายการสินค้าและสต๊อกยกมา (Master Products & Stock)
                    </h4>
                    {importType === "product_master" && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    นำเข้ารหัสสินค้า (SKU), ชื่อสินค้า, โรงงาน 1-4, หมวดหมู่, หน่วยนับ, สต๊อกยกมา,
                    และจุดวางสินค้า (ล็อค/แถว)
                  </p>
                  <span className="mt-2 inline-block text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                    รองรับ Multi-Location รวมจุดวางอัตโนมัติ
                  </span>
                </div>
              </div>

              {/* Other Options (Disabled / Coming Soon) */}
              <div className="opacity-60 rounded-2xl border border-dashed border-slate-200 p-4 flex items-start gap-3.5 bg-slate-50/50">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-700">
                      ผังจุดวางคลังสินค้า (Storage Locations Master)
                    </h4>
                    <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                      ระบบสร้างให้อัตโนมัติจากไฟล์สินค้า
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    จุดวางใหม่ที่พบในไฟล์สินค้าจะถูกสร้างเข้าสู่ระบบทันที
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
              >
                <span>ขั้นตอนถัดไป: อัปโหลดไฟล์</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* STEP 2: FILE UPLOAD */}
        {/* ──────────────────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-6 max-w-xl mx-auto py-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">อัปโหลดไฟล์ข้อมูล Excel หรือ CSV</h3>
              <p className="text-xs text-slate-500">
                รองรับไฟล์นามสกุล .xlsx, .xls หรือ .csv ขนาดไม่เกิน 10MB
              </p>
            </div>

            {/* Template Download Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950">ยังไม่มีไฟล์ Template?</h4>
                  <p className="text-[11px] text-blue-700">
                    ดาวน์โหลดแบบฟอร์มมาตรฐานของ KCON พร้อมตัวอย่างและคำแนะนำ
                  </p>
                </div>
              </div>
              <a
                href="/api/import/template"
                download="kcon-stock-import-template.xlsx"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-blue-700 border border-blue-300 shadow-sm hover:bg-blue-50 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>โหลด Template</span>
              </a>
            </div>

            {/* Drag & Drop Area */}
            <label className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition">
              <UploadCloud className="h-12 w-12 text-blue-600 mb-3" />
              <span className="text-sm font-bold text-slate-800">
                คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
              </span>
              <span className="text-xs text-slate-500 mt-1">
                ไฟล์ .xlsx, .xls หรือ .csv (สูงสุด 10MB)
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={isParsing}
                className="hidden"
              />
            </label>

            {isParsing && (
              <div className="flex items-center justify-center gap-2 text-sm text-blue-700 font-semibold p-4">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>กำลังอ่านและวิเคราะห์หัวตารางในไฟล์...</span>
              </div>
            )}

            {parseError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>ย้อนกลับ</span>
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* STEP 3: SHEET SELECT (if multi-sheets) */}
        {/* ──────────────────────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-6 max-w-xl mx-auto py-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">เลือกแผ่นงาน (Worksheet)</h3>
              <p className="text-xs text-slate-500">
                ไฟล์ Excel ของคุณมีหลายชีท โปรดเลือกชีทที่มีข้อมูลสินค้าที่ต้องการนำเข้า
              </p>
            </div>

            <div className="space-y-2.5">
              {sheetNames.map((sheet) => (
                <div
                  key={sheet}
                  onClick={() => setSelectedSheet(sheet)}
                  className={`cursor-pointer rounded-xl border p-3.5 flex items-center justify-between transition ${
                    selectedSheet === sheet
                      ? "border-blue-600 bg-blue-50/50 text-blue-900 font-bold"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    <span>{sheet}</span>
                  </div>
                  {selectedSheet === sheet && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>ย้อนกลับ</span>
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
              >
                <span>ดูตัวอย่างข้อมูล</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* STEP 4: DATA PREVIEW */}
        {/* ──────────────────────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">ตัวอย่างข้อมูลจากไฟล์</h3>
                <p className="text-xs text-slate-500">
                  แสดงตัวอย่าง {Math.min(previewRows.length, 15)} แถวแรกจากทั้งหมด {rawRows.length} แถว
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                  {headers.length} คอลัมน์ • {rawRows.length} แถว
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-x-auto max-h-80 text-xs">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="border-b border-slate-200 px-3 py-2 text-center font-bold text-slate-600 w-12">
                      #
                    </th>
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        className="border-b border-slate-200 px-3 py-2 text-left font-bold text-slate-700 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.slice(0, 15).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2 text-center text-slate-400 font-mono">{rIdx + 1}</td>
                      {headers.map((h, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-slate-800 whitespace-nowrap">
                          {String(row[h] !== undefined ? row[h] : "-")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(sheetNames.length > 1 ? 3 : 2)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>ย้อนกลับ</span>
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
              >
                <span>จับคู่คอลัมน์ (Column Mapping)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* STEP 5: COLUMN MAPPING */}
        {/* ──────────────────────────────────────────────────────── */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">จับคู่คอลัมน์กับระบบ (Column Mapping)</h3>
                <p className="text-xs text-slate-500">
                  ระบบทำการตรวจจับคอลัมน์อัตโนมัติ คุณสามารถตรวจสอบและปรับเปลี่ยนได้
                </p>
              </div>
              <div className="text-xs text-slate-600">
                <span className="text-rose-500 font-bold">*</span> จำเป็นต้องมี: SKU, ชื่อสินค้า,
                โรงงาน, หน่วยนับ
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-2.5 text-left font-bold text-slate-700">
                      คอลัมน์ในไฟล์ Excel
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2.5 text-left font-bold text-slate-700 hidden sm:table-cell">
                      ตัวอย่างข้อมูลแถวแรก
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2.5 text-left font-bold text-slate-700">
                      จับคู่กับฟิลด์ในระบบ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {headers.map((col, idx) => {
                    const mappedKey = mapping[col] || "ignore";
                    const sampleVal = previewRows[0]?.[col] || "-";

                    return (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                          {col}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 truncate max-w-[200px] hidden sm:table-cell">
                          {String(sampleVal)}
                        </td>
                        <td className="px-4 py-2.5">
                          <select
                            value={mappedKey}
                            onChange={(e) =>
                              setMapping((prev) => ({
                                ...prev,
                                [col]: e.target.value as any,
                              }))
                            }
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold focus:outline-none ${
                              mappedKey !== "ignore"
                                ? "border-blue-500 bg-blue-50/40 text-blue-900"
                                : "border-slate-300 text-slate-500"
                            }`}
                          >
                            <option value="ignore">-- ละเว้น (ไม่ต้องนำเข้า) --</option>
                            <optgroup label="ฟิลด์จำเป็น *">
                              {CANONICAL_FIELDS.filter((f) => f.required).map((f) => (
                                <option key={f.key} value={f.key}>
                                  {f.label} *
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="ฟิลด์เพิ่มเติม">
                              {CANONICAL_FIELDS.filter((f) => !f.required).map((f) => (
                                <option key={f.key} value={f.key}>
                                  {f.label}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>ย้อนกลับ</span>
              </button>
              <button
                onClick={() => handleProceedToValidation()}
                disabled={isValidating}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>กำลังตรวจสอบ...</span>
                  </>
                ) : (
                  <>
                    <span>ตรวจสอบข้อมูล (Validation)</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* STEP 6: VALIDATION & POLICY */}
        {/* ──────────────────────────────────────────────────────── */}
        {currentStep === 6 && validationResult && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">สรุปการตรวจสอบข้อมูล</h3>
                <p className="text-xs text-slate-500">
                  ตรวจสอบความถูกต้อง และเลือกนโยบายจัดการรายการสินค้าที่ซ้ำ
                </p>
              </div>
              {validationResult.errors.length > 0 && (
                <button
                  onClick={handleDownloadErrorReport}
                  disabled={isExportingErrors}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>
                    {isExportingErrors ? "กำลังโหลด..." : "ดาวน์โหลด Error Report (.xlsx)"}
                  </span>
                </button>
              )}
            </div>

            {/* Summary Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="block text-xl font-bold text-slate-800">
                  {validationResult.totalRows}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">ทั้งหมด (แถว)</span>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <span className="block text-xl font-bold text-emerald-700">
                  {validationResult.readyCount}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">พร้อมนำเข้า</span>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <span className="block text-xl font-bold text-amber-700">
                  {validationResult.skippedCount}
                </span>
                <span className="text-[11px] text-amber-600 font-medium">ข้ามรายการซ้ำ</span>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <span className="block text-xl font-bold text-blue-700">
                  {validationResult.warningCount}
                </span>
                <span className="text-[11px] text-blue-600 font-medium">คำเตือน / รวมล็อค</span>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 col-span-2 sm:col-span-1">
                <span className="block text-xl font-bold text-rose-700">
                  {validationResult.errorCount}
                </span>
                <span className="text-[11px] text-rose-600 font-medium">ข้อผิดพลาด</span>
              </div>
            </div>

            {/* Duplicate Policy Radio Box */}
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                นโยบายเมื่อพบรหัสสินค้า (SKU) ซ้ำกับในฐานข้อมูล:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`cursor-pointer rounded-xl border p-3 flex items-start gap-2 text-xs transition ${
                    duplicatePolicy === "skip"
                      ? "border-blue-600 bg-blue-50/60 font-semibold text-blue-950"
                      : "border-slate-200 text-slate-700 hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="policy"
                    checked={duplicatePolicy === "skip"}
                    onChange={() => handlePolicyChange("skip")}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <span className="font-bold">ข้ามรายการ (Skip)</span>
                    <p className="text-[10px] text-slate-500 font-normal">
                      ไม่เปลี่ยนแปลงสินค้าเดิม นำเข้าเฉพาะ SKU ใหม่
                    </p>
                  </div>
                </label>

                <label
                  className={`cursor-pointer rounded-xl border p-3 flex items-start gap-2 text-xs transition ${
                    duplicatePolicy === "update"
                      ? "border-blue-600 bg-blue-50/60 font-semibold text-blue-950"
                      : "border-slate-200 text-slate-700 hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="policy"
                    checked={duplicatePolicy === "update"}
                    onChange={() => handlePolicyChange("update")}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <span className="font-bold">อัปเดตข้อมูล (Update)</span>
                    <p className="text-[10px] text-slate-500 font-normal">
                      อัปเดตชื่อ จุดวาง และปรับยอดสต๊อกพร้อม Audit
                    </p>
                  </div>
                </label>

                <label
                  className={`cursor-pointer rounded-xl border p-3 flex items-start gap-2 text-xs transition ${
                    duplicatePolicy === "create_only"
                      ? "border-blue-600 bg-blue-50/60 font-semibold text-blue-950"
                      : "border-slate-200 text-slate-700 hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="policy"
                    checked={duplicatePolicy === "create_only"}
                    onChange={() => handlePolicyChange("create_only")}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <span className="font-bold">ห้ามซ้ำ (Create Only)</span>
                    <p className="text-[10px] text-slate-500 font-normal">
                      แจ้งเป็น Error หากพบ SKU ที่มีอยู่แล้ว
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Error Detail Table */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800">
                  รายการข้อผิดพลาดและคำเตือน ({validationResult.errors.length} รายการ):
                </span>
                <div className="rounded-xl border border-slate-200 overflow-y-auto max-h-52 text-xs">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="border-b border-slate-200 px-3 py-2 text-left font-bold text-slate-600 w-16">
                          แถว
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left font-bold text-slate-600 w-28">
                          SKU
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left font-bold text-slate-600">
                          ปัญหาที่พบ
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left font-bold text-slate-600 hidden sm:table-cell">
                          คำแนะนำ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validationResult.errors.map((err, idx) => (
                        <tr
                          key={idx}
                          className={err.severity === "error" ? "bg-rose-50/50" : "bg-amber-50/30"}
                        >
                          <td className="px-3 py-2 font-mono font-bold text-slate-700">
                            {err.rowNumber}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-900">{err.sku || "-"}</td>
                          <td className="px-3 py-2 text-slate-800">
                            <span
                              className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                err.severity === "error"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {err.severity === "error" ? "Error" : "Warn"}
                            </span>
                            {err.message}
                          </td>
                          <td className="px-3 py-2 text-slate-500 hidden sm:table-cell">
                            {err.suggestedFix || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(5)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>กลับไปปรับการจับคู่</span>
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={validationResult.readyCount === 0 || isExecuting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>กำลังนำเข้าข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4" />
                    <span>ยืนยันการนำเข้า ({validationResult.readyCount} รายการ)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* STEP 7: EXECUTION RESULTS */}
        {/* ──────────────────────────────────────────────────────── */}
        {currentStep === 7 && executeResult && (
          <div className="space-y-6 max-w-xl mx-auto py-6 text-center">
            {executeResult.success ? (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">นำเข้าข้อมูลสำเร็จ!</h3>
                  <p className="text-xs text-slate-500">
                    ข้อมูลถูกบันทึกเข้าสู่ฐานข้อมูลและพร้อมใช้งานในระบบทันที
                  </p>
                  {executeResult.batchId && (
                    <div className="inline-block mt-2 font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                      Batch ID: {executeResult.batchId}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                    <span className="block text-2xl font-bold text-emerald-700">
                      {executeResult.successCount}
                    </span>
                    <span className="text-xs text-emerald-600 font-medium">นำเข้าสำเร็จ</span>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                    <span className="block text-2xl font-bold text-amber-700">
                      {executeResult.skippedCount}
                    </span>
                    <span className="text-xs text-amber-600 font-medium">ข้ามรายการ</span>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                    <span className="block text-2xl font-bold text-rose-700">
                      {executeResult.errorCount}
                    </span>
                    <span className="text-xs text-rose-600 font-medium">ข้อผิดพลาด</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  {onNavigateToProducts && (
                    <button
                      onClick={onNavigateToProducts}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
                    >
                      <Table className="h-4 w-4" />
                      <span>ดูรายการสินค้า</span>
                    </button>
                  )}
                  {validationResult && validationResult.errors.length > 0 && (
                    <button
                      onClick={handleDownloadErrorReport}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                    >
                      <Download className="h-4 w-4" />
                      <span>ดาวน์โหลด Error Report</span>
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>นำเข้าไฟล์ใหม่</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <XCircle className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">เกิดข้อผิดพลาดในการนำเข้า</h3>
                  <p className="text-xs text-rose-600">{executeResult.error}</p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setCurrentStep(6)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
                  >
                    <span>กลับไปตรวจสอบ</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
