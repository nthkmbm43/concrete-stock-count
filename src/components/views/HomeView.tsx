"use client";

import React from "react";
import { UserProfile, CountRound, RoundProgress, Plant } from "@/lib/types";
import { RoundBanner } from "@/components/count/RoundBanner";
import { PlantCard } from "@/components/count/PlantCard";
import { Button } from "@/components/ui/button";
import { Boxes, ArrowRight, Sparkles, AlertCircle, QrCode } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface HomeViewProps {
  currentUser: UserProfile;
  activeRound: CountRound;
  progress: RoundProgress | null;
  plants: Plant[];
  totalItemCount: number;
  onEnterRound: () => void;
  onSelectPlant: (plantId: number) => void;
  onViewStock: () => void;
  onOpenScan?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  activeRound,
  progress,
  plants,
  totalItemCount,
  onEnterRound,
  onSelectPlant,
  onViewStock,
  onOpenScan,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Header Greeting per Requirement #17 */}
      <div className="flex items-center justify-between rounded-3xl bg-white p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-lg shadow-sm">
            {currentUser.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">ยินดีต้อนรับ</span>
              <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />
            </div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">
              สวัสดี คุณ{currentUser.full_name}
            </h2>
            <p className="text-xs font-semibold text-blue-600">
              {currentUser.role === "ADMIN" ? "หัวหน้าคลัง (แอดมิน)" : "พนักงานคลังสินค้าคอนกรีต"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Current Stock Quick Card */}
      <div className="rounded-3xl bg-slate-900 text-white p-4.5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              Stock สินค้าทั้งหมดในระบบ
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-black text-white">
                {formatNumber(totalItemCount || 64)}
              </span>
              <span className="text-xs font-bold text-slate-400">รายการ (SKU)</span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
            Realtime Sync
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
          <Button
            onClick={onViewStock}
            variant="ghost"
            className="h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Boxes className="h-4 w-4 text-blue-400" />
            <span>ดูรายการ Stock</span>
          </Button>

          {onOpenScan && (
            <Button
              onClick={onOpenScan}
              className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <QrCode className="h-4 w-4" />
              <span>สแกนบาร์โค้ด / QR</span>
            </Button>
          )}
        </div>
      </div>

      {/* 3. Active Count Round Banner */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-sm font-extrabold text-slate-800">
            รอบนับที่กำลังเปิด (Count Round)
          </h3>
          <span className="text-xs font-semibold text-blue-600">
            {activeRound?.type === "MONTHLY" ? "รอบหลักประจำเดือน" : "รอบตรวจย่อย"}
          </span>
        </div>

        {activeRound ? (
          <RoundBanner
            round={activeRound}
            progress={progress || undefined}
            onEnterRound={onEnterRound}
          />
        ) : (
          <div className="p-4 rounded-3xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500 font-bold">
            ยังไม่มีรอบนับที่เปิดอยู่
          </div>
        )}
      </div>

      {/* 4. Plants List (4 Plants Cards per Requirement #17) */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">
              โรงงาน (แตะเพื่อเข้านับ)
            </h3>
            <p className="text-[11px] text-slate-500">
              พนักงานหลายคนสามารถช่วยกันนับในโรงเดียวกันหรือแยกโรงได้
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {plants.map((plant) => {
            const plantProgress = progress?.plants.find((p) => p.plant_id === plant.id);
            return (
              <PlantCard
                key={plant.id}
                plant={plant}
                progress={plantProgress}
                onClick={() => onSelectPlant(plant.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Helper note for factory workers */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200/80 p-3 flex items-start gap-2.5 text-blue-800 text-xs">
        <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-bold">ระบบเปิดให้ช่วยกันนับได้ทันที:</span> ไม่มีการ Lock สินค้า
          พนักงานสามารถนับ SKU เดิมซ้ำเพื่อทวนสอบความถูกต้องได้ และยอดจะอัปเดตแบบ Realtime ทุกเครื่อง
        </p>
      </div>
    </div>
  );
};
