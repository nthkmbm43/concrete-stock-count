"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { InventoryItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Boxes,
  MapPin,
  ClipboardCheck,
  Building2,
  Copy,
  Check,
  Download,
  Share2,
  ArrowLeft,
  Warehouse,
  QrCode as QrIcon,
  CheckCircle2,
  Layers,
  Ruler,
  AlertTriangle,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface ProductPublicViewProps {
  item: InventoryItem | null;
  skuParam: string;
}

const PLANT_NAMES: Record<number, string> = {
  1: "โรงผลิต 1 - ท่อคอนกรีตระบายน้ำ",
  2: "โรงผลิต 2 - เสาไฟฟ้าและคานสะพาน",
  3: "โรงผลิต 3 - แผ่นพื้นสำเร็จรูป Plank & Hollow Core",
  4: "โรงผลิต 4 - รั้วคอนกรีตและกำแพงกันดิน",
};

const CATEGORY_NAMES: Record<string, string> = {
  slabs: "แผ่นพื้นสำเร็จรูป",
  pipes: "ท่อคอนกรีตระบายน้ำ",
  poles: "เสาไฟฟ้าคอนกรีต",
  piles: "เสาเข็มคอนกรีตอัดแรง",
  walls: "รั้วและกำแพงกันดิน",
  finished_goods: "สินค้าสำเร็จรูป",
  raw_material: "วัตถุดิบ",
};

export const ProductPublicView: React.FC<ProductPublicViewProps> = ({ item, skuParam }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedSku, setCopiedSku] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (item) {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://store-app2.vercel.app";
      const productUrl = `${origin}/products/${encodeURIComponent(item.sku)}`;

      QRCode.toDataURL(productUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code Error:", err));
    }
  }, [item]);

  if (!item) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-md border border-slate-200 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-lg font-black text-slate-900">
            ไม่พบรหัสสินค้าในคลัง
          </h1>
          <p className="text-xs text-slate-500 font-mono bg-slate-50 py-2 px-3 rounded-xl border border-slate-100">
            SKU: {skuParam}
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            รหัสสินค้าดังกล่าวอาจถูกยกเลิก หรือยังไม่ได้นำเข้าในระบบฐานข้อมูลคลัง KCON ขอนแก่น
          </p>
          <div className="pt-2">
            <Link href="/" className="block w-full">
              <Button className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold text-sm text-white">
                <Warehouse className="h-4 w-4 mr-2" />
                เข้าสู่หน้าหลักระบบจัดการคลัง
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleCopySku = () => {
    navigator.clipboard.writeText(item.sku);
    setCopiedSku(true);
    toast.success(`คัดลอกรหัส SKU "${item.sku}" แล้ว`);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("คัดลอกลิงก์ข้อมูลสินค้าในคลังแล้ว");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `KCON-TAG-${item.sku}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`ดาวน์โหลด QR Code สำหรับ ${item.sku} แล้ว`);
  };

  const plantName = PLANT_NAMES[item.plant_id] || `โรงผลิต ${item.plant_id}`;
  const categoryLabel = CATEGORY_NAMES[item.category] || item.category;

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 pb-12">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>ระบบตรวจนับคลัง</span>
        </Link>
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="KCON Logo"
            width={24}
            height={24}
            className="rounded object-contain"
          />
          <span className="text-xs font-black tracking-wide text-white">
            KCON WAREHOUSE
          </span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Main Warehouse Tag Card */}
        <div className="bg-white text-slate-900 rounded-3xl p-5 shadow-xl border border-slate-200 space-y-4">
          {/* Card Top Brand Info */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                ป้ายข้อมูลสินค้าดิจิทัลในคลัง (DIGITAL STOCK TAG)
              </span>
              <h2 className="text-xs font-bold text-slate-800">
                บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด
              </h2>
            </div>
            <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 font-bold text-[11px] px-2.5 py-0.5">
              โรง {item.plant_id}
            </Badge>
          </div>

          {/* Product Header */}
          <div className="space-y-1.5 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-xl">
              <span className="font-mono text-sm font-black text-blue-700 tracking-wide">
                {item.sku}
              </span>
            </div>
            <h1 className="text-lg font-black text-slate-900 leading-snug">
              {item.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {plantName} • {categoryLabel}
            </p>
          </div>

          {/* Current Stock Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Boxes className="h-3.5 w-3.5 text-blue-400" />
                ยอดสต็อกคงเหลือในคลัง
              </span>
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                มีในคลัง
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-white tracking-tight">
                {formatNumber(item.current_quantity)}
              </span>
              <span className="text-sm font-bold text-blue-300">
                {item.unit || "ชิ้น"}
              </span>
            </div>
          </div>

          {/* Product Specifications & Dimensions */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Ruler className="h-3.5 w-3.5 text-slate-400" />
              <span>ข้อมูลจำเพาะ & ขนาดสินค้า</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold block">ขนาด / มิติ</span>
                <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                  {item.size || "-"}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold block">สเปกย่อย / ลวด</span>
                <span className="font-bold text-slate-800 text-[11px] block mt-0.5 truncate">
                  {item.variant || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Storage Locations in Warehouse */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>จุดวางจัดเก็บในคลัง (Storage Positions)</span>
            </div>
            {item.locations && item.locations.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {item.locations.map((loc, idx) => (
                  <div
                    key={loc.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-100 text-blue-800 font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">
                        ล็อค {loc.lock_code} / แถว {loc.row_code}
                      </span>
                    </div>
                    <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                      {formatNumber(loc.expected_quantity)} {item.unit || "ชิ้น"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic pt-1">
                {item.zone || "ไม่ระบุตำแหน่งจัดเก็บ"}
              </p>
            )}
          </div>

          {/* High-Resolution QR Code */}
          <div className="pt-2 text-center space-y-2">
            <span className="text-[11px] font-bold text-slate-500 block">
              QR Code ประจำสินค้า (สแกนเพื่อเปิดหน้านี้ได้ทุกที่)
            </span>
            <div className="flex justify-center">
              {qrDataUrl ? (
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs inline-block">
                  <Image
                    src={qrDataUrl}
                    alt={`QR Code ${item.sku}`}
                    width={180}
                    height={180}
                    className="w-40 h-40 object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
                  กำลังสร้าง QR...
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              ป้ายนี้เชื่อมโยงกับระบบคลัง KCON ขอนแก่นโดยตรง
            </p>
          </div>

          {/* Primary Action Button: Start Stock Count */}
          <div className="pt-2 space-y-2">
            <Link href={`/?sku=${encodeURIComponent(item.sku)}`} className="block w-full">
              <Button className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                เริ่มตรวจนับสต็อกสินค้านี้
              </Button>
            </Link>

            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopySku}
                className="h-10 rounded-xl text-xs font-bold border-slate-200 text-slate-700"
              >
                {copiedSku ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copiedSku ? "คัดลอกแล้ว" : "ก๊อปปี้ SKU"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="h-10 rounded-xl text-xs font-bold border-slate-200 text-slate-700"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 mr-1 text-blue-600" />}
                {copiedLink ? "คัดลอกแล้ว" : "ก๊อปปี้ลิงก์"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadQr}
                className="h-10 rounded-xl text-xs font-bold border-slate-200 text-slate-700"
              >
                <Download className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                เซฟภาพ QR
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Shortcut */}
        <div className="text-center pt-2">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">
            <Warehouse className="h-4 w-4" />
            <span>เข้าสู่หน้ารวมคลังสินค้า KCON</span>
          </Link>
        </div>
      </div>
    </main>
  );
};
