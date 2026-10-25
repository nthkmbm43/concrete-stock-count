"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryItem } from "@/lib/types";
import { DifferenceBadge } from "@/components/count/DifferenceBadge";
import { formatNumber } from "@/lib/utils";
import { Wrench, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface StockAdjustModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSaveAdjustment: (params: {
    item_id: string;
    plant_id: number;
    new_quantity: number;
    reason: string;
  }) => Promise<void>;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  open,
  onOpenChange,
  item,
  onSaveAdjustment,
}) => {
  const [newQty, setNewQty] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setNewQty(item.current_quantity);
      setReason("");
    }
  }, [item, open]);

  if (!item) return null;

  const previousQuantity = item.current_quantity;
  const difference = newQty - previousQuantity;

  const handleSave = async () => {
    if (!reason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการปรับยอดสต๊อก");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveAdjustment({
        item_id: item.id,
        plant_id: item.plant_id,
        new_quantity: newQty,
        reason: reason.trim(),
      });
      toast.success(`ปรับยอด ${item.sku} เป็น ${newQty} ${item.unit} เรียบร้อยแล้ว`);
      onOpenChange(false);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกการปรับยอด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-lg">ปรับยอดสต๊อก (สิทธิ์แอดมิน)</SheetTitle>
              <SheetDescription>
                ปรับยอดเมื่อพบข้อมูลตกหล่นหรือนับผิด ระบบจะบันทึกประวัติการปรับยอดโดยละเอียด
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Product Details */}
        <div className="my-4 rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded-md">
              {item.sku}
            </span>
            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {item.size}
            </span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            โรง {item.plant_id} • {item.zone}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 text-center">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">
                ยอดปัจจุบัน
              </span>
              <span className="text-xl font-black text-slate-700">
                {formatNumber(previousQuantity)} {item.unit}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-blue-600 font-bold block">
                ผลต่างหลังปรับ
              </span>
              <div className="mt-1 flex justify-center">
                <DifferenceBadge diff={difference} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              ยอดใหม่ที่ถูกต้อง ({item.unit}) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              inputMode="numeric"
              value={newQty}
              onChange={(e) => setNewQty(parseFloat(e.target.value) || 0)}
              className="text-xl font-black h-13"
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              เหตุผลในการปรับยอด (Admin Reason) <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เช่น: ตรวจซ้ำ พบตกหล่นอีก 2 ต้น ที่หลังโรงงาน"
              className="h-12 text-sm"
            />
            {/* Quick reason suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                "ตรวจซ้ำ พบตกหล่นอีก 2 ต้น",
                "คีย์ตัวเลขผิดตอนนับ",
                "สินค้าชำรุดรอตัดยอดจำหน่าย",
                "ย้ายตำแหน่งวางชั่วคราว",
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setReason(sug)}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg transition-all"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6 flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1 h-13 rounded-2xl"
          >
            ยกเลิก
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 h-13 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            {isSubmitting ? "กำลังบันทึก..." : "บันทึกการปรับยอด"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
