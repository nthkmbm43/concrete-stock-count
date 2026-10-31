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
import { Search, Filter, Layers, ArrowLeft, FileSpreadsheet, QrCode, MapPin } from "lucide-react";
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
  const [selectedPile, setSelectedPile] = useState<string>("ALL");

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

  // Distinct Piles/Locations in this plant
  const availablePiles = useMemo(() => {
    const set = new Set<string>();
    plantItems.forEach((item) => {
      (item.locations || []).forEach((l) => {
        if (l.lock_code) set.add(l.lock_code);
      });
      if (item.zone) {
        item.zone.split(",").forEach((z) => {
          const trimmed = z.trim();
          if (trimmed && !trimmed.startsWith("โรง")) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [plantItems]);

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

  // Filtered items (Rule 23: 300ms Debounce + Smart Multi-Term Search)
  const filteredItems = useMemo(() => {
    return plantItems.filter((item) => {
      // 1. Search Query with Multi-Term Matching (e.g. "2.95 5" or "กอง 4" or "รั้ว 3 2.5")
      const q = debouncedSearch.toLowerCase().trim();
      if (q) {
        const terms = q.split(/\s+/).filter(Boolean);
        const locStr = (item.locations || [])
          .map((l) => `${l.lock_code} ${l.row_code}`)
          .join(" ");
        const searchableText = `${item.sku} ${item.name} ${item.size} ${item.variant || ""} ${item.zone || ""} ${locStr}`.toLowerCase();
        const matchesAllTerms = terms.every((term) => searchableText.includes(term));
        if (!matchesAllTerms) return false;
      }

      // 2. Pile Filter
      if (selectedPile !== "ALL") {
        const hasPile =
          (item.locations || []).some((l) => l.lock_code === selectedPile) ||
          (item.zone && item.zone.includes(selectedPile));
        if (!hasPile) return false;
      }

      // 3. Count Status Filter
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
  }, [plantItems, debouncedSearch, selectedPile, filterStatus, itemCountsMap]);

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

  // 1. If NO plant selected, show Plant Selector Screen
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
                  onClick={() => {
                    onSelectPlant(plant.id);
                    setSelectedPile("ALL");
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. If Plant is selected, show Plant Count Screen
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
            placeholder="ค้นหา เช่น '2.95 5', 'กอง 4', 'รั้ว 3', 'ท่อ 80'..."
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

      {/* Yard Pile Selector (ตอบโจทย์ลานเก็บสินค้าจริง เช่น กอง 1-33, ชายคา, รถไฟ, แพ 3-4) */}
      {availablePiles.length > 1 && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              จุดวาง / กองสินค้า ({availablePiles.length} จุด)
            </span>
            {selectedPile !== "ALL" && (
              <button
                onClick={() => setSelectedPile("ALL")}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                ดูทุกล็อค
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedPile("ALL")}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border touch-press",
                selectedPile === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              ทุกล็อค ({plantItems.length})
            </button>
            {availablePiles.map((p) => {
              const countInPile = plantItems.filter(
                (item) =>
                  (item.locations || []).some((l) => l.lock_code === p) ||
                  (item.zone && item.zone.includes(p))
              ).length;
              const isSelected = selectedPile === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPile(p)}
                  className={cn(
                    "whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border touch-press flex items-center gap-1.5",
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs shadow-blue-600/20"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span>{p}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-md text-[10px] font-black",
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {countInPile}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Chips: [ทั้งหมด] [ยังไม่ได้นับ] [นับแล้ว] [มีการนับซ้ำ] */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: "ALL" as CountFilter, label: "ทั้งหมด", count: filterStats.all },
          { id: "UNCOUNTED" as CountFilter, label: "ยังไม่ได้นับ", count: filterStats.uncounted },
          { id: "COUNTED" as CountFilter, label: "นับแล้ว", count: filterStats.counted },
          { id: "RECOUNTED" as CountFilter, label: "นับซ้ำ", count: filterStats.recounted },
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
              ลองเปลี่ยนคำค้นหาหรือเลือกจุดวาง/กองอื่น
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
                selectedPile={selectedPile}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
