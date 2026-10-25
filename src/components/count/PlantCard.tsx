"use client";

import React from "react";
import { Plant, PlantCountProgress } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Warehouse, Factory, Building2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlantCardProps {
  plant: Plant;
  progress?: PlantCountProgress;
  onClick: () => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({
  plant,
  progress,
  onClick,
}) => {
  const counted = progress?.counted_skus ?? 0;
  const total = progress?.total_skus ?? plant.total_skus;
  const pct = progress?.percentage ?? (total > 0 ? Math.round((counted / total) * 100) : 0);
  const isCompleted = pct === 100 && total > 0;

  // Icons per plant
  const plantIcons = [
    Warehouse, // Plant 1 Raw materials
    Factory,   // Plant 2 Fence Posts
    Layers,    // Plant 3 Plank / Hollow core
    Building2, // Plant 4 Infrastructure / L-Wall
  ];
  const IconComponent = plantIcons[(plant.id - 1) % plantIcons.length] || Warehouse;

  return (
    <div
      onClick={onClick}
      role="button"
      className={cn(
        "group relative rounded-3xl border-2 p-4 text-left transition-all touch-press cursor-pointer bg-white shadow-xs",
        isCompleted
          ? "border-emerald-300 hover:border-emerald-500"
          : "border-slate-200/90 hover:border-blue-500"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Plant Icon & Info */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs transition-colors",
              isCompleted
                ? "bg-emerald-100 text-emerald-800"
                : "bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white"
            )}
          >
            <IconComponent className="h-6 w-6 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-base text-slate-900 leading-tight">
                {plant.name}
              </h4>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {plant.description}
            </p>
          </div>
        </div>

        {/* Right Arrow / Progress numbers */}
        <div className="text-right shrink-0">
          <div className="flex items-baseline justify-end gap-1">
            <span
              className={cn(
                "text-base font-black",
                isCompleted ? "text-emerald-700" : "text-blue-600"
              )}
            >
              {counted}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ {total}</span>
          </div>
          <span
            className={cn(
              "text-xs font-black block mt-0.5",
              isCompleted ? "text-emerald-700" : "text-slate-600"
            )}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3.5 flex items-center gap-2">
        <Progress
          value={pct}
          indicatorColor={isCompleted ? "bg-emerald-500" : "bg-blue-600"}
          className="h-2.5 flex-1 bg-slate-100"
        />
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
      </div>
    </div>
  );
};
