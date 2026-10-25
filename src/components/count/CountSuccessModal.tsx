"use client";

import React, { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { InventoryItem } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { CheckCircle2, ArrowRight, ListFilter } from "lucide-react";
import confetti from "canvas-confetti";

interface CountSuccessModalProps {
  open: boolean;
  item: InventoryItem;
  countedQuantity: number;
  onNextItem: () => void;
  onBackToList: () => void;
  hasNextItem?: boolean;
}

export const CountSuccessModal: React.FC<CountSuccessModalProps> = ({
  open,
  item,
  countedQuantity,
  onNextItem,
  onBackToList,
  hasNextItem = true,
}) => {
  useEffect(() => {
    if (open) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Safe fallback
      }
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={() => {}}>
      <SheetContent
        side="bottom"
        showHandle={false}
        className="pb-8 text-center pt-8"
      >
        {/* Giant Success Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-md shadow-emerald-600/10 mb-4 animate-in zoom-in-75 duration-300">
          <CheckCircle2 className="h-12 w-12 stroke-[2.5]" />
        </div>

        <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          บันทึกสำเร็จ • REALTIME UPDATED
        </span>

        <h3 className="text-2xl font-black text-slate-900 mt-2">
          บันทึกยอดเรียบร้อย
        </h3>

        {/* Big Quantity Display */}
        <div className="my-4 rounded-3xl bg-slate-50 border-2 border-slate-200/80 p-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-800 text-white">
              {item.sku}
            </span>
            <span className="text-xs font-bold text-slate-600">
              {item.name}
            </span>
          </div>

          <div className="flex items-baseline justify-center gap-2 mt-2">
            <span className="text-5xl font-black text-slate-900 tracking-tight">
              {formatNumber(countedQuantity)}
            </span>
            <span className="text-lg font-bold text-slate-500">{item.unit}</span>
          </div>

          <p className="text-xs text-blue-600 font-bold mt-2">
            ขนาด: {item.size} • โรง {item.plant_id} ({item.zone})
          </p>
        </div>

        {/* Buttons per requirement #25 */}
        <div className="space-y-3 mt-6 safe-area-bottom">
          {/* Giant Primary: [นับรายการถัดไป] */}
          {hasNextItem ? (
            <Button
              type="button"
              size="xl"
              onClick={onNextItem}
              className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 touch-press"
            >
              <span>นับรายการถัดไป</span>
              <ArrowRight className="h-6 w-6 stroke-[3]" />
            </Button>
          ) : (
            <Button
              type="button"
              size="xl"
              onClick={onBackToList}
              className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 touch-press"
            >
              <span>นับครบทุกรายการแล้ว! ดูสรุป</span>
            </Button>
          )}

          {/* Secondary: [กลับรายการสินค้า] */}
          <Button
            type="button"
            variant="outline"
            onClick={onBackToList}
            className="w-full h-13 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-base hover:bg-slate-100 flex items-center justify-center gap-2 touch-press"
          >
            <ListFilter className="h-5 w-5" />
            <span>กลับรายการสินค้า</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
