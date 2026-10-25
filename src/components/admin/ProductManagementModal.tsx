"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryItem } from "@/lib/types";
import { PackagePlus, Boxes } from "lucide-react";
import { toast } from "sonner";

interface ProductManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSave: (item: Partial<InventoryItem>) => Promise<void>;
}

export const ProductManagementModal: React.FC<ProductManagementModalProps> = ({
  open,
  onOpenChange,
  item,
  onSave,
}) => {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"raw_material" | "finished_goods">("finished_goods");
  const [variant, setVariant] = useState("");
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState("ต้น");
  const [plantId, setPlantId] = useState(2);
  const [zone, setZone] = useState("Zone A");
  const [quantity, setQuantity] = useState(0);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setSku(item.sku);
      setName(item.name);
      setCategory(item.category);
      setVariant(item.variant);
      setSize(item.size);
      setUnit(item.unit);
      setPlantId(item.plant_id);
      setZone(item.zone || "Zone A");
      setQuantity(item.current_quantity);
      setStatus(item.status);
    } else {
      setSku("");
      setName("");
      setCategory("finished_goods");
      setVariant("");
      setSize("");
      setUnit("ต้น");
      setPlantId(2);
      setZone("Zone A");
      setQuantity(0);
      setStatus("ACTIVE");
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || !size.trim()) {
      toast.error("กรุณากรอกรหัสสินค้า ชื่อ และขนาดให้ครบถ้วน");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: item?.id,
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category,
        variant: variant.trim() || "-",
        size: size.trim(),
        unit: unit.trim(),
        plant_id: plantId,
        zone: zone.trim(),
        current_quantity: quantity,
        status,
      });
      toast.success(item ? "แก้ไขข้อมูลสินค้าสำเร็จ" : "เพิ่มสินค้าใหม่เรียบร้อยแล้ว");
      onOpenChange(false);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              {item ? <Boxes className="h-5 w-5" /> : <PackagePlus className="h-5 w-5" />}
            </div>
            <div>
              <SheetTitle className="text-lg">
                {item ? `แก้ไขสินค้า: ${item.sku}` : "เพิ่มสินค้าใหม่เข้าคลัง"}
              </SheetTitle>
              <SheetDescription>
                กรอกรายละเอียดสินค้าคอนกรีตหรือวัตถุดิบ (สิทธิ์แอดมิน)
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 my-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                รหัส SKU <span className="text-red-500">*</span>
              </label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="เช่น FP-250"
                className="font-mono uppercase font-bold text-sm h-11"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                โรงเก็บ <span className="text-red-500">*</span>
              </label>
              <select
                value={plantId}
                onChange={(e) => setPlantId(parseInt(e.target.value))}
                className="w-full h-11 rounded-2xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value={1}>โรง 1 (วัตถุดิบ)</option>
                <option value={2}>โรง 2 (เสารั้ว/เสาไอ)</option>
                <option value={3}>โรง 3 (แผ่นพื้น)</option>
                <option value={4}>โรง 4 (L-Wall/ท่อ)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ชื่อสินค้า <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น เสารั้วคอนกรีตอัดแรง"
              className="text-sm h-11 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ขนาด / ความยาว <span className="text-red-500">*</span>
              </label>
              <Input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="เช่น 2.50 เมตร"
                className="text-sm h-11 font-bold text-blue-600"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                หน่วยนับ <span className="text-red-500">*</span>
              </label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="ต้น / แผ่น / คิว / ถุง"
                className="text-sm h-11"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                รุ่น / Variant
              </label>
              <Input
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="เช่น ลวด 4 เส้น"
                className="text-sm h-11"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ตำแหน่งจัดเก็บ (Zone)
              </label>
              <Input
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="เช่น Zone A / Yard-1"
                className="text-sm h-11 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                หมวดหมู่
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as "raw_material" | "finished_goods")}
                className="w-full h-11 rounded-2xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="finished_goods">สินค้าสำเร็จรูป</option>
                <option value="raw_material">วัตถุดิบ</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                สถานะ
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                className="w-full h-11 rounded-2xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="ACTIVE">เปิดใช้งาน (ACTIVE)</option>
                <option value="INACTIVE">ปิดใช้งาน (INACTIVE)</option>
              </select>
            </div>
          </div>

          {!item && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                สต๊อกเริ่มต้น ({unit})
              </label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="text-sm h-11 font-bold"
              />
            </div>
          )}

          <SheetFooter className="mt-5 flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-2xl"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-2xl font-bold"
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกสินค้า"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
