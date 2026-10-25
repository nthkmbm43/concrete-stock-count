"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { UserProfile } from "@/lib/types";
import {
  Check,
  ShieldCheck,
  User as UserIcon,
  UserPlus,
  Mail,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [showRegister, setShowRegister] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPlantId, setNewPlantId] = useState(2);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("กรุณากรอกชื่อและอีเมลให้ครบถ้วน");
      return;
    }

    // Role is strictly STAFF per requirement 7
    const newUser: UserProfile = {
      id: "user-" + Math.random().toString(36).substring(2, 9),
      full_name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: "STAFF",
      plant_id: newPlantId,
      phone: "089-" + Math.floor(1000000 + Math.random() * 9000000),
    };

    onSelectUser(newUser);
    toast.success(`สมัครสมาชิกสำเร็จ! เข้าสู่ระบบในฐานะ "${newUser.full_name}" (สิทธิ์ STAFF)`);
    setShowRegister(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-8 max-h-[92vh] overflow-y-auto no-scrollbar">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="text-lg font-bold text-slate-900">
            {showRegister ? "สมัครสมาชิกใหม่ (Demo Register)" : "สลับบัญชีผู้ใช้งาน (Demo Accounts)"}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            {showRegister
              ? "สมาชิกใหม่จะได้รับสิทธิ์เป็น STAFF อัตโนมัติ (ไม่สามารถเลือก ADMIN ได้ตามข้อกำหนดความปลอดภัย)"
              : "เลือกล็อกอินเป็นพนักงานคลัง (STAFF) หรือหัวหน้าคลัง (ADMIN) เพื่อทดสอบการทำงาน"}
          </SheetDescription>
        </SheetHeader>

        {showRegister ? (
          <form onSubmit={handleRegister} className="space-y-3.5 my-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="เช่น กิตติพงษ์ ใจสู้"
                className="h-11 rounded-xl text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="kittipong@concretefactory.co.th"
                  className="h-11 pl-10 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                โรงงานประจำ
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPlantId(p)}
                    className={cn(
                      "h-10 rounded-xl border text-xs font-bold transition-all",
                      newPlantId === p
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    โรง {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
              <span>สิทธิ์การใช้งานของบัญชีใหม่จะถูกกำหนดเป็น <strong>STAFF</strong> ตามกฎของระบบ</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegister(false)}
                className="flex-1 h-11 rounded-xl"
              >
                ย้อนกลับ
              </Button>
              <Button
                type="submit"
                variant="default"
                className="flex-1 h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                ยืนยันการสมัคร
              </Button>
            </div>
          </form>
        ) : (
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
                        "flex h-11 w-11 items-center justify-center rounded-2xl font-bold text-base shadow-xs shrink-0",
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {user.full_name}
                        </span>
                        <Badge
                          variant={isAdmin ? "amber" : "info"}
                          className="text-[10px] py-0 px-1.5 shrink-0"
                        >
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {user.email}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isAdmin
                          ? "แอดมิน • ปรับยอดสต๊อก / เพิ่มสินค้า / เปิด-ปิดรอบนับ"
                          : `พนักงานคลัง • โรง ${user.plant_id || 1} • ตรวจนับ / บันทึกจุดวาง`}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shrink-0 ml-2">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegister(true)}
                className="w-full h-11 rounded-2xl border-dashed border-2 border-slate-300 text-slate-700 font-bold flex items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-600"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ สมัครบัญชีพนักงานใหม่ (Register Demo)</span>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
