import React from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface DifferenceBadgeProps {
  diff: number;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export const DifferenceBadge: React.FC<DifferenceBadgeProps> = ({
  diff,
  className,
  showIcon = true,
  size = "md",
}) => {
  const isPositive = diff > 0;
  const isNegative = diff < 0;
  const isZero = diff === 0;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1 font-bold",
    lg: "text-base px-3.5 py-1.5 font-extrabold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xl transition-all",
        sizeClasses[size],
        isPositive && "bg-emerald-100 text-emerald-800 border border-emerald-300",
        isNegative && "bg-rose-100 text-rose-800 border border-rose-300",
        isZero && "bg-slate-100 text-slate-700 border border-slate-300",
        className
      )}
    >
      {showIcon && (
        <>
          {isPositive && <ArrowUp className="h-3.5 w-3.5 stroke-[3]" />}
          {isNegative && <ArrowDown className="h-3.5 w-3.5 stroke-[3]" />}
          {isZero && <Minus className="h-3.5 w-3.5 stroke-[3]" />}
        </>
      )}
      <span>
        {isPositive ? `+${formatNumber(diff)}` : formatNumber(diff)}
      </span>
    </span>
  );
};
