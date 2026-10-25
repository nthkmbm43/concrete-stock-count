"use client";

import React from "react";
import { CountRound, RoundProgress } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatDateShort } from "@/lib/utils";

interface RoundBannerProps {
  round: CountRound;
  progress?: RoundProgress;
  onEnterRound: () => void;
}

export const RoundBanner: React.FC<RoundBannerProps> = ({
  round,
  progress,
  onEnterRound,
}) => {
  const total = progress?.total_skus ?? 406;
  const counted = progress?.counted_skus ?? 287;
  const pct = progress?.percentage ?? (total > 0 ? Math.round((counted / total) * 100) : 71);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-700 via-blue-600 to-indigo-800 p-5 text-white shadow-xl shadow-blue-600/20">
      {/* Decorative backdrop shapes */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-xl" />
      <div className="pointer-events-none absolute -left-6 -bottom-6 h-28 w-28 rounded-full bg-blue-400/20 blur-lg" />

      {/* Top Tag & Status */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-100">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {formatDateShort(round.start_date)} - {formatDateShort(round.end_date)}
          </span>
        </div>
        <Badge className="bg-emerald-500 text-white border-0 font-extrabold px-2 py-0.5 text-[11px] shadow-xs">
          {round.status === "OPEN" ? "OPEN • กำลังเปิด" : "CLOSED"}
        </Badge>
      </div>

      {/* Round Title */}
      <h3 className="text-xl font-black tracking-tight leading-tight mb-3">
        {round.title}
      </h3>

      {/* Progress Breakdown */}
      <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3 border border-white/20 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-blue-100 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            ความคืบหน้าการนับ
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-white">{counted}</span>
            <span className="text-xs text-blue-200">/ {total} SKU</span>
            <span className="text-sm font-black text-emerald-300 ml-1">({pct}%)</span>
          </div>
        </div>

        <Progress
          value={pct}
          indicatorColor="bg-emerald-400"
          className="h-2.5 bg-black/20 border border-white/10"
        />
      </div>

      {/* Enter Round Action Button */}
      <Button
        onClick={onEnterRound}
        size="lg"
        className="w-full h-13 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black shadow-lg shadow-black/10 flex items-center justify-center gap-2 text-base touch-press border-0"
      >
        <span>เข้ารอบนับ</span>
        <ArrowRight className="h-5 w-5 stroke-[2.5]" />
      </Button>
    </div>
  );
};
