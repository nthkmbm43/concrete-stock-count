"use client";

import React, { useRef } from "react";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  value: number;
  onChange: (val: number) => void;
  unit: string;
  min?: number;
  className?: string;
  onReset?: () => void;
  initialValue?: number;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  unit,
  min = 0,
  className,
  onReset,
  initialValue,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDecrement = (step: number = 1) => {
    const newVal = Math.max(min, value - step);
    onChange(newVal);
  };

  const handleIncrement = (step: number = 1) => {
    onChange(value + step);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange(0);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= min) {
      onChange(parsed);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-3 w-full", className)}>
      <div className="flex items-center justify-between w-full gap-3">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={() => handleDecrement(1)}
          disabled={value <= min}
          aria-label="ลดจำนวน"
          className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all touch-press shadow-xs border-2 border-slate-200"
        >
          <Minus className="h-8 w-8 stroke-[3]" />
        </button>

        {/* Center Giant Input Area */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex-1 flex flex-col items-center justify-center h-20 sm:h-24 px-3 rounded-3xl bg-white border-2 border-blue-500/80 shadow-md shadow-blue-500/5 cursor-text transition-all focus-within:ring-4 focus-within:ring-blue-500/20"
        >
          <div className="flex items-baseline justify-center gap-1.5 w-full">
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value === 0 ? "0" : value}
              onChange={handleInputChange}
              className="w-full text-center font-black text-4xl sm:text-5xl text-slate-900 bg-transparent outline-none tracking-tight"
            />
          </div>
          <span className="text-xs font-bold text-slate-400 -mt-1">{unit}</span>
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={() => handleIncrement(1)}
          aria-label="เพิ่มจำนวน"
          className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all touch-press shadow-md shadow-blue-600/30 border-2 border-blue-500"
        >
          <Plus className="h-8 w-8 stroke-[3]" />
        </button>
      </div>

      {/* Quick Add Pills (Batching) */}
      <div className="flex items-center justify-between w-full gap-2 pt-1">
        <div className="flex items-center gap-1.5 flex-1">
          {[5, 10, 50].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => handleIncrement(step)}
              className="flex-1 py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-xs font-bold text-slate-700 transition-all border border-slate-200/80 touch-press"
            >
              +{step}
            </button>
          ))}
        </div>

        {initialValue !== undefined && onReset && (
          <button
            type="button"
            onClick={onReset}
            title="รีเซ็ตเป็นยอดยกมา"
            className="flex items-center gap-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all border border-amber-200 touch-press"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>ยอดยกมา ({initialValue})</span>
          </button>
        )}
      </div>
    </div>
  );
};
