"use client";

import React from "react";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { DifferenceBadge } from "./DifferenceBadge";
import { Clock, User, ShieldAlert, CheckCircle2, StickyNote, MapPin } from "lucide-react";
import { StockCountLocation } from "@/lib/types";

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
  locations?: StockCountLocation[];
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

              {/* Per-Location Breakdown & Notes */}
              {entry.locations && entry.locations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100/90 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>แยกตามจุดวาง ({entry.locations.length} จุด)</span>
                  </span>
                  <div className="space-y-1">
                    {entry.locations.map((loc, lIdx) => (
                      <div
                        key={loc.id || loc.client_id || lIdx}
                        className="rounded-xl bg-white/90 p-2 border border-slate-200/80 text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">
                            ล็อค {loc.lock_code} แถว {loc.row_code}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatNumber(loc.counted_quantity)} {unit}
                          </span>
                        </div>
                        {loc.note && (
                          <div className="mt-1 flex items-start gap-1 text-[11px] text-amber-900 bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/60">
                            <StickyNote className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                            <span className="font-medium">{loc.note}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
