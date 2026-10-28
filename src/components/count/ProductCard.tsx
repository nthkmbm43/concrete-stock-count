"use client";

import React from "react";
import { InventoryItem } from "@/lib/types";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, CheckCircle2, RefreshCw } from "lucide-react";

interface ProductCardProps {
  item: InventoryItem;
  onCount: (item: InventoryItem) => void;
  countStatus?: "UNCOUNTED" | "COUNTED" | "RECOUNTED";
  countCount?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  onCount,
  countStatus = "UNCOUNTED",
  countCount = 0,
}) => {
  const isCounted = countStatus === "COUNTED" || countStatus === "RECOUNTED";
  const isRecounted = countStatus === "RECOUNTED" || countCount >= 2;

  // Real location string from storage locations or fallback
  const locationLabel = React.useMemo(() => {
    if (item.locations && item.locations.length > 0) {
      const locStrs = item.locations.map(
        (l) => `${l.lock_code || "L"}/${l.row_code || "1"}`
      );
      return locStrs.length <= 2
        ? locStrs.join(", ")
        : `${locStrs.slice(0, 2).join(", ")} +${locStrs.length - 2}`;
    }
    return item.zone || `โรง ${item.plant_id}`;
  }, [item]);

  return (
    <div className="relative rounded-3xl border-2 border-slate-200/90 bg-white p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
      {/* Top Meta: SKU & Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-black tracking-wider px-2 py-0.5 rounded-lg bg-slate-900 text-white">
            {item.sku}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <MapPin className="h-3 w-3 text-slate-400" />
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
      <div className="mt-1.5 mb-3 flex items-center gap-2">
        <div className="inline-flex items-center rounded-xl bg-blue-50 border border-blue-200 px-3 py-1">
          <span className="text-sm font-extrabold text-blue-700">
            {item.size}
          </span>
        </div>
        {item.variant && item.variant !== "-" && (
          <span className="text-xs text-slate-500 truncate max-w-[160px]">
            {item.variant}
          </span>
        )}
      </div>

      {/* Stock Info Grid */}
      <div className="rounded-2xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between mb-3.5">
        <div>
          <span className="text-[11px] text-slate-500 block leading-tight font-medium">
            Stock ล่าสุด
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black text-slate-900">
              {formatNumber(item.current_quantity)}
            </span>
            <span className="text-xs font-bold text-slate-600">{item.unit}</span>
          </div>
        </div>

        {item.last_counted_at && (
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block leading-tight">
              นับล่าสุด
            </span>
            <div className="flex items-center justify-end gap-1 text-xs font-semibold text-slate-700 mt-0.5">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>{formatDateTime(item.last_counted_at)}</span>
            </div>
            {item.last_counted_by_name && (
              <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500 mt-0.5">
                <User className="h-3 w-3 text-slate-400" />
                <span className="truncate max-w-[95px]">{item.last_counted_by_name}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button: [นับสินค้า] / [นับอีกครั้ง] */}
      <Button
        onClick={() => onCount(item)}
        variant={isCounted ? "outline" : "default"}
        className="w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 text-base touch-press"
      >
        {isCounted ? (
          <>
            <RefreshCw className="h-4 w-4 text-blue-600" />
            <span>นับอีกครั้ง</span>
          </>
        ) : (
          <span>นับสินค้า</span>
        )}
      </Button>
    </div>
  );
};
