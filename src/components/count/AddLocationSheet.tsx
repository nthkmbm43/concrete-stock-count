"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, Package, Rows3 } from "lucide-react";
import { toast } from "sonner";

interface AddLocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlantId: number;
  unit: string;
  onAddLocation: (params: {
    plant_id: number;
    lock_code: string;
    row_code: string;
    quantity: number;
  }) => void;
}

export const AddLocationSheet: React.FC<AddLocationSheetProps> = ({
  open,
  onOpenChange,
  defaultPlantId,
  unit,
  onAddLocation,
}) => {
  const [plantId, setPlantId] = useState(defaultPlantId);
  const [lockCode, setLockCode] = useState("");
  const [rowCode, setRowCode] = useState("");
  const [quantity, setQuantity] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockCode.trim() || !rowCode.trim()) {
      toast.error("กรุณาระบุล็อคและแถวของจุดวาง");
      return;
    }

    onAddLocation({
      plant_id: plantId,
      lock_code: lockCode.trim().toUpperCase(),
      row_code: rowCode.trim(),
      quantity: Math.max(0, quantity),
    });

    toast.success(`เพิ่มจุดวาง ล็อค ${lockCode.trim().toUpperCase()} แถว ${rowCode.trim()} เรียบร้อยแล้ว`);
    setLockCode("");
    setRowCode("");
    setQuantity(0);
    onOpenChange(false);
  };

  const quickLocks = ["A1", "A2", "A3", "B1", "B2", "B3", "B5", "C1", "C2", "D1"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <MapPin className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <SheetTitle className="text-lg font-black text-slate-900">
                เพิ่มจุดวางสินค้าใหม่ (New Location)
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500">
                กรณีเดินพบสินค้าอยู่นอกจุดวางเดิม สามารถเพิ่มและนับรวมได้ทันที
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-3">
          {/* Plant Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              โรงงาน
            </label>
            <select
              value={plantId}
              onChange={(e) => setPlantId(parseInt(e.target.value))}
              className="w-full h-11 rounded-2xl border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
            >
              <option value={1}>โรง 1 (คลังวัตถุดิบ)</option>
              <option value={2}>โรง 2 (คลังสินค้า 2)</option>
              <option value={3}>โรง 3 (ผลิตภัณฑ์สำเร็จรูป)</option>
              <option value={4}>โรง 4 (สินค้าภายนอก)</option>
            </select>
          </div>

          {/* Lock & Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                <Package className="h-3.5 w-3.5 text-blue-600" />
                <span>รหัสล็อค (Lock)</span> <span className="text-red-500">*</span>
              </label>
              <Input
                value={lockCode}
                onChange={(e) => setLockCode(e.target.value)}
                placeholder="เช่น A3 หรือ C2"
                className="font-mono uppercase font-black text-base h-12"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                <Rows3 className="h-3.5 w-3.5 text-slate-500" />
                <span>แถว (Row)</span> <span className="text-red-500">*</span>
              </label>
              <Input
                value={rowCode}
                onChange={(e) => setRowCode(e.target.value)}
                placeholder="เช่น 1, 2, 3, 6"
                className="font-mono font-black text-base h-12"
                required
              />
            </div>
          </div>

          {/* Quick Lock Suggestions */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
              เลือกล็อคด่วน:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickLocks.map((ql) => (
                <button
                  key={ql}
                  type="button"
                  onClick={() => setLockCode(ql)}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                >
                  {ql}
                </button>
              ))}
            </div>
          </div>

          {/* Initial quantity at this new location */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              จำนวนที่นับได้ ณ จุดนี้ ({unit})
            </label>
            <Input
              type="number"
              inputMode="numeric"
              value={quantity === 0 ? "" : quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="font-black text-xl text-blue-600 h-13"
            />
          </div>

          <SheetFooter className="mt-4 flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-13 rounded-2xl font-bold"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1 h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5"
            >
              <Plus className="h-5 w-5 stroke-[3]" />
              <span>เพิ่มจุดวาง</span>
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
