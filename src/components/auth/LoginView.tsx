"use client";

import React, { useState } from "react";
import Image from "next/image";
import { UserProfile } from "@/lib/types";
import { loginUserAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  User,
  ShieldCheck,
  ClipboardList,
  AlertCircle,
  Loader2,
  LogIn,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage("กรุณาระบุชื่อผู้ใช้งาน");
      return;
    }
    if (!password) {
      setErrorMessage("กรุณาระบุรหัสผ่าน");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginUserAction(identifier.trim(), password);

      if (!res.success) {
        setErrorMessage(res.error || "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
        toast.error(res.error || "เข้าสู่ระบบไม่สำเร็จ");
        setIsLoading(false);
        return;
      }

      if (res.user) {
        toast.success(`ยินดีต้อนรับ ${res.user.full_name}`);
        onLoginSuccess(res.user);
      } else {
        // Fallback reload if user profile is returned via cookie refresh
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Login submission error:", err);
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setIdentifier(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/90 flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <Image
              src="/logo.png"
              alt="KCON Logo"
              width={220}
              height={64}
              priority
              className="h-14 w-auto object-contain"
            />
          </div>
          <div>
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50/70 text-blue-700 text-[11px] font-bold px-2.5 py-0.5"
            >
              ระบบตรวจนับคลังสินค้าคอนกรีต
            </Badge>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              เข้าสู่ระบบ
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด (KCON)
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              ชื่อผู้ใช้งาน (Username) หรือ อีเมล
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <Input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="เช่น admin หรือ pcryclc"
                disabled={isLoading}
                autoComplete="username"
                className="pl-10 h-12 rounded-2xl text-sm border-slate-300 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="ระบุรหัสผ่านของคุณ"
                disabled={isLoading}
                autoComplete="current-password"
                className="pl-10 h-12 rounded-2xl text-sm border-slate-300 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                กำลังตรวจสอบข้อมูล...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                เข้าสู่ระบบ
              </>
            )}
          </Button>
        </form>

        {/* Quick Fill / Credentials Info Card */}
        <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              บัญชีผู้ใช้งานระบบ KCON
            </span>
            <span className="text-[10px] text-slate-400">คลิกเพื่อกรอกอัตโนมัติ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Admin Quick Button */}
            <button
              type="button"
              onClick={() => handleQuickFill("admin", "Admin@2026")}
              className={`p-3 rounded-2xl border text-left transition-all ${
                identifier === "admin"
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                  Admin
                </span>
                <Badge variant="amber" className="text-[9px] px-1 py-0 h-4">
                  ADMIN
                </Badge>
              </div>
              <p className="text-[11px] text-slate-600 font-mono mt-1">
                user: <span className="font-bold text-slate-900">admin</span>
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                pass: Admin@2026
              </p>
            </button>

            {/* Staff Quick Button */}
            <button
              type="button"
              onClick={() => handleQuickFill("pcryclc", "Jib1105t")}
              className={`p-3 rounded-2xl border text-left transition-all ${
                identifier === "pcryclc"
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-900 flex items-center gap-1">
                  <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
                  Staff
                </span>
                <Badge variant="default" className="text-[9px] px-1 py-0 h-4 bg-blue-600">
                  STAFF
                </Badge>
              </div>
              <p className="text-[11px] text-slate-600 font-mono mt-1">
                user: <span className="font-bold text-slate-900">pcryclc</span>
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                pass: Jib1105t
              </p>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center pt-2">
          <p className="text-[10px] text-slate-400 font-medium">
            154 หมู่ 9 ถ.มะลิวัลย์ ต.บ้านทุ่ม อ.เมือง จ.ขอนแก่น 40000 • โทร. 043-255-111
          </p>
        </div>
      </div>
    </div>
  );
};
