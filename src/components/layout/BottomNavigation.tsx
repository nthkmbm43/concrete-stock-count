"use client";

import React from "react";
import { House, ClipboardCheck, Boxes, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavTab = "home" | "count" | "stock" | "history" | "profile";

interface BottomNavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  uncountedCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  uncountedCount = 0,
}) => {
  const navItems = [
    {
      id: "home" as NavTab,
      label: "Home",
      icon: House,
    },
    {
      id: "count" as NavTab,
      label: "นับสต๊อก",
      icon: ClipboardCheck,
      badge: uncountedCount > 0 ? uncountedCount : undefined,
    },
    {
      id: "stock" as NavTab,
      label: "Stock",
      icon: Boxes,
    },
    {
      id: "history" as NavTab,
      label: "ประวัติ",
      icon: History,
    },
    {
      id: "profile" as NavTab,
      label: "Profile",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md md:max-w-lg bg-white/95 backdrop-blur-md border-t border-slate-200/90 safe-area-bottom shadow-lg">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center h-full w-full py-1 transition-all touch-press",
                isActive ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "transition-transform",
                    isActive ? "h-6 w-6 scale-110 stroke-[2.5]" : "h-5 w-5 stroke-[1.8]"
                  )}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] mt-0.5 tracking-tight transition-all",
                  isActive ? "text-blue-600 font-bold" : "text-slate-500 font-medium"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 h-0.5 w-8 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
