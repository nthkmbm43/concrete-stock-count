"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { InventoryItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Search,
  Upload,
  Flashlight,
  FlashlightOff,
  RefreshCw,
  AlertCircle,
  X,
  ScanLine,
  CheckCircle2,
  ArrowRight,
  Boxes,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

interface QrScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onSelectProduct: (item: InventoryItem) => void;
}

/**
 * Web Audio API gentle beep for tactile warehouse scanner feedback
 */
function playScannerBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio context not permitted or unavailable
  }
}

/**
 * Extracts SKU or Identifier from raw scanned QR/Barcode string
 */
function parseScannedCode(raw: string): string {
  const trimmed = raw.trim();

  // 1. JSON payload
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.sku) return String(parsed.sku).trim();
      if (parsed.id) return String(parsed.id).trim();
    } catch {
      // Fall through
    }
  }

  // 2. URL format (e.g. https://.../?sku=SLAB-SP-100 or /product/SLAB-SP-100)
  if (trimmed.includes("sku=")) {
    try {
      const url = new URL(trimmed);
      const sku = url.searchParams.get("sku");
      if (sku) return sku.trim();
    } catch {
      // Fall through
    }
  }

  if (trimmed.includes("/")) {
    const parts = trimmed.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last.trim();
  }

  return trimmed;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  open,
  onOpenChange,
  items,
  onSelectProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerId = "kcon-qr-reader";

  // Match scanned text to an inventory item
  const findItemByCode = useCallback(
    (code: string): InventoryItem | null => {
      const parsed = parseScannedCode(code).toLowerCase();
      // 1. Exact SKU match
      const exactSku = items.find((i) => i.sku.toLowerCase() === parsed);
      if (exactSku) return exactSku;

      // 2. Exact ID match
      const exactId = items.find((i) => i.id.toLowerCase() === parsed);
      if (exactId) return exactId;

      // 3. Partial SKU or Name match
      const partial = items.find(
        (i) =>
          i.sku.toLowerCase().includes(parsed) ||
          i.name.toLowerCase().includes(parsed)
      );
      return partial || null;
    },
    [items]
  );

  // Handle successful scan
  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      playScannerBeep();
      const matched = findItemByCode(decodedText);

      if (matched) {
        toast.success(`สแกนสำเร็จ: ${matched.sku}`);
        // Stop camera and trigger product selection
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .catch(() => {})
            .finally(() => {
              setIsScanning(false);
              onOpenChange(false);
              onSelectProduct(matched);
            });
        } else {
          onOpenChange(false);
          onSelectProduct(matched);
        }
      } else {
        toast.error(`ไม่พบสินค้าที่ตรงกับรหัส "${decodedText}"`);
      }
    },
    [findItemByCode, onOpenChange, onSelectProduct]
  );

  // Start live camera stream
  const startScanner = useCallback(async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
          verbose: false,
        });
      }

      const qr = scannerRef.current;
      if (qr.isScanning) {
        return;
      }

      await qr.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Frame scan failure (quietly ignore non-barcode frames)
        }
      );

      setIsScanning(true);

      // Check torch capability
      try {
        const capabilities = qr.getRunningTrackCapabilities();
        if ((capabilities as any)?.torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn("Camera start error:", err);
      setIsScanning(false);
      setCameraError(
        "ไม่สามารถเข้าถึงกล้องถ่ายภาพได้ กรุณาอนุญาตสิทธิ์การใช้กล้อง หรือเลือกอัปโหลดรูปภาพบาร์โค้ด / ค้นหาด้วยรหัสสินค้าด้านล่าง"
      );
    }
  }, [handleScanSuccess]);

  // Stop scanner safely
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.debug("Scanner stop cleanup:", err);
      }
    }
    setIsScanning(false);
    setTorchOn(false);
  }, []);

  // Handle open/close lifecycle
  useEffect(() => {
    if (open) {
      // Small timeout to allow DOM element container to mount
      const t = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(t);
        stopScanner();
      };
    } else {
      stopScanner();
      setSearchQuery("");
      setCameraError(null);
    }
  }, [open, startScanner, stopScanner]);

  // Handle file/image upload scanning
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }
      const result = await scannerRef.current.scanFile(file, true);
      handleScanSuccess(result);
    } catch {
      toast.error("ไม่พบบาร์โค้ดหรือ QR Code ในรูปภาพ กรุณาลองถ่ายใหม่อีกครั้ง");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Toggle flashlight
  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn("Torch toggle error:", err);
    }
  };

  // Search filtered products
  const searchResults = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return items
      .filter(
        (i) =>
          i.sku.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q) ||
          i.size.toLowerCase().includes(q) ||
          (i.zone && i.zone.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [items, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-slate-200 bg-white">
        <DialogHeader className="p-4 pb-3 bg-slate-900 text-white text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <ScanLine className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-white leading-tight">
                  สแกน QR Code / บาร์โค้ดสินค้า
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  ส่องกล้องไปที่ป้ายสินค้า หรือค้นหาด้วยรหัส/ชื่อ
                </DialogDescription>
              </div>
            </div>

            {hasTorch && isScanning && (
              <button
                type="button"
                onClick={toggleTorch}
                title="เปิด/ปิด ไฟฉาย"
                className={`p-2 rounded-xl transition-all ${
                  torchOn ? "bg-amber-400 text-slate-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {torchOn ? <Flashlight className="h-4 w-4" /> : <FlashlightOff className="h-4 w-4" />}
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Live Camera Viewport Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-h-[280px] w-full flex items-center justify-center border-2 border-slate-800 shadow-inner">
            <div id={containerId} className="w-full h-full object-cover" />

            {/* Viewfinder Target Overlay */}
            {isScanning && !cameraError && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-48 h-48 border-2 border-dashed border-blue-400/80 rounded-2xl">
                  {/* Corner Target Markers */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-blue-500 rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-blue-500 rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-blue-500 rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-blue-500 rounded-br" />

                  {/* Animated Laser Beam */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-bounce mt-24" />
                </div>
              </div>
            )}

            {/* Camera Error / Permission Fallback Guidance */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/95 p-5 flex flex-col items-center justify-center text-center text-white space-y-3">
                <AlertCircle className="h-8 w-8 text-amber-400" />
                <p className="text-xs text-slate-300 leading-relaxed max-w-[260px]">
                  {cameraError}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startScanner()}
                    className="border-slate-700 bg-slate-800 text-white text-xs h-9 rounded-xl hover:bg-slate-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    ลองใหม่อีกครั้ง
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 rounded-xl"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    อัปโหลดรูป
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Photo Upload & Gallery Scan Action */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>หรือสแกนจากรูปถ่ายในเครื่อง:</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 rounded-xl border-slate-200 text-xs font-semibold text-slate-700"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              เลือกรูปภาพบาร์โค้ด
            </Button>
          </div>

          {/* Instant Search Box (ค้นหาด้วยรหัส SKU หรือชื่อสินค้า) */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="text-xs font-black text-slate-700 block">
              ค้นหาด้วยรหัส / ชื่อสินค้า (Search SKU or Name)
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์รหัส เช่น SP-100, เสาเข็ม, ท่อ คสล..."
                className="pl-10 pr-9 h-11 rounded-2xl bg-slate-50 border-slate-200 text-sm font-medium focus:bg-white focus:border-blue-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown List */}
            {searchResults.length > 0 && (
              <div className="max-h-52 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-md divide-y divide-slate-100 mt-1">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      playScannerBeep();
                      stopScanner();
                      onOpenChange(false);
                      onSelectProduct(item);
                    }}
                    className="w-full text-left p-3 hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-2 touch-press"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-blue-700 truncate">
                          {item.sku}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-200">
                          โรง {item.plant_id}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.size || item.variant || "มาตรฐาน KCON"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900 block">
                        {item.current_quantity} {item.unit}
                      </span>
                      <span className="text-[10px] text-blue-600 font-bold flex items-center justify-end gap-0.5 mt-0.5">
                        ดูรายละเอียด <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-2">
                ไม่พบสินค้าที่ตรงกับคำค้นหา
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
