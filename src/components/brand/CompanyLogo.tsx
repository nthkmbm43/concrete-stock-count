"use client";

import React from "react";

export interface CompanyLogoProps {
  logoUrl?: string | null;
  brandName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  variant?: "auto" | "banner" | "mark";
}

export function CompanyLogo({
  logoUrl = "/logo.png",
  brandName = "KCON",
  size = "md",
  showText = true,
  className = "",
  variant = "auto",
}: CompanyLogoProps) {
  const sizeMap = {
    sm: { box: "w-8 h-8", bannerHeight: "h-8", text: "text-xs", sub: "text-[9px]" },
    md: { box: "w-10 h-10", bannerHeight: "h-10", text: "text-sm", sub: "text-[10px]" },
    lg: { box: "w-12 h-12", bannerHeight: "h-12", text: "text-base", sub: "text-xs" },
    xl: { box: "w-16 h-16", bannerHeight: "h-16", text: "text-lg", sub: "text-xs" },
  };

  const currentSize = sizeMap[size];

  // 1. Banner mode: renders the full wide KCON banner cleanly
  if (variant === "banner" || (!showText && variant !== "mark")) {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src={logoUrl || "/logo.png"}
          alt={brandName}
          className={`${currentSize.bannerHeight} w-auto object-contain rounded-lg shadow-xs border border-blue-900/20`}
        />
      </div>
    );
  }

  // 2. Custom logo provided (e.g. uploaded base64 data)
  if (logoUrl && logoUrl !== "/logo.png") {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div
          className={`relative ${currentSize.box} flex-shrink-0 overflow-hidden rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center p-1`}
        >
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
            <span className={`font-semibold tracking-wider uppercase text-blue-600 ${currentSize.sub}`}>
              CONCRETE PRODUCTS
            </span>
          </div>
        )}
      </div>
    );
  }

  // 3. Default KCON brand mark: The official yellow "K" on royal blue square icon + typography
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative ${currentSize.box} flex-shrink-0 overflow-hidden rounded-xl bg-[#173f90] shadow-xs border border-blue-700/40 flex items-center justify-center p-0.5`}
      >
        <img
          src="/icon-192.png"
          alt={brandName}
          className="w-full h-full object-contain rounded-lg"
        />
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
