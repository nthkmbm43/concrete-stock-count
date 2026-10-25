"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DifferenceBadge } from "./DifferenceBadge";
import { InventoryItem } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ConfirmCountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem;
  countedQuantity: number;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export const ConfirmCountSheet: React.FC<ConfirmCountSheetProps> = ({
  open,
  onOpenChange,
  item,
  countedQuantity,
  onConfirm,
  isSubmitting = false,
}) => {
  const previousQuantity = item.current_quantity;
  const difference = countedQuantity - previousQuantity;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader className="text-center sm:text-center items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-2">
            <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
          </div>
          <SheetTitle className="text-xl font-black text-slate-900">
            ยืนยันยอดการนับ?
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-500">
            ตรวจสอบความถูกต้องก่อนบันทึกเข้าระบบ ข้อมูลจะอัปเดตแบบ Realtime
          </SheetDescription>
        </SheetHeader>

        {/* Product Summary Box */}
        <div className="mt-4 rounded-3xl border-2 border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-900 text-white">
              {item.sku}
            </span>
            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {item.size}
            </span>
          </div>
          <h4 className="font-bold text-slate-900 text-base line-clamp-1 mb-3">
            {item.name}
          </h4>

          {/* Counts Comparison Grid */}
          <div className="grid grid-cols-3 gap-2 text-center rounded-2xl bg-white p-3 border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">
                ยอดก่อนหน้า
              </span>
              <span className="text-xl font-bold text-slate-600 mt-0.5 block">
                {formatNumber(previousQuantity)}
              </span>
            </div>

            <div className="border-x border-slate-100">
              <span className="text-[11px] font-bold text-blue-600 block">
                ยอดนับครั้งนี้
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
        </div>

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

        {/* Action Buttons */}
        <SheetFooter className="mt-6 flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1 h-14 rounded-2xl text-base font-bold"
          >
            ยกเลิก
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 h-14 rounded-2xl text-base font-black shadow-lg shadow-blue-600/25"
          >
            {isSubmitting ? "กำลังบันทึก..." : "ยืนยัน"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
