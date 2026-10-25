"use client";

import React, { useState, useEffect } from "react";
import {
  InventoryItem,
  CountRound,
  StockCount,
  UserProfile,
} from "@/lib/types";
import { NumberStepper } from "@/components/count/NumberStepper";
import { DifferenceBadge } from "@/components/count/DifferenceBadge";
import { ConfirmCountSheet } from "@/components/count/ConfirmCountSheet";
import { CountSuccessModal } from "@/components/count/CountSuccessModal";
import { HistoryTimeline, TimelineEntry } from "@/components/count/HistoryTimeline";
import { Button } from "@/components/ui/button";
import { formatNumber, formatDateTime } from "@/lib/utils";
import {
  MapPin,
  Clock,
  User,
  Save,
  CheckCircle2,
  RefreshCw,
  History,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

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
  }) => Promise<StockCount>;
  onSaveDraft: (params: {
    round_id: string;
    item_id: string;
    plant_id: number;
    counted_quantity: number;
    notes?: string;
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
  // Stepper quantity starts with current stock or 0
  const [countedQty, setCountedQty] = useState<number>(item.current_quantity);
  const [notes, setNotes] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<TimelineEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Sync state if item changes
  useEffect(() => {
    setCountedQty(item.current_quantity);
    setNotes("");
    setConfirmOpen(false);
    setSuccessOpen(false);

    // Fetch history
    fetchItemHistory(item.id).then(setHistoryEntries);
  }, [item.id, item.current_quantity, fetchItemHistory]);

  const previousQuantity = item.current_quantity;
  const difference = countedQty - previousQuantity;
  const isRecount = Boolean(item.last_counted_at);

  // Save Draft
  const handleSaveDraft = async () => {
    try {
      await onSaveDraft({
        round_id: round.id,
        item_id: item.id,
        plant_id: item.plant_id,
        counted_quantity: countedQty,
        notes: notes || undefined,
      });
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
        counted_quantity: countedQty,
        notes: notes || undefined,
      });

      setConfirmOpen(false);
      setSuccessOpen(true);

      // Refresh history
      const freshHistory = await fetchItemHistory(item.id);
      setHistoryEntries(freshHistory);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการส่งยอดนับ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find next sequential or uncounted item in same plant
  const nextItem = React.useMemo(() => {
    const currentIndex = plantItems.findIndex((i) => i.id === item.id);
    if (currentIndex !== -1 && currentIndex + 1 < plantItems.length) {
      return plantItems[currentIndex + 1];
    }
    // Loop around to first
    return plantItems[0] || null;
  }, [plantItems, item.id]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-16">
      {/* 1. Recount Banner (Requirement #26) */}
      {isRecount && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200/90 p-3 flex items-start gap-2.5 text-amber-900 text-xs">
          <RefreshCw className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">
              สินค้านี้เคยนับแล้ว (ระบบอนุญาตให้นับซ้ำได้):
            </span>
            <p className="mt-0.5 text-amber-800">
              นับล่าสุด: <span className="font-bold">{formatNumber(item.current_quantity)} {item.unit}</span>{" "}
              ({formatDateTime(item.last_counted_at)}) โดย{" "}
              <span className="font-bold">{item.last_counted_by_name || "พนักงาน"}</span>
            </p>
          </div>
        </div>
      )}

      {/* 2. Product Header Information per Requirement #21, #22 */}
      <div className="rounded-3xl bg-white p-4.5 border-2 border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-sm font-black tracking-wider px-2.5 py-0.5 rounded-lg bg-slate-900 text-white">
            {item.sku}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span>โรง {item.plant_id} • {item.zone}</span>
          </div>
        </div>

        <h2 className="text-xl font-black text-slate-900 leading-tight">
          {item.name}
        </h2>

        {/* BOLD Prominent Size / Variant per Requirement #20 */}
        <div className="mt-2 flex items-center gap-2">
          <div className="rounded-xl bg-blue-600 px-3.5 py-1 text-white shadow-xs">
            <span className="text-base font-black tracking-tight">{item.size}</span>
          </div>
          {item.variant && item.variant !== "-" && (
            <span className="text-xs text-slate-600 font-semibold">{item.variant}</span>
          )}
        </div>
      </div>

      {/* 3. Live Count Card (Requirement #22, #23) */}
      <div className="rounded-3xl bg-white p-5 border-2 border-blue-500/80 shadow-md">
        {/* Previous Stock vs Live Difference Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Stock ล่าสุดในระบบ
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-slate-800">
                {formatNumber(previousQuantity)}
              </span>
              <span className="text-xs font-bold text-slate-500">{item.unit}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 block">
              ผลต่างการนับ
            </span>
            <div className="mt-1 flex justify-end">
              <DifferenceBadge diff={difference} size="md" />
            </div>
          </div>
        </div>

        {/* Stepper Input with Giant Numbers and Batch Increment Buttons */}
        <div className="mb-2">
          <label className="text-xs font-extrabold text-slate-700 block text-center mb-2">
            จำนวนที่นับได้จริง ({item.unit}) — แตะที่ตัวเลขเพื่อพิมพ์เองได้
          </label>
          <NumberStepper
            value={countedQty}
            onChange={setCountedQty}
            unit={item.unit}
            initialValue={previousQuantity}
            onReset={() => setCountedQty(previousQuantity)}
          />
        </div>

        {/* Optional quick note */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="หมายเหตุเพิ่มเติม (ถ้ามี เช่น วางซ้อน 2 กอง)..."
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 4. History Collapsible per Requirement #27 */}
      <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-blue-600" />
            <span>ประวัติการนับ SKU นี้ ({historyEntries.length} รายการ)</span>
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

      {/* 5. Sticky Bottom Action Bar per Requirement #24 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md md:max-w-lg bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:px-4 safe-area-bottom shadow-xl flex items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleSaveDraft}
          className="flex-1 h-14 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 touch-press"
        >
          <Save className="h-5 w-5 text-slate-500" />
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
          <span>ยืนยันยอด</span>
        </Button>
      </div>

      {/* Confirm Bottom Sheet */}
      <ConfirmCountSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        item={item}
        countedQuantity={countedQty}
        onConfirm={handleConfirmSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Success Modal with [นับรายการถัดไป] & [กลับรายการสินค้า] */}
      <CountSuccessModal
        open={successOpen}
        item={item}
        countedQuantity={countedQty}
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
