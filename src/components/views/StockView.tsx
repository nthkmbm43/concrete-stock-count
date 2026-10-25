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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StockViewProps {
  items: InventoryItem[];
  plants: Plant[];
  currentUser: UserProfile;
  onAdjustStock: (item: InventoryItem) => void;
  onCountItem?: (item: InventoryItem) => void;
  onOpenExport?: () => void;
}

export const StockView: React.FC<StockViewProps> = ({
  items,
  plants,
  currentUser,
  onAdjustStock,
  onCountItem,
  onOpenExport,
}) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedPlant, setSelectedPlant] = useState<number | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "raw_material" | "finished_goods">("ALL");

  const isAdmin = currentUser.role === "ADMIN";

  // Filtered Items (Rule 23: 300ms Debounce)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.size.toLowerCase().includes(q) ||
        (item.zone && item.zone.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Plant
      if (selectedPlant !== "ALL" && item.plant_id !== selectedPlant) {
        return false;
      }

      // Category
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [items, search, selectedPlant, selectedCategory]);

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
              ตรวจสอบยอดคงเหลือ อัปเดตจากยอดนับล่าสุดแบบ Realtime
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

      {/* Search Bar per Requirement #28 */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ, SKU, ขนาด, โรง, โซน..."
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

      {/* Plant Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedPlant("ALL")}
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
              onClick={() => setSelectedPlant(p.id)}
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
      <div className="flex items-center gap-1.5">
        {[
          { id: "ALL" as const, label: "ทั้งหมด" },
          { id: "finished_goods" as const, label: "สินค้าสำเร็จรูป" },
          { id: "raw_material" as const, label: "วัตถุดิบ" },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-xl transition-all border text-center touch-press",
              selectedCategory === c.id
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

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
            return (
              <div
                key={item.id}
                className="rounded-3xl border-2 border-slate-200/90 bg-white p-4 shadow-sm hover:border-slate-300 transition-all"
              >
                {/* Meta Header */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-900 text-white">
                      {item.sku}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      โรง {item.plant_id} • {item.zone}
                    </span>
                  </div>

                  <Badge variant={item.category === "raw_material" ? "amber" : "info"} className="text-[10px] py-0 px-1.5">
                    {item.category === "raw_material" ? "วัตถุดิบ" : "สินค้าสำเร็จ"}
                  </Badge>
                </div>

                {/* Name */}
                <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
                  {item.name}
                </h4>

                {/* Prominent Size */}
                <div className="mt-1 mb-2.5 flex items-center gap-2">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-0.5">
                    <span className="text-xs font-extrabold text-blue-700">
                      {item.size}
                    </span>
                  </div>
                  {item.variant && item.variant !== "-" && (
                    <span className="text-xs text-slate-500 truncate max-w-[180px]">
                      {item.variant}
                    </span>
                  )}
                </div>

                {/* Current Quantity Card */}
                <div className="rounded-2xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      ยอดคงเหลือปัจจุบัน
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

                {/* Actions: Admin Adjust vs Staff Count */}
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
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
