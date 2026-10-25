"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, X, type LucideIcon } from "lucide-react";

export interface StyledSelectOption<T> {
  value: T;
  label: string;
  sublabel?: string;
  description?: string;
  icon?: LucideIcon;
  colorName?: "amber" | "blue" | "violet" | "teal" | "purple" | "slate";
  badgeClass?: string;
  bgLightClass?: string;
  textColorClass?: string;
  borderColorClass?: string;
}

interface StyledSelectProps<T> {
  value: T;
  onChange: (val: T) => void;
  options: StyledSelectOption<T>[];
  title?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function StyledSelect<T extends string | number>({
  value,
  onChange,
  options,
  title = "เลือกรายการ",
  placeholder = "เลือก...",
  className,
  disabled = false,
}: StyledSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const SelectedIcon = selectedOption?.icon;

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  const getIconColorClass = (colorName?: string) => {
    switch (colorName) {
      case "amber":
        return "bg-amber-100 text-amber-700";
      case "blue":
        return "bg-blue-100 text-blue-700";
      case "violet":
        return "bg-purple-100 text-purple-700";
      case "teal":
        return "bg-teal-100 text-teal-700";
      case "purple":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-full h-12 rounded-2xl border-2 bg-white px-3.5 flex items-center justify-between text-left transition-all",
          "focus:outline-none focus:ring-3 focus:ring-blue-100",
          isOpen ? "border-blue-500 ring-3 ring-blue-100" : "border-slate-200 hover:border-slate-300",
          disabled && "opacity-60 cursor-not-allowed bg-slate-50",
          className
        )}
      >
        <div className="flex items-center gap-2.5 truncate mr-2">
          {SelectedIcon && (
            <div
              className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                getIconColorClass(selectedOption?.colorName)
              )}
            >
              <SelectedIcon className="h-4 w-4" />
            </div>
          )}
          {selectedOption ? (
            <div className="truncate flex items-baseline gap-1.5">
              <span className="font-bold text-slate-900 text-sm">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-xs text-slate-500 truncate">
                  — {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-sm font-medium">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-blue-600"
          )}
        />
      </button>

      {/* Bottom Sheet Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in fade-in-0 slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  แตะเพื่อเลือกรายการที่ต้องการ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-3 overflow-y-auto space-y-2 no-scrollbar">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                const IconComponent = opt.icon;

                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full min-h-[56px] p-3 rounded-2xl flex items-center justify-between text-left transition-all border-2",
                      isSelected
                        ? "bg-blue-50/70 border-blue-500 shadow-xs"
                        : "bg-white hover:bg-slate-50 border-slate-200/80"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {IconComponent && (
                        <div
                          className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                            getIconColorClass(opt.colorName)
                          )}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                      )}
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm",
                              isSelected ? "font-bold text-blue-900" : "font-bold text-slate-800"
                            )}
                          >
                            {opt.label}
                          </span>
                          {opt.sublabel && (
                            <span className="text-xs font-semibold text-slate-500">
                              {opt.sublabel}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
