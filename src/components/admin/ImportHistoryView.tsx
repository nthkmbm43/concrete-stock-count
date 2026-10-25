"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  User,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getImportHistoryAction } from "@/actions/import";

export function ImportHistoryView() {
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    const res = await getImportHistoryAction();
    if (res.success && res.batches) {
      setBatches(res.batches);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <History className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-base">ประวัติการนำเข้าไฟล์ข้อมูล</h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {batches.length} รายการ
          </span>
        </div>
        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>รีเฟรช</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
          กำลังโหลดประวัติการนำเข้า...
        </div>
      ) : batches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">ยังไม่มีประวัติการนำเข้า</p>
          <p className="text-xs text-slate-400 mt-1">
            เมื่อคุณอัปโหลดไฟล์สินค้าหรือสต๊อก ประวัติการนำเข้าจะแสดงที่นี่
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => {
            const isExpanded = expandedBatchId === batch.id;
            let parsedErrors: any[] = [];
            try {
              if (batch.errorLog) {
                parsedErrors = JSON.parse(batch.errorLog);
              }
            } catch (e) {}

            return (
              <div
                key={batch.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {batch.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          batch.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : batch.status === "PARTIAL"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {batch.status === "SUCCESS" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : batch.status === "PARTIAL" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        <span>{batch.status}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate max-w-[280px] sm:max-w-md">{batch.fileName}</span>
                      {batch.fileSize > 0 && (
                        <span className="text-xs font-normal text-slate-400">
                          ({formatFileSize(batch.fileSize)})
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        {batch.userName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {new Date(batch.createdAt).toLocaleString("th-TH")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3 text-slate-400" />
                        นโยบาย: {batch.policy === "skip" ? "ข้ามซ้ำ" : batch.policy === "update" ? "อัปเดต" : "ห้ามซ้ำ"}
                      </span>
                    </div>
                  </div>

                  {/* Counters */}
                  <div className="flex items-center gap-2 text-center self-start sm:self-center">
                    <div className="bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-100 min-w-[54px]">
                      <span className="block text-xs font-bold text-slate-900">{batch.totalRows}</span>
                      <span className="text-[10px] text-slate-500">ทั้งหมด</span>
                    </div>
                    <div className="bg-emerald-50 rounded-xl px-2.5 py-1.5 border border-emerald-100 min-w-[54px]">
                      <span className="block text-xs font-bold text-emerald-700">{batch.successCount}</span>
                      <span className="text-[10px] text-emerald-600">สำเร็จ</span>
                    </div>
                    <div className="bg-amber-50 rounded-xl px-2.5 py-1.5 border border-amber-100 min-w-[54px]">
                      <span className="block text-xs font-bold text-amber-700">{batch.skippedCount}</span>
                      <span className="text-[10px] text-amber-600">ข้าม</span>
                    </div>
                    <div className="bg-rose-50 rounded-xl px-2.5 py-1.5 border border-rose-100 min-w-[54px]">
                      <span className="block text-xs font-bold text-rose-700">{batch.errorCount}</span>
                      <span className="text-[10px] text-rose-600">ผิดพลาด</span>
                    </div>
                  </div>
                </div>

                {/* Error log dropdown toggle */}
                {parsedErrors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setExpandedBatchId(isExpanded ? null : batch.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      <span>
                        {isExpanded ? "ซ่อนรายการข้อผิดพลาด" : `ดูข้อผิดพลาด (${parsedErrors.length} รายการ)`}
                      </span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 rounded-xl bg-rose-50/50 border border-rose-200 p-3 text-xs space-y-1.5 max-h-48 overflow-y-auto">
                        {parsedErrors.map((err: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-slate-700">
                            <span className="font-mono text-rose-700 font-bold whitespace-nowrap">
                              แถว {err.rowNumber}:
                            </span>
                            <span>{err.message}</span>
                            {err.suggestedFix && (
                              <span className="text-slate-400">({err.suggestedFix})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
