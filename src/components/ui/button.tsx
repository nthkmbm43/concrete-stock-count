import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:bg-blue-800",
        destructive:
          "bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700 active:bg-red-800",
        outline:
          "border-2 border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300",
        ghost:
          "text-slate-700 hover:bg-slate-100 active:bg-slate-200",
        link: "text-blue-600 underline-offset-4 hover:underline",
        success:
          "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:bg-emerald-800",
        amber:
          "bg-amber-500 text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 active:bg-amber-700",
      },
      size: {
        default: "h-12 px-5 py-3 text-base",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-14 rounded-2xl px-6 text-lg font-bold shadow-lg",
        xl: "h-16 rounded-2xl px-8 text-xl font-bold shadow-xl",
        icon: "h-11 w-11 rounded-xl",
        "icon-lg": "h-14 w-14 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
