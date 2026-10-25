"use client";

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react";
import {
  Plus,
  Minus,
  Check,
  Package,
  Rows3,
  MoreVertical,
  MessageSquarePlus,
  StickyNote,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { formatNumber, cn } from "@/lib/utils";
import { toast } from "sonner";

export interface LocationCountCardHandle {
  focusInput: () => void;
}

interface LocationCountCardProps {
  lockCode: string;
  rowCode: string;
  expectedQuantity: number;
  countedQuantity: number;
  unit: string;
  onChange: (val: number) => void;
  onOpenMenu?: () => void;
  isNew?: boolean;
  // Per-Location Note Props
  note?: string;
  onSaveNote?: (newNote: string) => void;
  onDeleteNote?: () => void;
  observationStatus?: "FOUND" | "MOVED" | "NOT_FOUND" | "NEW_LOCATION";
  readOnly?: boolean;
}

const QUICK_PRESETS = [
  "ย้ายจุดวาง",
  "ไม่พบสินค้า",
  "วางชั่วคราว",
  "สินค้าแตก/ชำรุด",
  "วางซ้อนด้านหลัง",
  "ผลิตเพิ่มวันนี้",
];

export const LocationCountCard = forwardRef<LocationCountCardHandle, LocationCountCardProps>(
  (
    {
      lockCode,
      rowCode,
      expectedQuantity,
      countedQuantity,
      unit,
      onChange,
      onOpenMenu,
      isNew = false,
      note = "",
      onSaveNote,
      onDeleteNote,
      observationStatus,
      readOnly = false,
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const diff = countedQuantity - expectedQuantity;
    const isMatch = countedQuantity === expectedQuantity;
    const isOver = diff > 0;

    // Note state
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [tempNote, setTempNote] = useState(note || "");
    const [isExpandedText, setIsExpandedText] = useState(false);

    useEffect(() => {
      setTempNote(note || "");
    }, [note]);

    useImperativeHandle(ref, () => ({
      focusInput: () => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      },
    }));

    const handleDecrement = () => {
      onChange(Math.max(0, countedQuantity - 1));
    };

    const handleIncrement = () => {
      onChange(countedQuantity + 1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        onChange(0);
        return;
      }
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed >= 0) {
        onChange(parsed);
      }
    };

    // Note actions
    const handleStartAddNote = () => {
      if (readOnly) return;
      setTempNote(note || "");
      setIsEditingNote(true);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    };

    const handleSaveNoteSubmit = () => {
      const clean = tempNote.trim();
      if (onSaveNote) {
        onSaveNote(clean);
      }
      setIsEditingNote(false);
      if (clean) {
        toast.success(`บันทึกหมายเหตุ ล็อค ${lockCode} เรียบร้อย`);
      }
    };

    const handleCancelNote = () => {
      setTempNote(note || "");
      setIsEditingNote(false);
    };

    const handleDeleteNoteSubmit = () => {
      if (onDeleteNote) {
        onDeleteNote();
        toast.info(`ลบหมายเหตุ ล็อค ${lockCode} แล้ว`);
      }
    };

    const handleAddPreset = (preset: string) => {
      setTempNote((prev) => {
        if (!prev.trim()) return preset;
        const appended = `${prev.trim()} ${preset}`;
        return appended.slice(0, 500);
      });
      textareaRef.current?.focus();
    };

    // Context-Aware Placeholder
    const getPlaceholder = () => {
      switch (observationStatus) {
        case "MOVED":
          return "เช่น ย้ายไปล็อค B3 แถว 2";
        case "NOT_FOUND":
          return "เช่น ตรวจแล้วไม่พบสินค้าในจุดนี้";
        case "NEW_LOCATION":
          return "เช่น พบวางชั่วคราวเนื่องจากพื้นที่เดิมเต็ม";
        default:
          return "เช่น ย้ายสินค้าไป B3 / พบสินค้าแตกร้าว 2 ต้น";
      }
    };

    return (
      <div className="rounded-3xl border-2 border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all hover:border-blue-400">
        {/* Top Header Row: Badges, New Badge & More Menu (if new) */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Lock & Row Tags + จุดวางใหม่ Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200/90 px-2.5 py-1 text-xs font-black text-blue-700">
              <Package className="h-3.5 w-3.5 text-blue-600" />
              <span>ล็อค {lockCode}</span>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-xs font-black text-slate-700">
              <Rows3 className="h-3.5 w-3.5 text-slate-500" />
              <span>แถว {rowCode}</span>
            </div>

            {isNew && (
              <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                จุดวางใหม่
              </span>
            )}
          </div>

          {/* Right: More Menu (⋯) for NEW locations */}
          {isNew && onOpenMenu && !readOnly && (
            <button
              type="button"
              onClick={onOpenMenu}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-all touch-press shrink-0 -mr-1"
              aria-label="จัดการจุดวาง"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Center / Body: System Expected & Stepper Controls */}
        <div className="mt-3 flex items-center justify-between gap-2">
          {/* System Expected Quantity */}
          <div>
            <span className="text-slate-500 text-xs font-medium block">
              ในระบบ{" "}
              <strong className="text-slate-800 font-bold">
                {formatNumber(expectedQuantity)}
              </strong>{" "}
              {unit}
            </span>
          </div>

          {/* Stepper [-] [Input] [+] */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={countedQuantity <= 0 || readOnly}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all touch-press border border-slate-200"
              aria-label="ลดจำนวน"
            >
              <Minus className="h-4 w-4 stroke-[3]" />
            </button>

            <div
              onClick={() => !readOnly && inputRef.current?.focus()}
              className="flex h-11 w-18 sm:w-20 items-center justify-center rounded-xl border-2 border-blue-500 bg-white shadow-xs"
            >
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={readOnly}
                value={countedQuantity === 0 ? "0" : countedQuantity}
                onChange={handleInputChange}
                className="w-full text-center font-black text-xl text-slate-900 bg-transparent outline-none disabled:bg-slate-50"
              />
            </div>

            <button
              type="button"
              onClick={handleIncrement}
              disabled={readOnly}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all touch-press shadow-sm shadow-blue-600/30"
              aria-label="เพิ่มจำนวน"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Match Status / Difference Badge */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-medium">
            {countedQuantity > 0 ? "ตรวจนับแล้ว" : "รอนับ"}
          </span>

          <div>
            {isMatch ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                <Check className="h-3.5 w-3.5 stroke-[3] text-emerald-600" />
                <span>ตรงกับยอด</span>
              </span>
            ) : isOver ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                +{formatNumber(diff)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                {formatNumber(diff)}
              </span>
            )}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────── */}
        {/* PER-LOCATION NOTE SECTION (Inline Expand) */}
        {/* ──────────────────────────────────────────────────────── */}
        {!isEditingNote && !note && !readOnly && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleStartAddNote}
              className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50/50"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 text-slate-400" />
              <span>+ เพิ่มหมายเหตุจุดนี้</span>
            </button>
          </div>
        )}

        {/* Note Editing Form (Inline Expanded) */}
        {isEditingNote && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2.5 animate-in fade-in-0 duration-150">
            {/* Header & Character counter */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 text-blue-600" />
                <span>หมายเหตุจุดนี้ (ล็อค {lockCode} แถว {rowCode})</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {tempNote.length}/500
              </span>
            </div>

            {/* Quick Preset Chips */}
            <div>
              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 mb-1">
                <Sparkles className="h-3 w-3 text-blue-500" />
                <span>ข้อความด่วน:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {QUICK_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddPreset(preset)}
                    className="text-[11px] px-2 py-0.5 rounded-lg font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/80 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={2}
              maxLength={500}
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full p-2.5 rounded-xl border-2 border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none transition-all"
            />

            {/* Edit Actions */}
            <div className="flex items-center justify-end gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleCancelNote}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveNoteSubmit}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                บันทึกหมายเหตุ
              </button>
            </div>
          </div>
        )}

        {/* Saved Note Display (Compact Collapsed) */}
        {!isEditingNote && note && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 text-amber-600" />
                <span>หมายเหตุจุดนี้:</span>
              </span>

              {!readOnly && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleStartAddNote}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 px-2 py-0.5 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>แก้ไข</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteNoteSubmit}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 px-1.5 py-0.5 rounded-md hover:bg-rose-50 transition-colors"
                    title="ลบหมายเหตุจุดนี้"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>ลบ</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950 font-medium">
              <p
                className={cn(
                  "whitespace-pre-wrap break-words leading-relaxed",
                  !isExpandedText && note.length > 80 && "line-clamp-2"
                )}
              >
                {note}
              </p>

              {note.length > 80 && (
                <button
                  type="button"
                  onClick={() => setIsExpandedText(!isExpandedText)}
                  className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:text-amber-900"
                >
                  <span>{isExpandedText ? "ย่อข้อความ" : "ดูเพิ่มเติม"}</span>
                  {isExpandedText ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

LocationCountCard.displayName = "LocationCountCard";
