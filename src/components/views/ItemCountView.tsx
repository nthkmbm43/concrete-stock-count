"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  InventoryItem,
  CountRound,
  StockCount,
  UserProfile,
  StockCountLocation,
} from "@/lib/types";
import { LocationCountCard, LocationCountCardHandle } from "@/components/count/LocationCountCard";
import { AddLocationSheet } from "@/components/count/AddLocationSheet";
import { LocationActionSheet } from "@/components/count/LocationActionSheet";
import { EditLocationSheet } from "@/components/count/EditLocationSheet";
import { CountSuccessModal } from "@/components/count/CountSuccessModal";
import { HistoryTimeline, TimelineEntry } from "@/components/count/HistoryTimeline";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DifferenceBadge } from "@/components/count/DifferenceBadge";
import { formatNumber } from "@/lib/utils";
import { DataProvider } from "@/lib/data-provider";
import {
  ScanLine,
  ChevronLeft,
  Info,
  MapPin,
  Database,
  ClipboardList,
  FileEdit,
  Plus,
  Save,
  CheckCircle2,
  History,
  ChevronDown,
  ChevronUp,
  Ruler,
  Package,
} from "lucide-react";
import { toast } from "sonner";

export interface LocationState {
  client_id: string;
  source_type: "SYSTEM" | "NEW";
  storage_location_id?: string;
  lock_code: string;
  row_code: string;
  expected_quantity: number;
  counted_quantity: number;
  isNew: boolean;
}

interface ItemCountViewProps {
  item: InventoryItem;
  round: CountRound;
  currentUser: UserProfile;
  plantItems: InventoryItem[];
  onBack: () => void;
  onSubmitCount: (params: {
    round_id: string;
    item_id: string;
    plant_id: number;
    counted_quantity: number;
    notes?: string;
    locations?: StockCountLocation[];
  }) => Promise<StockCount>;
  onSaveDraft: (params: {
    round_id: string;
    item_id: string;
    plant_id: number;
    counted_quantity: number;
    notes?: string;
    locations?: StockCountLocation[];
  }) => Promise<StockCount>;
  fetchItemHistory: (itemId: string) => Promise<TimelineEntry[]>;
  onSelectNextItem: (nextItem: InventoryItem) => void;
}

export const ItemCountView: React.FC<ItemCountViewProps> = ({
  item,
  round,
  currentUser,
  plantItems,
  onBack,
  onSubmitCount,
  onSaveDraft,
  fetchItemHistory,
  onSelectNextItem,
}) => {
  // 1. Locations State
  const [locations, setLocations] = useState<LocationState[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [hasDraft, setHasDraft] = useState<boolean>(false);

  // Sheets and Modals
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // More Menu (⋯) & Edit Location Sheet
  const [actionLocation, setActionLocation] = useState<LocationState | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Ref map to focus input
  const cardRefs = useRef<Record<string, LocationCountCardHandle | null>>({});

  // History
  const [historyEntries, setHistoryEntries] = useState<TimelineEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Sync draft helper: updates draft in storage if draft was previously saved
  const syncDraftIfActive = async (updatedLocations: LocationState[]) => {
    if (!hasDraft) return;
    try {
      const sumCounted = updatedLocations.reduce((sum, l) => sum + l.counted_quantity, 0);
      const mapped = updatedLocations.map((loc) => ({
        storage_location_id: loc.storage_location_id,
        lock_code: loc.lock_code,
        row_code: loc.row_code,
        previous_quantity: loc.expected_quantity,
        counted_quantity: loc.counted_quantity,
        difference: loc.counted_quantity - loc.expected_quantity,
        source_type: loc.source_type,
        client_id: loc.client_id,
      }));
      await onSaveDraft({
        round_id: round.id,
        item_id: item.id,
        plant_id: item.plant_id,
        counted_quantity: sumCounted,
        notes: notes || undefined,
        locations: mapped,
      });
    } catch (e) {
      console.warn("Failed to auto-sync draft:", e);
    }
  };

  // Setup initial locations when item or round changes
  useEffect(() => {
    // 1. Check for draft first
    const draft = DataProvider.getItemDraftSync(item.id, round.id);

    if (draft && draft.locations && draft.locations.length > 0) {
      setHasDraft(true);
      setLocations(
        draft.locations.map((loc: StockCountLocation, idx: number) => ({
          client_id: loc.client_id || `draft-loc-${idx}-${Date.now()}`,
          source_type: (loc.source_type as "SYSTEM" | "NEW") || (loc.previous_quantity > 0 ? "SYSTEM" : "NEW"),
          storage_location_id: loc.storage_location_id,
          lock_code: loc.lock_code,
          row_code: loc.row_code,
          expected_quantity: loc.previous_quantity,
          counted_quantity: loc.counted_quantity,
          isNew: loc.source_type === "NEW" || loc.previous_quantity === 0,
        }))
      );
      setNotes(draft.notes || "");
      toast.info("โหลดข้อมูลจากแบบร่าง (Draft) ที่บันทึกไว้");
    } else if (item.locations && item.locations.length > 0) {
      // 2. Use item's known storage positions (SYSTEM locations)
      setHasDraft(false);
      setLocations(
        item.locations.map((loc, idx) => ({
          client_id: `sys-loc-${loc.id || idx}`,
          source_type: "SYSTEM",
          storage_location_id: loc.storage_location_id || loc.id,
          lock_code: loc.lock_code,
          row_code: loc.row_code,
          expected_quantity: loc.expected_quantity,
          counted_quantity: loc.expected_quantity,
          isNew: false,
        }))
      );
      setNotes("");
    } else {
      // Fallback single default position
      setHasDraft(false);
      setLocations([
        {
          client_id: `sys-default-1`,
          source_type: "SYSTEM",
          lock_code: "A1",
          row_code: "1",
          expected_quantity: item.current_quantity,
          counted_quantity: item.current_quantity,
          isNew: false,
        },
      ]);
      setNotes("");
    }

    setConfirmOpen(false);
    setSuccessOpen(false);
    setActionLocation(null);
    setActionSheetOpen(false);
    setEditSheetOpen(false);

    // Fetch history
    fetchItemHistory(item.id).then(setHistoryEntries);
  }, [item.id, item.current_quantity, item.locations, round.id, fetchItemHistory]);

  // 2. Computed Summaries per Mockup
  const totalExpected = useMemo(() => {
    return locations.reduce((sum, loc) => sum + loc.expected_quantity, 0);
  }, [locations]);

  const totalCounted = useMemo(() => {
    return locations.reduce((sum, loc) => sum + loc.counted_quantity, 0);
  }, [locations]);

  const totalDifference = totalCounted - totalExpected;
  const remainingUncounted = Math.max(0, totalExpected - totalCounted);

  // Handle quantity change for a location
  const handleLocationCountChange = (index: number, val: number) => {
    setLocations((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], counted_quantity: val };
      syncDraftIfActive(next);
      return next;
    });
  };

  // Add new location dynamically
  const handleAddNewLocation = (params: {
    plant_id: number;
    lock_code: string;
    row_code: string;
    quantity: number;
  }) => {
    const newLoc: LocationState = {
      client_id: `new-loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      source_type: "NEW",
      lock_code: params.lock_code,
      row_code: params.row_code,
      expected_quantity: 0,
      counted_quantity: params.quantity,
      isNew: true,
    };

    setLocations((prev) => {
      const updated = [...prev, newLoc];
      syncDraftIfActive(updated);
      return updated;
    });
  };

  // Open action menu (⋯) for a NEW location
  const handleOpenActionMenu = (loc: LocationState) => {
    setActionLocation(loc);
    setActionSheetOpen(true);
  };

  // Save edited location (Rule 7, 8, 18, 19)
  const handleSaveEditedLocation = (params: {
    lock_code: string;
    row_code: string;
    quantity: number;
  }) => {
    if (!actionLocation) return;

    setLocations((prev) => {
      const updated = prev.map((l) => {
        if (l.client_id === actionLocation.client_id) {
          return {
            ...l,
            lock_code: params.lock_code,
            row_code: params.row_code,
            counted_quantity: params.quantity,
          };
        }
        return l;
      });
      syncDraftIfActive(updated);
      return updated;
    });

    setActionLocation(null);
  };

  // Delete a NEW location with Undo Toast (Rule 10, 11, 12, 20, 21)
  const handleDeleteNewLocation = () => {
    if (!actionLocation) return;

    const targetLoc = actionLocation;
    const targetIndex = locations.findIndex((l) => l.client_id === targetLoc.client_id);

    // 1. Remove from UI immediately
    const updatedLocations = locations.filter((l) => l.client_id !== targetLoc.client_id);
    setLocations(updatedLocations);
    syncDraftIfActive(updatedLocations);
    setActionLocation(null);

    // 2. Show Toast with Undo action per Requirement #11, #12
    toast.info(`ลบจุดวาง ${targetLoc.lock_code} / แถว ${targetLoc.row_code} แล้ว`, {
      action: {
        label: "เลิกทำ",
        onClick: () => {
          // Restore location to its previous position
          setLocations((prev) => {
            const restored = [...prev];
            if (targetIndex >= 0 && targetIndex <= restored.length) {
              restored.splice(targetIndex, 0, targetLoc);
            } else {
              restored.push(targetLoc);
            }
            syncDraftIfActive(restored);
            return restored;
          });
          toast.success(`กู้คืนจุดวาง ${targetLoc.lock_code} / แถว ${targetLoc.row_code} เรียบร้อยแล้ว`);
        },
      },
      duration: 6000,
    });
  };

  // Focus input for "แก้จำนวน"
  const handleFocusQuantityInput = () => {
    if (!actionLocation) return;
    const ref = cardRefs.current[actionLocation.client_id];
    if (ref) {
      setTimeout(() => {
        ref.focusInput();
      }, 100);
    }
  };

  // Format locations for submission
  const mappedCountLocations: StockCountLocation[] = useMemo(() => {
    return locations.map((loc) => ({
      client_id: loc.client_id,
      source_type: loc.source_type,
      storage_location_id: loc.storage_location_id,
      lock_code: loc.lock_code,
      row_code: loc.row_code,
      previous_quantity: loc.expected_quantity,
      counted_quantity: loc.counted_quantity,
      difference: loc.counted_quantity - loc.expected_quantity,
    }));
  }, [locations]);

  // Save Draft
  const handleSaveDraft = async () => {
    try {
      await onSaveDraft({
        round_id: round.id,
        item_id: item.id,
        plant_id: item.plant_id,
        counted_quantity: totalCounted,
        notes: notes || undefined,
        locations: mappedCountLocations,
      });
      setHasDraft(true);
      toast.success("บันทึก Draft แล้ว สามารถกลับมาแก้ไขได้ก่อนยืนยันยอด");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึก Draft");
    }
  };

  // Submit Final
  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmitCount({
        round_id: round.id,
        item_id: item.id,
        plant_id: item.plant_id,
        counted_quantity: totalCounted,
        notes: notes || undefined,
        locations: mappedCountLocations,
      });

      setConfirmOpen(false);
      setSuccessOpen(true);

      const freshHistory = await fetchItemHistory(item.id);
      setHistoryEntries(freshHistory);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการส่งยอดนับ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Next Item Navigation
  const nextItem = useMemo(() => {
    const currentIndex = plantItems.findIndex((i) => i.id === item.id);
    if (currentIndex !== -1 && currentIndex + 1 < plantItems.length) {
      return plantItems[currentIndex + 1];
    }
    return plantItems[0] || null;
  }, [plantItems, item.id]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-20">
      {/* 1. Header Bar: '< นับแยกตามจุดวาง' with Barcode Scanner Icon */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors touch-press"
        >
          <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
          <span className="text-lg font-black text-slate-900">นับแยกตามจุดวาง</span>
        </button>

        <button
          onClick={() => toast.info("กล้องสแกนบาร์โค้ด / QR Code พร้อมใช้งาน")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all touch-press border border-slate-200"
          aria-label="สแกนบาร์โค้ด"
        >
          <ScanLine className="h-5 w-5 text-slate-700" />
        </button>
      </div>

      {/* 2. Product Hero Card matching Mockup */}
      <div className="rounded-3xl border-2 border-slate-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          {/* Concrete Thumbnail */}
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs flex items-center justify-center">
            <div className="h-full w-full bg-linear-to-br from-slate-200 via-slate-300 to-slate-400 flex flex-col justify-between p-1.5">
              <div className="h-2 w-full bg-slate-400 rounded-sm" />
              <div className="h-2 w-full bg-slate-400 rounded-sm" />
              <div className="h-2 w-full bg-slate-400 rounded-sm" />
              <div className="h-2 w-full bg-slate-400 rounded-sm" />
            </div>
            <span className="absolute bottom-1 right-1 text-[9px] font-black px-1 rounded bg-black/60 text-white">
              {item.unit}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-400 block font-mono">
              SKU: {item.sku}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight truncate">
              {item.name}
            </h2>

            {/* Spec Chips */}
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200/90 px-2.5 py-0.5 text-xs font-black text-blue-700">
                <Ruler className="h-3 w-3 text-blue-600" />
                <span>{item.height ? `สูง ${item.height}` : item.size}</span>
              </span>

              {item.width && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
                  <Package className="h-3 w-3 text-slate-500" />
                  <span>หน้า {item.width}</span>
                </span>
              )}
            </div>

            {/* Plant */}
            <div className="mt-1.5 flex items-center gap-1 text-xs font-bold text-slate-600">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>โรง {item.plant_id}</span>
            </div>
          </div>
        </div>

        {/* Warning / Instruction Banner */}
        <div className="mt-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 p-2.5 flex items-start gap-2 text-[11px] text-blue-800">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-snug font-medium">
            สินค้านี้อาจเก็บในหลายล็อค / หลายแถว กรุณาแยกนับตามจุดวางจริง
          </p>
        </div>
      </div>

      {/* 3. Three Stat Badges (Mockup: สต๊อกล่าสุด, นับแล้ว, คงเหลือที่ยังไม่กรอก) */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* สต๊อกล่าสุด */}
        <div className="rounded-2xl bg-white p-3 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 mb-0.5">
            <Database className="h-3.5 w-3.5 text-slate-400" />
            <span>สต๊อกล่าสุด</span>
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-xl font-black text-slate-900">
              {formatNumber(totalExpected)}
            </span>
            <span className="text-[11px] font-bold text-slate-500">{item.unit}</span>
          </div>
        </div>

        {/* นับแล้ว */}
        <div className="rounded-2xl bg-white p-3 border border-blue-200 bg-blue-50/20 shadow-xs">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-blue-600 mb-0.5">
            <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
            <span>นับแล้ว</span>
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-xl font-black text-blue-600">
              {formatNumber(totalCounted)}
            </span>
            <span className="text-[11px] font-bold text-blue-600">{item.unit}</span>
          </div>
        </div>

        {/* คงเหลือที่ยังไม่กรอก */}
        <div className="rounded-2xl bg-white p-3 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 mb-0.5">
            <FileEdit className="h-3.5 w-3.5 text-slate-400" />
            <span>คงเหลือที่ยังไม่กรอก</span>
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-xl font-black text-slate-700">
              {formatNumber(remainingUncounted)}
            </span>
            <span className="text-[11px] font-bold text-slate-500">{item.unit}</span>
          </div>
        </div>
      </div>

      {/* 4. Section: จุดวางสินค้าทั้งหมด */}
      <div>
        <div className="mb-2.5 px-1">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>จุดวางสินค้าทั้งหมด</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            แยกนับตามล็อคและแถว เพื่อรวมยอดจากหลายจุดวาง
          </p>
        </div>

        {/* List of storage positions */}
        <div className="space-y-2.5">
          {locations.map((loc, idx) => (
            <LocationCountCard
              key={loc.client_id}
              ref={(el) => {
                cardRefs.current[loc.client_id] = el;
              }}
              lockCode={loc.lock_code}
              rowCode={loc.row_code}
              expectedQuantity={loc.expected_quantity}
              countedQuantity={loc.counted_quantity}
              unit={item.unit}
              onChange={(val) => handleLocationCountChange(idx, val)}
              onOpenMenu={loc.isNew ? () => handleOpenActionMenu(loc) : undefined}
              isNew={loc.isNew}
            />
          ))}
        </div>

        {/* [+ เพิ่มจุดวาง / ล็อค / แถว] Button */}
        <button
          type="button"
          onClick={() => setAddLocationOpen(true)}
          className="w-full mt-3 h-13 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/40 hover:bg-blue-50 active:bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center gap-2 transition-all touch-press shadow-xs"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          <span>เพิ่มจุดวาง / ล็อค / แถว</span>
        </button>
      </div>

      {/* 5. Summary Row matching Mockup */}
      <div className="rounded-3xl bg-slate-50 border-2 border-slate-200/90 p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">
              รวมในระบบ
            </span>
            <span className="text-2xl font-black text-slate-800 mt-0.5 block">
              {formatNumber(totalExpected)}
            </span>
          </div>

          <div className="border-x border-slate-200">
            <span className="text-[11px] font-black text-blue-600 block">
              รวมที่นับได้
            </span>
            <span className="text-2xl font-black text-blue-600 mt-0.5 block">
              {formatNumber(totalCounted)}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 block">
              ผลต่าง
            </span>
            <div className="mt-1 flex justify-center">
              <DifferenceBadge diff={totalDifference} size="md" />
            </div>
          </div>
        </div>
      </div>

      {/* 6. Notes Input matching Mockup */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1 px-1">
          <FileEdit className="h-3.5 w-3.5 text-slate-400" />
          <span>หมายเหตุ (ถ้ามี)</span>
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="เช่น วางกระจายหลายล็อค ผลิตคนละวัน..."
          className="w-full h-12 px-4 rounded-2xl border-2 border-slate-200/90 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
        />
      </div>

      {/* 7. History Timeline Collapsible */}
      <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-blue-600" />
            <span>ประวัติการนับ SKU นี้ ({historyEntries.length} ครั้ง)</span>
          </div>
          {showHistory ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {showHistory && (
          <div className="p-4 pt-0 border-t border-slate-100">
            <HistoryTimeline entries={historyEntries} unit={item.unit} />
          </div>
        )}
      </div>

      {/* 8. Sticky Bottom Actions matching Mockup */}
      <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md md:max-w-lg bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:px-4 safe-area-bottom shadow-xl flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleSaveDraft}
          className="flex-1 h-14 rounded-2xl border-2 border-slate-300 text-slate-800 font-black text-sm flex items-center justify-center gap-2 touch-press"
        >
          <Save className="h-5 w-5 text-blue-600" />
          <span>บันทึก Draft</span>
        </Button>

        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={() => setConfirmOpen(true)}
          className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 touch-press"
        >
          <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
          <span>ยืนยันยอดรวม</span>
        </Button>
      </div>

      {/* Add Location Sheet */}
      <AddLocationSheet
        open={addLocationOpen}
        onOpenChange={setAddLocationOpen}
        defaultPlantId={item.plant_id}
        unit={item.unit}
        existingLocations={locations.map((l) => ({ lock_code: l.lock_code, row_code: l.row_code }))}
        onAddLocation={handleAddNewLocation}
      />

      {/* More Menu (⋯) Bottom Sheet for NEW locations per Rule 6 */}
      {actionLocation && (
        <LocationActionSheet
          open={actionSheetOpen}
          onOpenChange={setActionSheetOpen}
          lockCode={actionLocation.lock_code}
          rowCode={actionLocation.row_code}
          countedQuantity={actionLocation.counted_quantity}
          unit={item.unit}
          onEdit={() => {
            setActionSheetOpen(false);
            setEditSheetOpen(true);
          }}
          onEditQuantity={handleFocusQuantityInput}
          onDelete={handleDeleteNewLocation}
        />
      )}

      {/* Edit Storage Position Bottom Sheet per Rule 7, 8, 18, 19 */}
      {actionLocation && (
        <EditLocationSheet
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          defaultPlantId={item.plant_id}
          initialLockCode={actionLocation.lock_code}
          initialRowCode={actionLocation.row_code}
          initialQuantity={actionLocation.counted_quantity}
          unit={item.unit}
          existingLocations={locations.map((l) => ({ lock_code: l.lock_code, row_code: l.row_code }))}
          onSaveLocation={handleSaveEditedLocation}
        />
      )}

      {/* Confirmation Bottom Sheet */}
      <Sheet open={confirmOpen} onOpenChange={setConfirmOpen}>
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader className="text-center items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-2">
              <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
            </div>
            <SheetTitle className="text-xl font-black text-slate-900">
              ยืนยันยอดการนับรวม?
            </SheetTitle>
            <SheetDescription className="text-sm text-slate-500">
              รวมยอดนับจาก {locations.length} จุดวาง ระบบจะบันทึก History ทันที
            </SheetDescription>
          </SheetHeader>

          <div className="my-3 rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                {item.sku}
              </span>
              <span className="text-xs font-extrabold text-blue-600">
                {item.height ? `สูง ${item.height}` : item.size}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>

            {/* Location breakdown items */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
              {locations.map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600">
                      ล็อค {loc.lock_code} แถว {loc.row_code}
                    </span>
                    {loc.isNew && (
                      <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                        ใหม่
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {formatNumber(loc.counted_quantity)} {item.unit}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-black text-sm">
              <span className="text-slate-700">ยอดรวมทั้งหมด</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-base">
                  {formatNumber(totalCounted)} {item.unit}
                </span>
                <DifferenceBadge diff={totalDifference} size="sm" />
              </div>
            </div>
          </div>

          <SheetFooter className="mt-4 flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isSubmitting}
              className="flex-1 h-13 rounded-2xl font-bold"
            >
              กลับไปแก้
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="flex-1 h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-600/30"
            >
              {isSubmitting ? "กำลังส่งยอด..." : "ยืนยันยอด"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Success Modal */}
      <CountSuccessModal
        open={successOpen}
        item={item}
        countedQuantity={totalCounted}
        hasNextItem={Boolean(nextItem && nextItem.id !== item.id)}
        onNextItem={() => {
          setSuccessOpen(false);
          if (nextItem && nextItem.id !== item.id) {
            onSelectNextItem(nextItem);
          } else {
            onBack();
          }
        }}
        onBackToList={() => {
          setSuccessOpen(false);
          onBack();
        }}
      />
    </div>
  );
};
