"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Search,
  Check,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";
import { normalizeMasterValue } from "@/lib/master-data";
import { toast } from "sonner";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
}

interface SearchableComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: (string | ComboboxOption)[];
  title?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  allowCustom?: boolean;
  customAddLabel?: string;
  onCustomAdd?: (val: string) => string | Promise<string>;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  value,
  onChange,
  options,
  title = "เลือกรายการ",
  placeholder = "เลือกหรือค้นหา...",
  searchPlaceholder = "พิมพ์เพื่อค้นหา...",
  allowCustom = true,
  customAddLabel = "เพิ่มรายการใหม่",
  onCustomAdd,
  icon: Icon,
  className,
  disabled = false,
  emptyMessage = "ไม่พบรายการที่ค้นหา",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize options into standard format
  const normalizedOptions: ComboboxOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Current selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find(
      (opt) => opt.value.toLowerCase() === (value || "").toLowerCase()
    );
  }, [normalizedOptions, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Check if search query exactly matches an existing option
  const exactMatch = useMemo(() => {
    const normalizedQuery = normalizeMasterValue(searchQuery).toLowerCase();
    if (!normalizedQuery) return null;
    return normalizedOptions.find(
      (opt) => opt.value.toLowerCase() === normalizedQuery || opt.label.toLowerCase() === normalizedQuery
    );
  }, [normalizedOptions, searchQuery]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleAddNew = async () => {
    const clean = normalizeMasterValue(searchQuery);
    if (!clean) return;

    if (exactMatch) {
      toast.info(`เลือก '${exactMatch.label}' ที่มีอยู่แล้ว`);
      handleSelect(exactMatch.value);
      return;
    }

    if (onCustomAdd) {
      try {
        const addedVal = await onCustomAdd(clean);
        handleSelect(addedVal || clean);
        toast.success(`เพิ่ม '${clean}' ในตัวเลือกแล้ว`);
      } catch {
        handleSelect(clean);
      }
    } else {
      handleSelect(clean);
      toast.success(`เพิ่ม '${clean}' แล้ว`);
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
          {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" />}
          {selectedOption ? (
            <span className="font-semibold text-slate-900 text-sm truncate">
              {selectedOption.label}
            </span>
          ) : value ? (
            <span className="font-semibold text-slate-900 text-sm truncate">
              {value}
            </span>
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

      {/* Modal / Bottom Drawer Picker */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer / Modal Container */}
          <div className="relative w-full max-w-lg bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in fade-in-0 slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  เลือกจากรายการมาตรฐาน หรือค้นหา
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

            {/* Search Input */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/70">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-11 pl-10 pr-9 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-600 text-xs"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 no-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected =
                    (value || "").toLowerCase() === opt.value.toLowerCase();
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "w-full min-h-[48px] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left transition-colors",
                        isSelected
                          ? "bg-blue-50 text-blue-900 font-bold"
                          : "hover:bg-slate-50 text-slate-800 font-medium"
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm truncate">{opt.label}</span>
                          {opt.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-600">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-xs text-slate-400 truncate mt-0.5 font-normal">
                            {opt.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center px-4">
                  <p className="text-sm text-slate-500 font-medium">
                    {emptyMessage}
                  </p>
                </div>
              )}
            </div>

            {/* Custom Add Footer */}
            {allowCustom && searchQuery.trim().length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    {exactMatch
                      ? `เลือก '${exactMatch.label}'`
                      : `${customAddLabel} "${normalizeMasterValue(searchQuery)}"`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
