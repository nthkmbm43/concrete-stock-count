"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { InventoryItem, Plant, UserProfile } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Search,
  Wrench,
  Boxes,
  MapPin,
  Clock,
  User,
  Filter,
  FileSpreadsheet,
  Upload,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StockViewProps {
  items: InventoryItem[];
  plants: Plant[];
  currentUser: UserProfile;
  onAdjustStock: (item: InventoryItem) => void;
  onCountItem?: (item: InventoryItem) => void;
  onOpenExport?: () => void;
  onOpenScan?: () => void;
  onViewQr?: (item: InventoryItem) => void;
}

export const StockView: React.FC<StockViewProps> = ({
  items,
  plants,
  currentUser,
  onAdjustStock,
  onCountItem,
  onOpenExport,
  onOpenScan,
  onViewQr,
}) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedPlant, setSelectedPlant] = useState<number | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPile, setSelectedPile] = useState<string>("ALL");

  const isAdmin = currentUser.role === "ADMIN";

  // Category counts and definitions for KCON concrete products
  const categoryOptions = useMemo(() => {
    return [
      { id: "ALL", label: "ทั้งหมด", count: items.length },
      { id: "slabs", label: "แผ่นพื้นตัน", count: items.filter((i) => i.category === "slabs").length },
      { id: "pipes", label: "ท่อระบายน้ำ", count: items.filter((i) => i.category === "pipes").length },
      { id: "poles", label: "เสาไฟฟ้า", count: items.filter((i) => i.category === "poles").length },
      { id: "piles", label: "เสาเข็ม", count: items.filter((i) => i.category === "piles").length },
      { id: "fences", label: "เสารั้ว", count: items.filter((i) => i.category === "fences").length },
      { id: "hardscape", label: "อิฐบล็อก/ทางเท้า", count: items.filter((i) => i.category === "hardscape").length },
    ].filter((c) => c.id === "ALL" || c.count > 0);
  }, [items]);

  // Distinct Piles/Locations in current selection
  const availablePiles = useMemo(() => {
    const set = new Set<string>();
    const baseItems = selectedPlant === "ALL" ? items : items.filter((i) => i.plant_id === selectedPlant);
    baseItems.forEach((item) => {
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
  }, [items, selectedPlant]);

  // Filtered Items (Rule 23: 300ms Debounce + Smart Multi-Term Search)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Multi-term search (e.g. "2.95 5", "กอง 4", "รั้ว 3 2.5", "ท่อ 80")
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

      // 2. Plant
      if (selectedPlant !== "ALL" && item.plant_id !== selectedPlant) {
        return false;
      }

      // 3. Category
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }

      // 4. Pile Filter
      if (selectedPile !== "ALL") {
        const hasPile =
          (item.locations || []).some((l) => l.lock_code === selectedPile) ||
          (item.zone && item.zone.includes(selectedPile));
        if (!hasPile) return false;
      }

      return true;
    });
  }, [items, debouncedSearch, selectedPlant, selectedCategory, selectedPile]);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-3xl bg-white p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-0.5">
              <Boxes className="h-4 w-4" />
              <span>STOCK BROWSER</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              ยอดสต๊อกคงเหลือจริง
            </h2>
            <p className="text-xs text-slate-500">
              ข้อมูลจริงจากเอกสารสต๊อกสินค้า ปี 2569 บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด
            </p>
          </div>

          <div className="text-right flex flex-col items-end gap-1">
            <div>
              <span className="text-2xl font-black text-slate-900 block">
                {filteredItems.length}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                จาก {items.length} รายการ
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Link
                href="/admin/import"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                นำเข้า
              </Link>
              {onOpenExport && (
                <button
                  type="button"
                  onClick={onOpenExport}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  ส่งออก
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar & Scan Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา เช่น '2.95 5', 'กอง 4', 'รั้ว 3', 'ท่อ 80'..."
            className="pl-10.5 pr-4 h-12 rounded-2xl bg-white border-2 border-slate-200/90 text-sm font-semibold placeholder:text-slate-400 focus:border-blue-600 shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
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

      {/* Plant Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => {
            setSelectedPlant("ALL");
            setSelectedPile("ALL");
          }}
          className={cn(
            "whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border touch-press",
            selectedPlant === "ALL"
              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
              : "bg-white text-slate-600 border-slate-200"
          )}
        >
          ทุกโรงงาน
        </button>
        {plants.map((p) => {
          const isSelected = selectedPlant === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPlant(p.id);
                setSelectedPile("ALL");
              }}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border touch-press",
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200"
              )}
            >
              โรง {p.id}
            </button>
          );
        })}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categoryOptions.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-xl transition-all border text-center touch-press flex items-center gap-1.5",
              selectedCategory === c.id
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <span>{c.label}</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                selectedCategory === c.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}
            >
              {c.count}
            </span>
          </button>
        ))}
      </div>

      {/* Yard Pile Selector */}
      {availablePiles.length > 1 && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              กรองตามจุดวาง / กองสินค้า ({availablePiles.length} จุด)
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
              ทุกล็อค
            </button>
            {availablePiles.map((p) => {
              const isSelected = selectedPile === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPile(p)}
                  className={cn(
                    "whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border touch-press",
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs shadow-blue-600/20"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Items List */}
      <div className="space-y-3 pt-1">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center bg-white">
            <Filter className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-800">ไม่พบรายการสต๊อก</h4>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const locSummary = (item.locations || []).map((l) => l.lock_code || "L").join(", ");
            const hasLocations = Boolean(locSummary);
            const isZeroStock = item.current_quantity === 0;

            // Pile specific quantity if selected
            const pileQty = selectedPile !== "ALL" && item.locations
              ? item.locations.find((l) => l.lock_code === selectedPile)?.expected_quantity ?? null
              : null;

            return (
              <div
                key={item.id}
                className="rounded-3xl border-2 border-slate-200/90 bg-white p-4 shadow-sm hover:border-slate-300 transition-all"
              >
                {/* Meta Header */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-900 text-white">
                      {item.sku}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-500" />
                      โรง {item.plant_id}{hasLocations ? ` • ${locSummary}` : (item.zone ? ` • ${item.zone}` : "")}
                    </span>
                  </div>

                  <Badge
                    variant={isZeroStock ? "secondary" : "success"}
                    className="text-[10px] py-0 px-1.5 font-bold"
                  >
                    {isZeroStock ? "รอเริ่มนับ" : "มีในสต๊อก"}
                  </Badge>
                </div>

                {/* Name */}
                <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
                  {item.name}
                </h4>

                {/* Prominent Size */}
                <div className="mt-1 mb-2.5 flex items-center gap-2 flex-wrap">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-0.5">
                    <span className="text-xs font-extrabold text-blue-700">
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
                {pileQty !== null && (
                  <div className="mb-2.5 rounded-xl bg-amber-50 border border-amber-200 p-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-800 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-amber-600" />
                      ยอดใน {selectedPile}:
                    </span>
                    <span className="font-black text-amber-900 text-sm">
                      {formatNumber(pileQty)} {item.unit}
                    </span>
                  </div>
                )}

                {/* Current Quantity Card */}
                <div className="rounded-2xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {pileQty !== null ? "ยอดรวมทั้งโรงงาน" : "ยอดคงเหลือปัจจุบัน"}
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
                      <span className="text-[10px] text-slate-400 block">อัปเดตล่าสุด</span>
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

                {/* Actions: Admin Adjust vs Staff Count vs QR Tag */}
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Button
                      onClick={() => onAdjustStock(item)}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10 rounded-xl border-amber-300 bg-amber-50/50 text-amber-900 font-bold hover:bg-amber-100 flex items-center justify-center gap-1.5 touch-press"
                    >
                      <Wrench className="h-4 w-4 text-amber-600" />
                      <span>ปรับยอด (Admin)</span>
                    </Button>
                  )}

                  {onCountItem && (
                    <Button
                      onClick={() => onCountItem(item)}
                      variant="default"
                      size="sm"
                      className="flex-1 h-10 rounded-xl font-bold flex items-center justify-center gap-1.5 touch-press"
                    >
                      <span>นับสินค้านี้</span>
                    </Button>
                  )}

                  {onViewQr && (
                    <Button
                      type="button"
                      onClick={() => onViewQr(item)}
                      variant="outline"
                      size="sm"
                      title="ดูและพิมพ์ป้าย QR Code"
                      aria-label="ดูและพิมพ์ป้าย QR Code"
                      className="h-10 w-10 shrink-0 p-0 rounded-xl border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center touch-press cursor-pointer"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
