"use client";

import React from "react";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { DifferenceBadge } from "./DifferenceBadge";
import { Clock, User, ShieldAlert, CheckCircle2 } from "lucide-react";

export interface TimelineEntry {
  type: "COUNT" | "ADJUSTMENT";
  id: string;
  quantity: number;
  previous_quantity: number;
  difference: number;
  by_name: string;
  timestamp: string;
  notes?: string;
  status?: string;
}

interface HistoryTimelineProps {
  entries: TimelineEntry[];
  unit: string;
  emptyMessage?: string;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  entries,
  unit,
  emptyMessage = "ยังไม่มีประวัติการนับสำหรับสินค้านี้",
}) => {
  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center bg-slate-50">
        <Clock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:bottom-2 before:top-2 before:left-[11px] before:w-0.5 before:bg-slate-200">
      {entries.map((entry, idx) => {
        const isLatest = idx === 0;
        const isAdjustment = entry.type === "ADJUSTMENT";

        return (
          <div key={entry.id} className="relative group">
            {/* Timeline Node Dot */}
            <div
              className={`absolute -left-[30px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${
                isAdjustment
                  ? "bg-amber-500 text-white"
                  : isLatest
                  ? "bg-blue-600 text-white"
                  : "bg-slate-300 text-slate-700"
              }`}
            >
              {isAdjustment ? (
                <ShieldAlert className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
            </div>

            {/* Content Card */}
            <div
              className={`rounded-2xl border p-3.5 transition-all ${
                isLatest
                  ? "border-blue-300 bg-blue-50/50 shadow-xs"
                  : isAdjustment
                  ? "border-amber-200 bg-amber-50/40"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formatDateTime(entry.timestamp)}</span>
                  {isLatest && (
                    <span className="rounded-md bg-blue-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                      ล่าสุด
                    </span>
                  )}
                  {isAdjustment && (
                    <span className="rounded-md bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                      ปรับยอด
                    </span>
                  )}
                </div>

                <DifferenceBadge diff={entry.difference} size="sm" />
              </div>

              {/* Quantity */}
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl font-black text-slate-900">
                  {formatNumber(entry.quantity)}
                </span>
                <span className="text-xs font-bold text-slate-600">{unit}</span>
                <span className="text-xs text-slate-400 ml-1.5">
                  (จาก {formatNumber(entry.previous_quantity)})
                </span>
              </div>

              {/* User info */}
              <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-bold">{entry.by_name}</span>
              </div>

              {/* Notes / Reason */}
              {entry.notes && (
                <p className="mt-2 text-xs text-slate-500 italic bg-white/70 p-2 rounded-xl border border-slate-100">
                  "{entry.notes}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
