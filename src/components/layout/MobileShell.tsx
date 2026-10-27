"use client";

import React, { useState } from "react";
import { TopAppBar } from "./TopAppBar";
import { BottomNavigation, NavTab } from "./BottomNavigation";
import { UserProfile } from "@/lib/types";
import { UserSwitcherModal } from "./UserSwitcherModal";
import { cn } from "@/lib/utils";

interface MobileShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: UserProfile;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  uncountedCount?: number;
  hideNav?: boolean;
  onOpenExport?: () => void;
  onOpenScan?: () => void;
  onLogout?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  children,
  title = "CONCRETE STOCK",
  subtitle,
  onBack,
  currentTab,
  onSelectTab,
  currentUser,
  users,
  onSelectUser,
  uncountedCount = 0,
  hideNav = false,
  onOpenExport,
  onOpenScan,
  onLogout,
  rightAction,
  className,
}) => {
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-slate-900 flex justify-center items-center sm:p-4 select-none">
      {/* Centered Mobile Device App Container */}
      <div className="relative w-full max-w-md md:max-w-lg min-h-screen sm:min-h-[860px] sm:max-h-[92vh] sm:rounded-[2.5rem] bg-slate-50 text-slate-900 shadow-2xl overflow-hidden flex flex-col border-0 sm:border-8 sm:border-slate-800/80">
        
        {/* Top App Bar */}
        <TopAppBar
          title={title}
          subtitle={subtitle}
          onBack={onBack}
          currentUser={currentUser}
          onOpenUserSwitcher={() => setUserSwitcherOpen(true)}
          onOpenExport={onOpenExport}
          onOpenScan={onOpenScan}
          onLogout={onLogout}
          rightAction={rightAction}
        />

        {/* Scrollable Viewport Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-3.5 py-4",
            hideNav ? "pb-8 safe-area-bottom" : "pb-24 safe-area-bottom",
            className
          )}
        >
          {children}
        </main>

        {/* Fixed Bottom Navigation (5 tabs) */}
        {!hideNav && (
          <BottomNavigation
            currentTab={currentTab}
            onSelectTab={onSelectTab}
            uncountedCount={uncountedCount}
          />
        )}

        {/* User Switcher Bottom Sheet (Mounted only in DEMO_MODE) */}
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <UserSwitcherModal
            open={userSwitcherOpen}
            onOpenChange={setUserSwitcherOpen}
            currentUser={currentUser}
            users={users}
            onSelectUser={onSelectUser}
          />
        )}
      </div>
    </div>
  );
};
