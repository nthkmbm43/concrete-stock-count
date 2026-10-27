"use client";

import React from "react";
import { InventoryItem } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Boxes,
  MapPin,
  ClipboardList,
  QrCode,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ScanLine,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface ScannedProductSheetProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartCount: (item: InventoryItem) => void;
  onViewQr: (item: InventoryItem) => void;
  onScanNext: () => void;
}

export const ScannedProductSheet: React.FC<ScannedProductSheetProps> = ({
  item,
  open,
  onOpenChange,
  onStartCount,
  onViewQr,
  onScanNext,
}) => {
  if (!item) return null;

  const locations = item.locations || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-8 max-h-[90vh] overflow-y-auto no-scrollbar rounded-t-[2.5rem] border-slate-200">
        <SheetHeader className="text-left pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 flex items-center gap-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              พบข้อมูลสินค้า (Scanned)
            </Badge>
            <Badge variant="default" className="text-[10px] font-bold bg-blue-600">
              โรง {item.plant_id}
            </Badge>
          </div>
          <SheetTitle className="text-lg font-black text-slate-900 mt-2 leading-tight">
            {item.name}
          </SheetTitle>
          <SheetDescription className="font-mono text-xs font-bold text-blue-700">
            SKU: {item.sku}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Current Stock Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-md">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                ยอดสต็อกปัจจุบันในระบบ
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-white">
                  {formatNumber(item.current_quantity)}
                </span>
                <span className="text-sm font-bold text-slate-300">
                  {item.unit || "ชิ้น"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">สถานะสินค้า</span>
              <Badge variant="success" className="mt-1 font-bold text-[10px]">
                {item.status === "ACTIVE" ? "ใช้งานปกติ" : "ไม่เคลื่อนไหว"}
              </Badge>
            </div>
          </div>

          {/* Product Specifications */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
              ข้อมูลจำเพาะ & ขนาดสินค้า
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">ขนาด / มิติ</span>
                <span className="font-bold text-slate-800">{item.size || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">สเปก / รุ่นย่อย</span>
                <span className="font-bold text-slate-800">{item.variant || "-"}</span>
              </div>
            </div>
          </div>

          {/* Storage Locations (จุดวางแยกตามล็อค/แถว) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-blue-600" />
                จุดวางสินค้า ({locations.length} จุด)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                โซน: {item.zone || `โรง ${item.plant_id}`}
              </span>
            </div>

            {locations.length > 0 ? (
              <div className="space-y-2">
                {locations.map((loc, idx) => (
                  <div
                    key={loc.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">
                          ล็อค {loc.lock_code} • แถว {loc.row_code}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {loc.source_type === "NEW" ? "จุดวางเพิ่มใหม่" : "จุดวางมาตรฐาน"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">ยอดคาดหวัง</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatNumber(loc.expected_quantity)} {item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                ยังไม่มีการบันทึกจุดวางละเอียด (สามารถระบุตอนนับสต็อกได้)
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onStartCount(item);
              }}
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 touch-press"
            >
              <ClipboardList className="h-4 w-4" />
              <span>เริ่มตรวจนับสินค้านี้ (Start Count)</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onViewQr(item)}
                className="h-11 rounded-2xl border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <QrCode className="h-4 w-4 text-blue-600" />
                <span>ดู / พิมพ์ QR Code</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={onScanNext}
                className="h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <ScanLine className="h-4 w-4 text-slate-600" />
                <span>สแกนชิ้นต่อไป</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
