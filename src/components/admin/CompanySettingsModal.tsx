"use client";

import React, { useState } from "react";
import {
  X,
  Building2,
  Save,
  Upload,
  Globe,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { CompanySettingsData } from "@/db/queries/company";
import { updateCompanySettingsAction } from "@/actions/company";
import { CompanyLogo } from "@/components/brand/CompanyLogo";

export interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: CompanySettingsData;
  onSuccess?: (updated: CompanySettingsData) => void;
}

export function CompanySettingsModal({
  isOpen,
  onClose,
  initialSettings,
  onSuccess,
}: CompanySettingsModalProps) {
  const [formData, setFormData] = useState<CompanySettingsData>(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFeedback({ type: "error", message: "ขนาดไฟล์โลโก้ต้องไม่เกิน 2MB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({ ...prev, logoUrl: base64 }));
      setFeedback(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const res = await updateCompanySettingsAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: "success", message: "บันทึกข้อมูลองค์กรและแบรนด์เรียบร้อยแล้ว" });
      if (onSuccess) onSuccess(formData);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setFeedback({ type: "error", message: res.error || "เกิดข้อผิดพลาดในการบันทึก" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">ข้อมูลองค์กรและแบรนด์ (KCON)</h2>
              <p className="text-xs text-slate-500">
                จัดการชื่อบริษัท ข้อมูลติดต่อ และโลโก้สำหรับเอกสารและแอปพลิเคชัน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {feedback && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-sm ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Public Verification Notice */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900">
            <FileCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold">แหล่งข้อมูลสาธารณะที่ตรวจสอบได้:</span>
              <p className="mt-0.5 text-blue-700 leading-relaxed">
                ข้อมูลบริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด (KCON)
                อ้างอิงจากข้อมูลการจดทะเบียนนิติบุคคลและเว็บไซต์สาธารณะของบริษัท
              </p>
            </div>
          </div>

          {/* Logo Section */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              โลโก้องค์กร (Company Logo)
            </label>
            <div className="flex items-center gap-4">
              <CompanyLogo
                logoUrl={formData.logoUrl}
                brandName={formData.brandName}
                size="lg"
                showText={true}
              />
              <div className="flex-1 space-y-1.5">
                <div className="flex gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 border border-slate-300 shadow-sm hover:bg-slate-50 transition">
                    <Upload className="h-3.5 w-3.5" />
                    <span>อัปโหลดภาพ</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 border border-slate-300 shadow-sm hover:bg-rose-50 transition"
                    >
                      รีเซ็ตเป็นโลโก้มาตรฐาน
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  รองรับไฟล์ PNG, JPG, WEBP, SVG ขนาดไม่เกิน 2MB (แนะนำภาพพื้นหลังโปร่งใส)
                </p>
              </div>
            </div>
          </div>

          {/* Company Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อบริษัท (ภาษาไทย) *
              </label>
              <input
                type="text"
                required
                value={formData.companyNameTh}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, companyNameTh: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อบริษัท (English) *
              </label>
              <input
                type="text"
                required
                value={formData.companyNameEn}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, companyNameEn: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Brand & Website */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อแบรนด์ / ตัวย่อ *
              </label>
              <input
                type="text"
                required
                value={formData.brandName}
                onChange={(e) => setFormData((prev) => ({ ...prev, brandName: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                <span>เว็บไซต์</span>
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>ที่อยู่สำนักงานใหญ่</span>
            </label>
            <textarea
              rows={2}
              value={formData.addressTh}
              onChange={(e) => setFormData((prev) => ({ ...prev, addressTh: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>เบอร์โทรศัพท์</span>
              </label>
              <input
                type="text"
                value={formData.phone || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>อีเมล</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Report Footer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ข้อความท้ายเอกสารรายงาน (Report Footer)
            </label>
            <input
              type="text"
              value={formData.reportFooter || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, reportFooter: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
