"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Pencil, Trash2, Hash, Package, Rows3 } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface LocationActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lockCode: string;
  rowCode: string;
  countedQuantity: number;
  unit: string;
  onEdit: () => void;
  onEditQuantity: () => void;
  onDelete: () => void;
}

export const LocationActionSheet: React.FC<LocationActionSheetProps> = ({
  open,
  onOpenChange,
  lockCode,
  rowCode,
  countedQuantity,
  unit,
  onEdit,
  onEditQuantity,
  onDelete,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-black text-slate-900">
            จัดการจุดวาง
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            จัดการจุดวางใหม่ที่เพิ่มระหว่างนับสินค้า
          </SheetDescription>
        </SheetHeader>

        {/* Location Info Banner */}
        <div className="my-3 flex items-center justify-between rounded-2xl bg-blue-50/60 border border-blue-200/80 p-3.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-black text-blue-700 bg-white px-2 py-1 rounded-lg border border-blue-200">
              <Package className="h-3.5 w-3.5 text-blue-600" />
              <span>ล็อค {lockCode}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
              <Rows3 className="h-3.5 w-3.5 text-slate-500" />
              <span>แถว {rowCode}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-black text-slate-900 block">
              {formatNumber(countedQuantity)} {unit}
            </span>
          </div>
        </div>

        {/* Action Buttons List per Requirement #6, #26 */}
        <div className="space-y-2 mt-2">
          {/* 1. แก้ไขจุดวาง */}
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onEdit();
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 transition-all touch-press text-left text-sm font-bold text-slate-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-slate-900">แก้ไขจุดวาง</span>
              <span className="text-xs text-slate-400 font-normal">
                เปลี่ยนรหัสล็อค หรือแถวของจุดวางนี้
              </span>
            </div>
          </button>

          {/* 2. แก้จำนวน */}
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onEditQuantity();
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 transition-all touch-press text-left text-sm font-bold text-slate-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shrink-0">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-slate-900">แก้จำนวน</span>
              <span className="text-xs text-slate-400 font-normal">
                โฟกัสไปยังช่องกรอกตัวเลขเพื่อพิมพ์จำนวนใหม่
              </span>
            </div>
          </button>

          {/* 3. ลบจุดวาง */}
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onDelete();
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 active:bg-rose-200/70 transition-all touch-press text-left text-sm font-bold text-rose-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-rose-800">ลบจุดวาง</span>
              <span className="text-xs text-rose-500 font-normal">
                นำจุดวางนี้ออกจากการตรวจนับ (กู้คืนได้)
              </span>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
