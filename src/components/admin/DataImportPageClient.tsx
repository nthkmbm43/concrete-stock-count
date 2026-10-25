"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  History,
  Building2,
  Download,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { DataImportWizard } from "./DataImportWizard";
import { ImportHistoryView } from "./ImportHistoryView";
import { CompanySettingsModal } from "./CompanySettingsModal";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { CompanySettingsData } from "@/db/queries/company";

export interface DataImportPageClientProps {
  initialCompanySettings: CompanySettingsData;
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
}

export function DataImportPageClient({
  initialCompanySettings,
  currentUser,
}: DataImportPageClientProps) {
  const [activeTab, setActiveTab] = useState<"import" | "history" | "company">("import");
  const [companySettings, setCompanySettings] = useState<CompanySettingsData>(initialCompanySettings);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <CompanyLogo
              logoUrl={companySettings.logoUrl}
              brandName={companySettings.brandName}
              size="md"
              showText={true}
            />
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/import/template"
              download="kcon-stock-import-template.xlsx"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>ดาวน์โหลด Template</span>
            </a>
            <button
              onClick={() => setIsCompanyModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
            >
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              <span>ข้อมูลองค์กร</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
        {/* Page Hero Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-0.5 text-xs font-semibold text-blue-200 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>ADMIN DATA IMPORT CENTER • KCON CONCRETE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              ศูนย์นำเข้าข้อมูลสต๊อกและสินค้า
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              นำเข้า Master รายการสินค้าคอนกรีต, ยอดสต๊อกยกมา และจุดวางคลังสินค้าด้วยไฟล์ Excel (.xlsx)
              หรือ CSV พร้อมระบบตรวจสอบข้อมูล รวมหลายจุดวางอัตโนมัติ และบันทึกประวัติการนำเข้า
            </p>
          </div>
          {/* Decorative background circle */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        </div>

        {currentUser?.role !== "ADMIN" && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
            <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (ADMIN ONLY)</p>
              <p className="text-amber-800">
                คุณเข้าสู่ระบบในฐานะ <strong>{currentUser?.name || "พนักงาน"}</strong> (สิทธิ์ {currentUser?.role || "STAFF"})
                การดำเนินการบันทึกข้อมูลนำเข้าหรือแก้ไขข้อมูลบริษัทจะถูกปฏิเสธโดยเซิร์ฟเวอร์ (403 Forbidden)
                หากต้องการดำเนินการ กรุณาสลับบัญชีเป็นแอดมิน (ชัยวัฒน์ หัวหน้าคลัง) จากหน้าแรก
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("import")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "import"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>นำเข้าข้อมูล (Wizard)</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "history"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <History className="h-4 w-4" />
            <span>ประวัติการนำเข้า (Audit Log)</span>
          </button>

          <button
            onClick={() => setActiveTab("company")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "company"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>ข้อมูลองค์กร & แบรนด์</span>
          </button>
        </div>

        {/* Tab 1: Wizard */}
        {activeTab === "import" && (
          <DataImportWizard
            currentUser={currentUser}
            onSuccess={() => {}}
            onNavigateToProducts={() => {
              window.location.href = "/";
            }}
          />
        )}

        {/* Tab 2: History */}
        {activeTab === "history" && <ImportHistoryView />}

        {/* Tab 3: Company Profile Card View */}
        {activeTab === "company" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <CompanyLogo
                  logoUrl={companySettings.logoUrl}
                  brandName={companySettings.brandName}
                  size="xl"
                  showText={false}
                />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{companySettings.companyNameTh}</h2>
                  <p className="text-xs text-slate-500 font-medium">{companySettings.companyNameEn}</p>
                  <span className="inline-block mt-1 font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    แบรนด์: {companySettings.brandName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCompanyModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition self-start sm:self-center"
              >
                <Building2 className="h-4 w-4" />
                <span>แก้ไขข้อมูลองค์กร & โลโก้</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-4 space-y-2 border border-slate-100">
                <span className="font-bold text-slate-700 block">ที่อยู่สำนักงานใหญ่:</span>
                <p className="text-slate-600 leading-relaxed">{companySettings.addressTh}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 space-y-2 border border-slate-100">
                <span className="font-bold text-slate-700 block">ข้อมูลติดต่อ:</span>
                <p className="text-slate-600">โทรศัพท์: {companySettings.phone || "-"}</p>
                <p className="text-slate-600">อีเมล: {companySettings.email}</p>
                <p className="text-slate-600">เว็บไซต์: {companySettings.website}</p>
              </div>
            </div>

            <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-4 text-xs space-y-1">
              <span className="font-bold text-blue-950 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span>การเชื่อมโยงแบรนด์ในระบบ (Unified Branding)</span>
              </span>
              <p className="text-blue-800 leading-relaxed">
                โลโก้และชื่อบริษัทนี้จะถูกนำไปใช้เป็นมาตรฐานร่วมกันทุกจุดในระบบ:
                แถบด้านบนของแอปพลิเคชัน (Header), หน้าเอกสารส่งออก Excel, หน้าเอกสารดาวน์โหลด PDF และแบบพิมพ์ขนาด A4 แนวนอน
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      <CompanySettingsModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        initialSettings={companySettings}
        onSuccess={(updated) => setCompanySettings(updated)}
      />
    </div>
  );
}
