"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { UserProfile } from "@/lib/types";
import { Check, ShieldCheck, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserSwitcherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserProfile;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({
  open,
  onOpenChange,
  currentUser,
  users,
  onSelectUser,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-lg">สลับผู้ใช้งาน (ทดสอบระบบ Multi-Staff)</SheetTitle>
          <SheetDescription>
            เลือกล็อกอินเป็นพนักงานโรงงานหรือแอดมิน เพื่อทดสอบการนับพร้อมกันหลายคนและปรับยอด
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2.5">
          {users.map((user) => {
            const isSelected = user.id === currentUser.id;
            const isAdmin = user.role === "ADMIN";

            return (
              <button
                key={user.id}
                onClick={() => {
                  onSelectUser(user);
                  onOpenChange(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all touch-press",
                  isSelected
                    ? "border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600/30"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl font-bold text-base shadow-xs",
                      isAdmin
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-700"
                    )}
                  >
                    {isAdmin ? (
                      <ShieldCheck className="h-6 w-6 text-amber-600" />
                    ) : (
                      <UserIcon className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{user.full_name}</span>
                      <Badge variant={isAdmin ? "amber" : "info"} className="text-[10px] py-0 px-1.5">
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isAdmin
                        ? "ผู้ดูแลระบบ • แก้ยอด/จัดการสินค้า/เปิดรอบ"
                        : `พนักงานคลัง • โรง ${user.plant_id || 1} • นับ/ส่งยอด`}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
