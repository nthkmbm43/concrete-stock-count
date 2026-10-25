"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  activeColor?: "green" | "red" | "blue" | "slate";
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  className?: string;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  disabled = false,
}: SegmentedControlProps<T>) {
  const getColorClasses = (option: SegmentOption<T>, isSelected: boolean) => {
    if (!isSelected) {
      return "text-slate-600 hover:text-slate-900 bg-transparent";
    }

    switch (option.activeColor) {
      case "green":
        return "bg-emerald-50 text-emerald-800 border-2 border-emerald-400 shadow-sm font-bold";
      case "red":
        return "bg-rose-50 text-rose-800 border-2 border-rose-300 shadow-sm font-bold";
      case "blue":
        return "bg-blue-50 text-blue-800 border-2 border-blue-400 shadow-sm font-bold";
      default:
        return "bg-white text-slate-900 border-2 border-slate-300 shadow-sm font-bold";
    }
  };

  return (
    <div
      role="radiogroup"
      className={cn(
        "flex w-full items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 gap-1.5",
        disabled && "opacity-60 pointer-events-none",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm transition-all duration-150 select-none",
              getColorClasses(option, isSelected),
              !isSelected && "border-2 border-transparent"
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isSelected
                    ? option.activeColor === "green"
                      ? "text-emerald-600"
                      : option.activeColor === "red"
                      ? "text-rose-600"
                      : "text-blue-600"
                    : "text-slate-400"
                )}
              />
            )}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
