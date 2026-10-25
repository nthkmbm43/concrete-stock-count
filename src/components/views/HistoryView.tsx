"use client";

import React, { useState, useMemo } from "react";
import { StockCount, StockAdjustment, InventoryItem, Plant } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { DifferenceBadge } from "@/components/count/DifferenceBadge";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { Search, History, Clock, User, ShieldAlert, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface CombinedHistoryItem {
  id: string;
  type: "COUNT" | "ADJUSTMENT";
  item_id: string;
  plant_id: number;
  by_name: string;
  quantity: number;
  previous_quantity: number;
  difference: number;
  notes?: string;
  timestamp: string;
}

interface HistoryViewProps {
  counts: StockCount[];
  adjustments: StockAdjustment[];
  items: InventoryItem[];
  plants: Plant[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  counts,
  adjustments,
  items,
  plants,
}) => {
  const [search, setSearch] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<number | "ALL">("ALL");
  const [selectedType, setSelectedType] = useState<"ALL" | "COUNT" | "ADJUSTMENT">("ALL");

  // Item lookup map
  const itemMap = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    items.forEach((i) => map.set(i.id, i));
    return map;
  }, [items]);

  // Combine and sort
  const combinedList = useMemo(() => {
    const list: CombinedHistoryItem[] = [];

    counts.forEach((c) => {
      list.push({
        id: c.id,
        type: "COUNT",
        item_id: c.inventory_item_id,
        plant_id: c.plant_id,
        by_name: c.user_name,
        quantity: c.counted_quantity,
        previous_quantity: c.previous_quantity,
        difference: c.difference,
        notes: c.notes,
        timestamp: c.counted_at,
      });
    });

    adjustments.forEach((a) => {
      list.push({
        id: a.id,
        type: "ADJUSTMENT",
        item_id: a.inventory_item_id,
        plant_id: a.plant_id,
        by_name: `${a.adjusted_by_name} (แอดมิน)`,
        quantity: a.new_quantity,
        previous_quantity: a.previous_quantity,
        difference: a.difference,
        notes: a.reason,
        timestamp: a.created_at,
      });
    });

    return list.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [counts, adjustments]);

  // Filter
  const filteredHistory = useMemo(() => {
    return combinedList.filter((entry) => {
      const item = itemMap.get(entry.item_id);

      // Search
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        entry.by_name.toLowerCase().includes(q) ||
        (entry.notes && entry.notes.toLowerCase().includes(q)) ||
        (item && (item.sku.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.size.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      // Plant
      if (selectedPlant !== "ALL" && entry.plant_id !== selectedPlant) {
        return false;
      }

      // Type
      if (selectedType !== "ALL" && entry.type !== selectedType) {
        return false;
      }

      return true;
    });
  }, [combinedList, search, selectedPlant, selectedType, itemMap]);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="rounded-3xl bg-white p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-0.5">
          <History className="h-4 w-4" />
          <span>COUNT & AUDIT LOGS</span>
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              ประวัติการนับทั้งหมด
            </h2>
            <p className="text-xs text-slate-500">
              เก็บบันทึกทุกรายการ ไม่มีการลบหรือเขียนทับประวัติเดิม
            </p>
          </div>
          <span className="text-sm font-bold text-slate-500">
            {filteredHistory.length} รายการ
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาตามชื่อผู้บันทึก, SKU, เหตุผล..."
          className="pl-10.5 pr-4 h-12 rounded-2xl bg-white border-2 border-slate-200/90 text-sm font-semibold placeholder:text-slate-400 focus:border-blue-600 shadow-xs"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedType("ALL")}
          className={cn(
            "whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border touch-press",
            selectedType === "ALL"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-slate-200"
          )}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setSelectedType("COUNT")}
          className={cn(
            "whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border touch-press",
            selectedType === "COUNT"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-slate-600 border-slate-200"
          )}
        >
          การนับของพนักงาน
        </button>
        <button
          onClick={() => setSelectedType("ADJUSTMENT")}
          className={cn(
            "whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border touch-press",
            selectedType === "ADJUSTMENT"
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-white text-slate-600 border-slate-200"
          )}
        >
          การปรับยอด (Admin)
        </button>
      </div>

      {/* Timeline List */}
      <div className="space-y-3 pt-1">
        {filteredHistory.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center bg-white">
            <Clock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-800">ไม่พบประวัติการนับ</h4>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา</p>
          </div>
        ) : (
          filteredHistory.map((entry) => {
            const item = itemMap.get(entry.item_id);
            const isAdjustment = entry.type === "ADJUSTMENT";

            return (
              <div
                key={entry.id}
                className={cn(
                  "rounded-3xl border-2 p-4 transition-all bg-white shadow-xs",
                  isAdjustment
                    ? "border-amber-200 bg-amber-50/20"
                    : "border-slate-200/90"
                )}
              >
                {/* Meta header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-900 text-white">
                      {item ? item.sku : "SKU"}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      โรง {entry.plant_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatDateTime(entry.timestamp)}</span>
                  </div>
                </div>

                {/* Item Name & Size */}
                <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
                  {item ? item.name : "สินค้า"}
                </h4>

                {item && (
                  <div className="mt-1 mb-2.5">
                    <span className="inline-block rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-extrabold text-blue-700">
                      {item.size}
                    </span>
                  </div>
                )}

                {/* Quantities & Difference */}
                <div className="rounded-2xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">
                      {formatNumber(entry.quantity)}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {item ? item.unit : "หน่วย"}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">
                      (เดิม: {formatNumber(entry.previous_quantity)})
                    </span>
                  </div>

                  <DifferenceBadge diff={entry.difference} size="sm" />
                </div>

                {/* By User */}
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold">
                    {isAdjustment ? (
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                    ) : (
                      <User className="h-4 w-4 text-blue-600" />
                    )}
                    <span>{entry.by_name}</span>
                  </div>

                  {isAdjustment && (
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      ปรับยอดโดยแอดมิน
                    </span>
                  )}
                </div>

                {/* Reason / Notes */}
                {entry.notes && (
                  <p className="mt-2 text-xs text-slate-600 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                    "{entry.notes}"
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
