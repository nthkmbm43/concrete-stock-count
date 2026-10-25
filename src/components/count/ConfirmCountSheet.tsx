"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DifferenceBadge } from "./DifferenceBadge";
import { InventoryItem } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { AlertCircle, CheckCircle2, FileText, MapPin, StickyNote } from "lucide-react";

interface ConfirmLocationItem {
  lock_code: string;
  row_code: string;
  counted_quantity: number;
  expected_quantity?: number;
  isNew?: boolean;
  note?: string;
}

interface ConfirmCountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem;
  countedQuantity: number;
  locationsCount?: number;
  locations?: ConfirmLocationItem[];
  overallNotes?: string;
  onOverallNotesChange?: (val: string) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export const ConfirmCountSheet: React.FC<ConfirmCountSheetProps> = ({
  open,
  onOpenChange,
  item,
  countedQuantity,
  locationsCount,
  locations,
  overallNotes = "",
  onOverallNotesChange,
  onConfirm,
  isSubmitting = false,
}) => {
  const previousQuantity = item.current_quantity;
  const difference = countedQuantity - previousQuantity;
  const effectiveLocCount = locations ? locations.length : locationsCount || 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="pb-8 max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        <SheetHeader className="text-center sm:text-center items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-2">
            <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
          </div>
          <SheetTitle className="text-xl font-black text-slate-900">
            ยืนยันยอดรวมการนับ?
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            ตรวจสอบความถูกต้องของยอดรวมและจุดวางก่อนบันทึกเข้าระบบ
          </SheetDescription>
        </SheetHeader>

        {/* Product Summary Box */}
        <div className="mt-4 rounded-3xl border-2 border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-900 text-white">
                {item.sku}
              </span>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-500" />
                {effectiveLocCount} จุดวาง
              </span>
            </div>
            {item.size && (
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {item.size}
              </span>
            )}
          </div>

          <h4 className="font-bold text-slate-900 text-base line-clamp-1 mb-3">
            {item.name}
          </h4>

          {/* Counts Comparison Grid */}
          <div className="grid grid-cols-3 gap-2 text-center rounded-2xl bg-white p-3 border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">
                ยอดในระบบ
              </span>
              <span className="text-xl font-bold text-slate-600 mt-0.5 block">
                {formatNumber(previousQuantity)}
              </span>
            </div>

            <div className="border-x border-slate-100">
              <span className="text-[11px] font-bold text-blue-600 block">
                ยอดที่นับได้
              </span>
              <span className="text-2xl font-black text-blue-600 mt-0.5 block">
                {formatNumber(countedQuantity)}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">
                ผลต่าง
              </span>
              <div className="mt-1 flex justify-center">
                <DifferenceBadge diff={difference} size="sm" />
              </div>
            </div>
          </div>

          {/* Location Breakdown with Notes */}
          {locations && locations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block">
                แยกตามจุดวาง ({locations.length} จุด):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {locations.map((loc, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-white p-2.5 border border-slate-200/90 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">
                          ล็อค {loc.lock_code} แถว {loc.row_code}
                        </span>
                        {loc.isNew && (
                          <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            ใหม่
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {formatNumber(loc.counted_quantity)} {item.unit}
                      </span>
                    </div>
                    {loc.note && (
                      <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-900 bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/70">
                        <StickyNote className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                        <span className="font-medium leading-relaxed">{loc.note}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Difference Alert Note if mismatched */}
        {difference !== 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 border border-amber-200 text-amber-800 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <p>
              ยอดนับมีผลต่าง{" "}
              <span className="font-bold">
                {difference > 0 ? `+${difference}` : difference} {item.unit}
              </span>{" "}
              ระบบจะบันทึก History ทั้งหมดเพื่อการตรวจสอบ
            </p>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* OVERALL COUNT NOTE (Section 16-18) */}
        {/* ──────────────────────────────────────────────────────── */}
        <div className="mt-4 space-y-1.5 text-left">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span>หมายเหตุการนับครั้งนี้ (ถ้ามี)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              หมายเหตุภาพรวม
            </span>
          </label>
          <textarea
            rows={2}
            maxLength={500}
            value={overallNotes}
            onChange={(e) => onOverallNotesChange?.(e.target.value)}
            placeholder="เช่น ระหว่างตรวจนับมีการเคลื่อนย้ายสินค้า หรือตรวจพบของวางซ้อน..."
            className="w-full p-3 rounded-2xl border-2 border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none transition-all"
          />
        </div>

        {/* Action Buttons */}
        <SheetFooter className="mt-5 flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1 h-13 rounded-2xl text-base font-bold border-2 border-slate-200"
          >
            ยกเลิก
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 h-13 rounded-2xl text-base font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25"
          >
            {isSubmitting ? "กำลังบันทึก..." : "ยืนยันยอดรวม"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
