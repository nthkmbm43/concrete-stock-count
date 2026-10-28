"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { InventoryItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, QrCode, Download, Copy, Check, Building2, MapPin, Share2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ProductQrModalProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductQrModal: React.FC<ProductQrModalProps> = ({
  item,
  open,
  onOpenChange,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedSku, setCopiedSku] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const getProductUrl = (sku: string) => {
    const baseOrigin =
      typeof window !== "undefined" &&
      window.location.origin &&
      !window.location.hostname.includes("localhost") &&
      !window.location.hostname.includes("127.0.0.1")
        ? window.location.origin
        : "https://store-app2.vercel.app";
    return `${baseOrigin}/products/${encodeURIComponent(sku)}`;
  };

  useEffect(() => {
    if (item && open) {
      // Generate high-resolution QR code containing direct warehouse product URL
      // When scanned with any smartphone camera (iPhone, Android, LINE), it opens this product directly in KCON warehouse!
      const productUrl = getProductUrl(item.sku);
      QRCode.toDataURL(productUrl, {
        width: 360,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR generation error:", err));
    } else {
      setQrDataUrl("");
    }
  }, [item, open]);

  if (!item) return null;

  const handleCopySku = () => {
    navigator.clipboard.writeText(item.sku);
    setCopiedSku(true);
    toast.success(`คัดลอกรหัส SKU "${item.sku}" แล้ว`);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleCopyLink = () => {
    const url = getProductUrl(item.sku);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("คัดลอกลิงก์ข้อมูลสินค้าในคลังแล้ว");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `QR-${item.sku}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`ดาวน์โหลด QR Code สำหรับ ${item.sku} แล้ว`);
  };

  const handlePrint = () => {
    window.print();
  };

  const locationSummary =
    item.locations && item.locations.length > 0
      ? item.locations.map((l) => `ล็อค ${l.lock_code} / แถว ${l.row_code}`).join(" • ")
      : item.zone || "ไม่ระบุจุดวาง";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-slate-200">
        <DialogHeader className="p-5 pb-3 bg-slate-50 border-b border-slate-100 text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-slate-900 leading-tight">
                ป้าย QR Code ประจำสินค้าในคลัง
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                สแกนด้วยกล้องมือถือเพื่อเปิดข้อมูลสินค้าในคลัง KCON ทันที
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Warehouse Tag Area */}
        <div className="p-5 space-y-4">
          <div
            ref={printAreaRef}
            id="kcon-printable-tag"
            className="p-5 rounded-2xl bg-white border-2 border-slate-300 shadow-xs space-y-4 text-center print:border-black print:p-6"
          >
            {/* Tag Brand Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  KCON CONCRETE WAREHOUSE TAG
                </span>
                <span className="text-xs font-bold text-slate-800">
                  บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด
                </span>
              </div>
              <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 font-bold text-[11px]">
                โรง {item.plant_id}
              </Badge>
            </div>

            {/* QR Code Display */}
            <div className="flex justify-center my-2">
              {qrDataUrl ? (
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <Image
                    src={qrDataUrl}
                    alt={`QR Code ${item.sku}`}
                    width={200}
                    height={200}
                    className="w-44 h-44 object-contain mx-auto"
                    priority
                  />
                </div>
              ) : (
                <div className="w-44 h-44 rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
                  กำลังสร้าง QR...
                </div>
              )}
            </div>

            {/* SKU and Product Details */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-xl">
                <span className="font-mono text-base font-black text-slate-900 tracking-wide">
                  {item.sku}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug pt-1">
                {item.name}
              </h3>
              {item.size && (
                <p className="text-xs text-slate-600 font-medium">
                  ขนาด: {item.size}
                </p>
              )}
              {item.variant && (
                <p className="text-[11px] text-slate-500">
                  {item.variant}
                </p>
              )}
            </div>

            {/* Location & Unit Footer */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-left text-xs">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">จุดวางจัดเก็บ</span>
                <span className="font-bold text-slate-800 text-[11px] truncate block">
                  {locationSummary}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">หน่วยนับ</span>
                <span className="font-bold text-slate-800 text-[11px] block">
                  {item.unit || "ชิ้น"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="h-11 rounded-2xl text-xs font-bold border-slate-200"
              >
                {copiedLink ? <Check className="h-4 w-4 mr-1 text-emerald-600" /> : <Share2 className="h-4 w-4 mr-1 text-blue-600" />}
                {copiedLink ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์สินค้า"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopySku}
                className="h-11 rounded-2xl text-xs font-bold border-slate-200"
              >
                {copiedSku ? <Check className="h-4 w-4 mr-1 text-emerald-600" /> : <Copy className="h-4 w-4 mr-1" />}
                {copiedSku ? "คัดลอกแล้ว" : "ก๊อปปี้ SKU"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadQr}
                className="h-11 rounded-2xl text-xs font-bold border-slate-200"
              >
                <Download className="h-4 w-4 mr-1 text-emerald-600" />
                บันทึกภาพ QR
              </Button>
              <Button
                type="button"
                onClick={handlePrint}
                className="h-11 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                <Printer className="h-4 w-4 mr-1" />
                พิมพ์ป้าย
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
