"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";
import { DIMENSION_UNITS, type DimensionUnit } from "@/lib/master-data";

interface DimensionInputProps {
  label: string;
  value: string;
  unit: DimensionUnit | string;
  onValueChange: (val: string) => void;
  onUnitChange: (unit: DimensionUnit) => void;
  placeholder?: string;
  defaultUnit?: DimensionUnit;
  className?: string;
}

export const DimensionInput: React.FC<DimensionInputProps> = ({
  label,
  value,
  unit,
  onValueChange,
  onUnitChange,
  placeholder = "0.00",
  className,
}) => {
  const [isUnitOpen, setIsUnitOpen] = useState(false);

  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-xs font-bold text-slate-700 block">
        {label}
      </label>
      <div className="relative flex items-stretch h-12 rounded-2xl border-2 border-slate-200 bg-white overflow-hidden transition-all focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-100">
        {/* Numeric / Text Input */}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-3.5 text-sm font-bold text-slate-900 bg-transparent placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
        />

        {/* Attached Unit Dropdown Trigger */}
        <button
          type="button"
          onClick={() => setIsUnitOpen(!isUnitOpen)}
          className="flex items-center gap-1.5 px-3 border-l-2 border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors select-none"
        >
          <span>{unit || "เมตร"}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-slate-400 transition-transform",
              isUnitOpen && "rotate-180 text-blue-600"
            )}
          />
        </button>

        {/* Small Unit Popup */}
        {isUnitOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsUnitOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1.5 z-50 w-28 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                หน่วย
              </div>
              {DIMENSION_UNITS.map((u) => {
                const isSelected = unit === u;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      onUnitChange(u);
                      setIsUnitOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-xs font-semibold flex items-center justify-between text-left transition-colors",
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <span>{u}</span>
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
