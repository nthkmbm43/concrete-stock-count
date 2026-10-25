"use client";

import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { Plus, Minus, Check, Package, Rows3, MoreVertical } from "lucide-react";
import { formatNumber } from "@/lib/utils";

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
}

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
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const diff = countedQuantity - expectedQuantity;
    const isMatch = countedQuantity === expectedQuantity;
    const isOver = diff > 0;

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

          {/* Right: More Menu (⋯) ONLY for NEW locations per Rule 4, 5, 27 */}
          {isNew && onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-all touch-press shrink-0 -mr-1"
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
              disabled={countedQuantity <= 0}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all touch-press border border-slate-200"
              aria-label="ลดจำนวน"
            >
              <Minus className="h-4 w-4 stroke-[3]" />
            </button>

            <div
              onClick={() => inputRef.current?.focus()}
              className="flex h-11 w-18 sm:w-20 items-center justify-center rounded-xl border-2 border-blue-500 bg-white shadow-xs"
            >
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={countedQuantity === 0 ? "0" : countedQuantity}
                onChange={handleInputChange}
                className="w-full text-center font-black text-xl text-slate-900 bg-transparent outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleIncrement}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-90 transition-all touch-press shadow-sm shadow-blue-600/30"
              aria-label="เพิ่มจำนวน"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Bottom Sub-row: Match Status / Difference Badge */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end text-xs">
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
    );
  }
);

LocationCountCard.displayName = "LocationCountCard";
