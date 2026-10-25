"use client";

import React from "react";
import Image from "next/image";

export interface CompanyLogoProps {
  logoUrl?: string | null;
  brandName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export function CompanyLogo({
  logoUrl,
  brandName = "KCON",
  size = "md",
  showText = true,
  className = "",
}: CompanyLogoProps) {
  const sizeMap = {
    sm: { box: "w-8 h-8", text: "text-xs", sub: "text-[9px]", icon: 16 },
    md: { box: "w-10 h-10", text: "text-sm", sub: "text-[10px]", icon: 20 },
    lg: { box: "w-12 h-12", text: "text-base", sub: "text-xs", icon: 24 },
    xl: { box: "w-16 h-16", text: "text-lg", sub: "text-xs", icon: 32 },
  };

  const currentSize = sizeMap[size];

  // Custom logo image provided
  if (logoUrl) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className={`relative ${currentSize.box} flex-shrink-0 overflow-hidden rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center p-1`}>
          <img
            src={logoUrl}
            alt={brandName}
            className="w-full h-full object-contain"
          />
        </div>
        {showText && (
          <div className="flex flex-col leading-tight">
            <span className={`font-bold tracking-tight text-slate-900 ${currentSize.text}`}>
              {brandName}
            </span>
            <span className={`font-medium tracking-wider uppercase text-slate-500 ${currentSize.sub}`}>
              CONCRETE
            </span>
          </div>
        )}
      </div>
    );
  }

  // Default clean geometric concrete typography placeholder
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${currentSize.box} flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 text-white flex items-center justify-center shadow-sm border border-blue-600/30 font-black tracking-tighter`}
      >
        <span className={size === "sm" ? "text-xs" : size === "xl" ? "text-lg" : "text-sm"}>
          K
        </span>
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-bold tracking-tight text-slate-900 ${currentSize.text}`}>
            {brandName}
          </span>
          <span className={`font-semibold tracking-wider uppercase text-blue-600 ${currentSize.sub}`}>
            CONCRETE PRODUCTS
          </span>
        </div>
      )}
    </div>
  );
}
