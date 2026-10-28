"use client";

import React, { useState, useMemo } from "react";
import {
  Plant,
  CountRound,
  RoundProgress,
  InventoryItem,
  StockCount,
  CountFilter,
} from "@/lib/types";
import { PlantCard } from "@/components/count/PlantCard";
import { ProductCard } from "@/components/count/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, Layers, ArrowLeft, RefreshCw, FileSpreadsheet, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface CountRoundViewProps {
  round: CountRound;
  progress: RoundProgress | null;
  plants: Plant[];
  items: InventoryItem[];
  counts: StockCount[];
  selectedPlantId: number | null;
  onSelectPlant: (plantId: number | null) => void;
  onCountItem: (item: InventoryItem) => void;
  onOpenExport?: () => void;
  onOpenScan?: () => void;
}

export const CountRoundView: React.FC<CountRoundViewProps> = ({
  round,
  progress,
  plants,
  items,
  counts,
  selectedPlantId,
  onSelectPlant,
  onCountItem,
  onOpenExport,
  onOpenScan,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filterStatus, setFilterStatus] = useState<CountFilter>("ALL");

  // Selected plant object
  const currentPlant = useMemo(
    () => plants.find((p) => p.id === selectedPlantId),
    [plants, selectedPlantId]
  );

  // Plant items
  const plantItems = useMemo(() => {
    if (!selectedPlantId) return [];
    return items.filter((item) => item.plant_id === selectedPlantId);
  }, [items, selectedPlantId]);

  // Counts map for current round & plant
  const itemCountsMap = useMemo(() => {
    const map = new Map<string, number>();
    counts
      .filter((c) => c.count_round_id === round.id && c.status === "SUBMITTED")
      .forEach((c) => {
        const curr = map.get(c.inventory_item_id) || 0;
        map.set(c.inventory_item_id, curr + 1);
      });
    return map;
  }, [counts, round.id]);

  // Filtered items (Rule 23: 300ms Debounce)
  const filteredItems = useMemo(() => {
    return plantItems.filter((item) => {
      // 1. Search Query
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.size.toLowerCase().includes(q) ||
        (item.zone && item.zone.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // 2. Count Status Filter
      const countCount = itemCountsMap.get(item.id) || 0;
      if (filterStatus === "UNCOUNTED") {
        return countCount === 0;
      }
      if (filterStatus === "COUNTED") {
        return countCount > 0;
      }
      if (filterStatus === "RECOUNTED") {
        return countCount >= 2;
      }
      return true;
    });
  }, [plantItems, debouncedSearch, filterStatus, itemCountsMap]);

  // Count stats for filter chips
  const filterStats = useMemo(() => {
    let uncounted = 0;
    let counted = 0;
    let recounted = 0;

    plantItems.forEach((item) => {
      const c = itemCountsMap.get(item.id) || 0;
      if (c === 0) uncounted++;
      else {
        counted++;
        if (c >= 2) recounted++;
      }
    });

    return {
      all: plantItems.length,
      uncounted,
      counted,
      recounted,
    };
  }, [plantItems, itemCountsMap]);

  // Current Plant Progress
  const plantProgress = useMemo(() => {
    if (!selectedPlantId || !progress) return null;
    return progress.plants.find((p) => p.plant_id === selectedPlantId);
  }, [selectedPlantId, progress]);

  // 1. If NO plant selected, show Plant Selector Screen (Requirement #18)
  if (!selectedPlantId || !currentPlant) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="rounded-3xl bg-white p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
            <Layers className="h-4 w-4" />
            <span>{round.title}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-black text-slate-900">
              เลือกรอบนับและเลือกโรง
            </h2>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-blue-600">
                {progress?.counted_skus ?? 0}
              </span>
              <span className="text-xs text-slate-400">/ {progress?.total_skus ?? items.length}</span>
              <span className="text-xs font-black text-emerald-600 ml-1">
                ({progress?.percentage ?? 0}%)
              </span>
            </div>
          </div>

          <div className="mt-3">
            <Progress
              value={progress?.percentage ?? 0}
              indicatorColor="bg-blue-600"
              className="h-2.5 bg-slate-100"
            />
          </div>

          {onOpenExport && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
              <span className="text-[11px] font-medium text-slate-500">รายงานสรุปผลการนับ & สต๊อก</span>
              <button
                type="button"
                onClick={onOpenExport}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                ส่งออก / พิมพ์รายงาน
              </button>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-extrabold text-slate-800 px-1 mb-2">
            เลือกโรงที่ต้องการนับ (แตะการ์ดเพื่อเริ่มนับ)
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {plants.map((plant) => {
              const pProg = progress?.plants.find((p) => p.plant_id === plant.id);
              return (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  progress={pProg}
                  onClick={() => onSelectPlant(plant.id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. If Plant is selected, show Plant Count Screen (Requirement #19)
  const pct = plantProgress?.percentage ?? (filterStats.all > 0 ? Math.round((filterStats.counted / filterStats.all) * 100) : 0);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-300">
      {/* Top Header Card with Plant Progress */}
      <div className="rounded-3xl bg-white p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => onSelectPlant(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors touch-press"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>เปลี่ยนโรงงาน</span>
          </button>
          <div className="flex items-center gap-1.5">
            {onOpenExport && (
              <button
                type="button"
                onClick={onOpenExport}
                title="ส่งออกรายงานโรงนี้"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>ส่งออก</span>
              </button>
            )}
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
              {currentPlant.code}
            </span>
          </div>
        </div>

        <div className="flex items-baseline justify-between mb-1">
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {currentPlant.name}
            </h2>
            <p className="text-xs text-slate-500">{currentPlant.description}</p>
          </div>

          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-black text-blue-600">
                {filterStats.counted}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                / {filterStats.all} SKU
              </span>
            </div>
            <span className="text-xs font-black text-emerald-600">{pct}% เสร็จสิ้น</span>
          </div>
        </div>

        <div className="mt-3">
          <Progress
            value={pct}
            indicatorColor={pct === 100 ? "bg-emerald-500" : "bg-blue-600"}
            className="h-2.5 bg-slate-100"
          />
        </div>
      </div>

      {/* Search Bar & Scan Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา SKU / ชื่อสินค้า / ขนาด..."
            className="pl-10.5 pr-4 h-12 rounded-2xl bg-white border-2 border-slate-200/90 text-sm font-semibold placeholder:text-slate-400 focus:border-blue-600 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-1"
            >
              ล้าง
            </button>
          )}
        </div>

        {onOpenScan && (
          <Button
            type="button"
            onClick={onOpenScan}
            title="สแกน QR / บาร์โค้ด"
            aria-label="สแกน QR / บาร์โค้ด"
            className="h-12 px-3.5 shrink-0 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 touch-press font-bold text-xs"
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden xs:inline">สแกน</span>
          </Button>
        )}
      </div>

      {/* Filter Chips per Requirement #19 */}
      {/* [ทั้งหมด] [ยังไม่ได้นับ] [นับแล้ว] [มีการนับซ้ำ] */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: "ALL" as CountFilter, label: "ทั้งหมด", count: filterStats.all },
          { id: "UNCOUNTED" as CountFilter, label: "ยังไม่ได้นับ", count: filterStats.uncounted, color: "text-amber-700 bg-amber-50 border-amber-200" },
          { id: "COUNTED" as CountFilter, label: "นับแล้ว", count: filterStats.counted, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
          { id: "RECOUNTED" as CountFilter, label: "นับซ้ำ", count: filterStats.recounted, color: "text-blue-700 bg-blue-50 border-blue-200" },
        ].map((f) => {
          const isActive = filterStatus === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={cn(
                "whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all border touch-press flex items-center gap-1.5",
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <span>{f.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-md text-[10px] font-black",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Product Cards List */}
      <div className="space-y-3 pt-1">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center bg-white">
            <Filter className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-800">ไม่พบรายการสินค้า</h4>
            <p className="text-xs text-slate-400 mt-1">
              ลองเปลี่ยนคำค้นหาหรือเลือกฟิลเตอร์อื่น
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const countCount = itemCountsMap.get(item.id) || 0;
            const countStatus = countCount >= 2 ? "RECOUNTED" : countCount === 1 ? "COUNTED" : "UNCOUNTED";

            return (
              <ProductCard
                key={item.id}
                item={item}
                onCount={onCountItem}
                countStatus={countStatus}
                countCount={countCount}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
