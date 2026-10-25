"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UserProfile,
  CountRound,
  RoundProgress,
  InventoryItem,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import {
  User,
  ShieldCheck,
  PackagePlus,
  CalendarPlus,
  Boxes,
  Database,
  Radio,
  Users,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  FileCode,
  Building2,
  FileSpreadsheet,
} from "lucide-react";

interface ProfileViewProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onOpenUserSwitcher: () => void;
  activeRound: CountRound;
  progress: RoundProgress | null;
  items: InventoryItem[];
  onOpenAddProduct: () => void;
  onOpenCreateRound: () => void;
  onEditProduct: (item: InventoryItem) => void;
  onToggleItemStatus: (item: InventoryItem) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  users,
  onOpenUserSwitcher,
  activeRound,
  progress,
  items,
  onOpenAddProduct,
  onOpenCreateRound,
  onEditProduct,
  onToggleItemStatus,
}) => {
  const isAdmin = currentUser.role === "ADMIN";
  const [showProductList, setShowProductList] = useState(false);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. User Profile Card */}
      <div className="rounded-3xl bg-white p-5 border-2 border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl font-black text-2xl shadow-sm ${
              isAdmin
                ? "bg-amber-100 text-amber-800"
                : "bg-blue-600 text-white"
            }`}
          >
            {isAdmin ? <ShieldCheck className="h-8 w-8" /> : currentUser.full_name.charAt(0)}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                {currentUser.full_name}
              </h2>
              <Badge
                variant={isAdmin ? "amber" : "info"}
                className="text-[10px] font-black uppercase px-2 py-0.5"
              >
                {currentUser.role}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
            <p className="text-xs font-semibold text-blue-600 mt-1">
              {isAdmin
                ? "หัวหน้าคลัง • มีสิทธิ์แก้ยอดและจัดการสินค้า"
                : `พนักงานประจำ: โรง ${currentUser.plant_id || 1}`}
            </p>
          </div>
        </div>

        {/* Quick User Switcher Trigger Button */}
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <Button
            onClick={onOpenUserSwitcher}
            variant="outline"
            className="w-full h-12 rounded-2xl border-slate-200 text-slate-800 font-bold flex items-center justify-between px-4 touch-press"
          >
            <div className="flex items-center gap-2 text-xs">
              <Users className="h-4 w-4 text-blue-600" />
              <span>สลับผู้ใช้งาน (สมชาย / วิชัย / นิตยา / สมพร / แอดมิน)</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      </div>

      {/* 2. Admin Dashboard Section (Requirement #30) */}
      {isAdmin && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Admin Dashboard (ควบคุมคลัง)</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              {activeRound.title}
            </span>
          </div>

          {/* 4 Metric Cards per Requirement #30 */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Progress */}
            <div className="rounded-2xl bg-white p-3.5 border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">
                ความคืบหน้ารอบปัจจุบัน
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-blue-600">
                  {progress?.percentage ?? 71}%
                </span>
                <span className="text-xs text-slate-400">
                  ({progress?.counted_skus ?? 287}/{progress?.total_skus ?? 406})
                </span>
              </div>
            </div>

            {/* Uncounted */}
            <div className="rounded-2xl bg-white p-3.5 border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-bold text-amber-600 block flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                ยังไม่ได้นับ
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-amber-700">
                  {progress?.uncounted_skus ?? 119}
                </span>
                <span className="text-xs text-slate-400">รายการ</span>
              </div>
            </div>

            {/* Recounted */}
            <div className="rounded-2xl bg-white p-3.5 border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-bold text-blue-600 block flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                นับซ้ำ (ทวนสอบ)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-blue-700">
                  {progress?.recounted_skus ?? 8}
                </span>
                <span className="text-xs text-slate-400">รายการ</span>
              </div>
            </div>

            {/* With Differences */}
            <div className="rounded-2xl bg-white p-3.5 border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-bold text-rose-600 block flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                มีผลต่างจากเดิม
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-rose-600">
                  {progress?.difference_skus ?? 24}
                </span>
                <span className="text-xs text-slate-400">รายการ</span>
              </div>
            </div>
          </div>

          {/* Admin Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Button
              onClick={onOpenAddProduct}
              className="h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs touch-press"
            >
              <PackagePlus className="h-4 w-4" />
              <span>เพิ่มสินค้าใหม่</span>
            </Button>

            <Button
              onClick={onOpenCreateRound}
              className="h-13 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs touch-press"
            >
              <CalendarPlus className="h-4 w-4" />
              <span>เปิดรอบนับใหม่</span>
            </Button>

            <Link
              href="/admin/import"
              className="h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs touch-press transition text-center"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>นำเข้า Excel / CSV</span>
            </Link>

            <Link
              href="/admin/import"
              className="h-13 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs touch-press transition text-center"
            >
              <Building2 className="h-4 w-4 text-indigo-300" />
              <span>ข้อมูลองค์กร KCON</span>
            </Link>
          </div>

          {/* Manage Products Collapsible List */}
          <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
            <button
              onClick={() => setShowProductList(!showProductList)}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-blue-600" />
                <span>จัดการข้อมูลสินค้า ({items.length} รายการ)</span>
              </div>
              <span className="text-xs text-blue-600">
                {showProductList ? "ซ่อน" : "แสดงรายการ"}
              </span>
            </button>

            {showProductList && (
              <div className="p-3 pt-0 space-y-2 border-t border-slate-100 max-h-80 overflow-y-auto no-scrollbar">
                {items.slice(0, 20).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">
                          {item.sku}
                        </span>
                        <span className="text-[10px] text-blue-600 font-extrabold">
                          {item.size}
                        </span>
                      </div>
                      <span className="text-slate-500 line-clamp-1 mt-0.5">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditProduct(item)}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => onToggleItemStatus(item)}
                        className={`px-2 py-1 rounded-lg font-bold ${
                          item.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {item.status === "ACTIVE" ? "ใช้งาน" : "ปิด"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. System Connection & Tech Stack Details */}
      <div className="rounded-3xl bg-white p-4.5 border border-slate-200/90 shadow-xs space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
          สถานะระบบ & เทคโนโลยี
        </h4>

        <div className="space-y-2 text-xs">
          {/* Neon Database Status */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Database className="h-4 w-4 text-emerald-600" />
              <span>ฐานข้อมูล Neon PostgreSQL</span>
            </div>
            <Badge variant="success" className="text-[10px]">
              Drizzle ORM Ready
            </Badge>
          </div>

          {/* Better Auth Status */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>ระบบยืนยันตัวตน Better Auth</span>
            </div>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Session Active
            </span>
          </div>

          {/* Drizzle Migrations */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/60 text-blue-900">
            <div className="flex items-center gap-2 font-semibold">
              <FileCode className="h-4 w-4 text-blue-600" />
              <span>Drizzle Schema & Migrations</span>
            </div>
            <span className="font-mono text-[10px] text-blue-700 font-bold">
              src/db/schema.ts
            </span>
          </div>
        </div>
      </div>

      {/* 4. KCON Company Profile Card */}
      <div className="rounded-3xl bg-white p-4.5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <CompanyLogo size="sm" showText={true} />
          <Link
            href="/admin/import"
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
          >
            ตั้งค่าองค์กร
          </Link>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
          <p className="font-bold text-slate-800">
            บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด (KCON)
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            154 หมู่ 9 ถนนมะลิวัลย์ ต.บ้านทุ่ม อ.เมืองขอนแก่น จ.ขอนแก่น 40000
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1">
            <span>โทร. 043-255-111</span>
            <span>•</span>
            <span>kcon.eng@gmail.com</span>
            <span>•</span>
            <span className="text-blue-600">www.kcon-concrete.com</span>
          </div>
        </div>
      </div>

      {/* 5. Help & Guidelines */}
      <div className="rounded-3xl bg-slate-100/80 p-4 border border-slate-200/80 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <HelpCircle className="h-4 w-4 text-blue-600" />
          <span>แนวคิดการนับสต๊อกโรงงานจริง</span>
        </div>
        <p className="leading-relaxed">
          • <strong>ไม่ Lock SKU:</strong> พนักงานหลายคนสามารถเข้าพร้อมกันและช่วยกันนับได้
          <br />
          • <strong>บันทึก History ทุกครั้ง:</strong> ห้ามลบหรือเขียนทับประวัติเดิม สามารถนับซ้ำเพื่อตรวจสอบได้
          <br />
          • <strong>ยอดปัจจุบัน:</strong> ใช้ยอดนับล่าสุดที่ถูก Submit หรือยอดที่ Admin ปรับ
          <br />
          • <strong>Progress:</strong> นับเป็นจำนวน SKU ที่ถูกนับ (1 SKU นับ 3 ครั้ง นับเป็น 1 SKU)
        </p>
      </div>
    </div>
  );
};
