"use client";

import React from "react";
import { ChevronLeft, Radio, Users, FileSpreadsheet, Upload } from "lucide-react";
import { UserProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import Link from "next/link";

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  currentUser: UserProfile;
  onOpenUserSwitcher: () => void;
  onOpenExport?: () => void;
  onOpenImport?: () => void;
  rightAction?: React.ReactNode;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  subtitle,
  onBack,
  currentUser,
  onOpenUserSwitcher,
  onOpenExport,
  onOpenImport,
  rightAction,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 safe-area-top shadow-xs">
      <div className="flex items-center justify-between h-14 px-3 sm:px-4">
        {/* Left: Back button or App Brand */}
        <div className="flex items-center gap-2">
          {onBack ? (
            <button
              onClick={onBack}
              aria-label="ย้อนกลับ"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all touch-press"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
            </button>
          ) : (
            <Link href="/" className="flex items-center hover:opacity-90 transition">
              <CompanyLogo size="sm" showText={true} />
            </Link>
          )}

          {onBack && (
            <div className="truncate max-w-[170px] sm:max-w-[210px]">
              <h1 className="text-base font-bold text-slate-900 truncate leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] text-slate-500 truncate leading-none mt-0.5 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Action: User switcher pill & Realtime status */}
        <div className="flex items-center gap-1.5">
          {rightAction ? (
            rightAction
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Realtime Active Indicator */}
              <div
                title="Realtime เชื่อมต่อแล้ว"
                className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] font-bold"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Radio className="h-3 w-3" />
              </div>

              {/* Data Import Quick Trigger for Admin */}
              {currentUser.role === "ADMIN" && (
                <Link
                  href="/admin/import"
                  title="ศูนย์นำเข้าข้อมูล (Data Import Center)"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 active:scale-95 transition-all cursor-pointer touch-press"
                >
                  <Upload className="h-3.5 w-3.5" />
                </Link>
              )}

              {/* Export Report Quick Trigger */}
              {onOpenExport && (
                <button
                  type="button"
                  onClick={onOpenExport}
                  title="ส่งออกรายงาน Excel / PDF / พิมพ์"
                  aria-label="ส่งออกรายงาน Excel / PDF / พิมพ์"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 active:scale-95 transition-all cursor-pointer touch-press"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </button>
              )}

              {/* User Switcher Pill Button (Interactive only in DEMO_MODE) */}
              {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? (
                <button
                  onClick={onOpenUserSwitcher}
                  title="สลับบัญชีผู้ใช้งาน Demo"
                  className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 active:scale-95 transition-all text-xs font-semibold text-slate-800 touch-press"
                >
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  <span className="truncate max-w-[80px] sm:max-w-[105px]">
                    {currentUser.full_name.split(" ")[0]}
                  </span>
                  <Badge
                    variant={currentUser.role === "ADMIN" ? "amber" : "default"}
                    className="text-[9px] px-1 py-0 h-4"
                  >
                    {currentUser.role}
                  </Badge>
                </button>
              ) : (
                <div
                  title={`ผู้ใช้งาน: ${currentUser.full_name}`}
                  className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-800"
                >
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  <span className="truncate max-w-[80px] sm:max-w-[105px]">
                    {currentUser.full_name.split(" ")[0]}
                  </span>
                  <Badge
                    variant={currentUser.role === "ADMIN" ? "amber" : "default"}
                    className="text-[9px] px-1 py-0 h-4"
                  >
                    {currentUser.role}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
