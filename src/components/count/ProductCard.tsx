"use client";

import React from "react";
import { InventoryItem } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle2, RefreshCw, ClipboardPen } from "lucide-react";

interface ProductCardProps {
  item: InventoryItem;
  onCount: (item: InventoryItem) => void;
  countStatus?: "UNCOUNTED" | "COUNTED" | "RECOUNTED";
  countCount?: number;
  selectedPile?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  onCount,
  countStatus = "UNCOUNTED",
  countCount = 0,
  selectedPile = "ALL",
}) => {
  const isCounted = countStatus === "COUNTED" || countStatus === "RECOUNTED";
  const isRecounted = countStatus === "RECOUNTED" || countCount >= 2;

  // Real location string from storage locations or fallback
  const locationLabel = React.useMemo(() => {
    if (item.locations && item.locations.length > 0) {
      const locStrs = item.locations.map(
        (l) => l.lock_code ? `${l.lock_code}` : `L/${l.row_code || "1"}`
      );
      return locStrs.length <= 3
        ? locStrs.join(", ")
        : `${locStrs.slice(0, 3).join(", ")} +${locStrs.length - 3} กอง`;
    }
    return item.zone || `โรง ${item.plant_id}`;
  }, [item]);

  // Pile specific quantity if filtered by pile
  const pileQuantity = React.useMemo(() => {
    if (selectedPile === "ALL" || !item.locations) return null;
    const match = item.locations.find((l) => l.lock_code === selectedPile);
    return match ? match.expected_quantity : null;
  }, [selectedPile, item.locations]);

  return (
    <div className="relative rounded-3xl border-2 border-slate-200/90 bg-white p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
      {/* Top Meta: SKU & Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-xs font-black tracking-wider px-2 py-0.5 rounded-lg bg-slate-900 text-white">
            {item.sku}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            <MapPin className="h-3 w-3 text-slate-500" />
            {locationLabel}
          </span>
        </div>

        {/* Count Status Tag */}
        {isRecounted ? (
          <Badge variant="amber" className="text-[11px] flex items-center gap-1 font-bold">
            <RefreshCw className="h-3 w-3 animate-spin-slow" />
            นับซ้ำ ({countCount} ครั้ง)
          </Badge>
        ) : isCounted ? (
          <Badge variant="success" className="text-[11px] flex items-center gap-1 font-bold">
            <CheckCircle2 className="h-3 w-3" />
            นับแล้ว
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[11px] font-bold text-slate-500">
            ยังไม่ได้นับ
          </Badge>
        )}
      </div>

      {/* Product Name */}
      <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
        {item.name}
      </h4>

      {/* Prominent Size / Variant (Critical for Concrete Products) */}
      <div className="mt-1.5 mb-3 flex items-center gap-2 flex-wrap">
        <div className="inline-flex items-center rounded-xl bg-blue-50 border border-blue-200 px-3 py-1">
          <span className="text-sm font-extrabold text-blue-700">
            {item.size}
          </span>
        </div>
        {item.variant && item.variant !== "-" && (
          <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">
            {item.variant}
          </span>
        )}
      </div>

      {/* If counting at a specific pile, highlight the pile expected qty */}
      {pileQuantity !== null && (
        <div className="mb-2.5 rounded-xl bg-amber-50 border border-amber-200 p-2 flex items-center justify-between text-xs">
          <span className="font-bold text-amber-800 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-amber-600" />
            ยอดสต๊อกใน {selectedPile}:
          </span>
          <span className="font-black text-amber-900 text-sm">
            {formatNumber(pileQuantity)} {item.unit}
          </span>
        </div>
      )}

      {/* Stock Info Grid */}
      <div className="rounded-2xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between mb-3.5">
        <div>
          <span className="text-[11px] text-slate-500 block leading-tight font-medium">
            {pileQuantity !== null ? "ยอดรวมทั้งโรงงาน" : "Stock ล่าสุด"}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black text-slate-900">
              {formatNumber(item.current_quantity)}
            </span>
            <span className="text-xs font-bold text-slate-600">{item.unit}</span>
          </div>
        </div>

        {/* Count Button */}
        <Button
          onClick={() => onCount(item)}
          className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs touch-press flex items-center gap-1.5"
        >
          <ClipboardPen className="h-4 w-4" />
          <span>{isCounted ? "แก้ไขผลนับ" : "เริ่มนับสต๊อก"}</span>
        </Button>
      </div>
    </div>
  );
};
