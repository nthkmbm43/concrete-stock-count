"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Package, Rows3, Check } from "lucide-react";
import { toast } from "sonner";

interface EditLocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlantId: number;
  initialLockCode: string;
  initialRowCode: string;
  initialQuantity: number;
  unit: string;
  existingLocations: { lock_code: string; row_code: string }[];
  onSaveLocation: (params: {
    lock_code: string;
    row_code: string;
    quantity: number;
  }) => void;
}

export const EditLocationSheet: React.FC<EditLocationSheetProps> = ({
  open,
  onOpenChange,
  defaultPlantId,
  initialLockCode,
  initialRowCode,
  initialQuantity,
  unit,
  existingLocations,
  onSaveLocation,
}) => {
  const [lockCode, setLockCode] = useState(initialLockCode);
  const [rowCode, setRowCode] = useState(initialRowCode);
  const [quantity, setQuantity] = useState<number>(initialQuantity);

  useEffect(() => {
    if (open) {
      setLockCode(initialLockCode);
      setRowCode(initialRowCode);
      setQuantity(initialQuantity);
    }
  }, [open, initialLockCode, initialRowCode, initialQuantity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLock = lockCode.trim().toUpperCase();
    const cleanRow = rowCode.trim();

    if (!cleanLock || !cleanRow) {
      toast.error("กรุณาระบุล็อคและแถวของจุดวาง");
      return;
    }

    // Duplicate Check per Requirement #19
    const isDuplicate = existingLocations.some(
      (loc) =>
        loc.lock_code.toUpperCase() === cleanLock &&
        loc.row_code === cleanRow &&
        !(loc.lock_code.toUpperCase() === initialLockCode.toUpperCase() && loc.row_code === initialRowCode)
    );

    if (isDuplicate) {
      toast.error(`จุดวาง ล็อค ${cleanLock} แถว ${cleanRow} มีอยู่แล้ว กรุณาเลือกกลับไปแก้`);
      return;
    }

    onSaveLocation({
      lock_code: cleanLock,
      row_code: cleanRow,
      quantity: Math.max(0, quantity),
    });

    toast.success(`อัปเดตจุดวางเป็น ล็อค ${cleanLock} แถว ${cleanRow} เรียบร้อยแล้ว`);
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
                แก้ไขจุดวาง (Edit Location)
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500">
                แก้ไขรหัสล็อค แถว หรือจำนวนของจุดวางนี้
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-3">
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
                placeholder="เช่น B3"
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
                placeholder="เช่น 2"
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
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition-all ${
                    lockCode === ql
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700"
                  }`}
                >
                  {ql}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              จำนวนที่นับได้ ({unit})
            </label>
            <Input
              type="number"
              inputMode="numeric"
              value={quantity === 0 ? "0" : quantity}
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
              <Check className="h-5 w-5 stroke-[3]" />
              <span>บันทึกการแก้ไข</span>
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
