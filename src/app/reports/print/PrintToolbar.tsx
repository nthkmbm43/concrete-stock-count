"use client";

import React from "react";
import { Printer, ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintToolbarProps {
  excelUrl: string;
  pdfUrl: string;
  reportTitle: string;
  itemCount: number;
}

export function PrintToolbar({
  excelUrl,
  pdfUrl,
  reportTitle,
  itemCount,
}: PrintToolbarProps) {
  return (
    <aside
      aria-label="Print controls"
      className="no-print sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 px-4 py-3 shadow-md"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white gap-1.5 cursor-pointer text-xs h-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            ย้อนกลับ
          </Button>
          <div>
            <h1 className="font-semibold text-sm text-slate-100 line-clamp-1">
              {reportTitle}
            </h1>
            <p className="text-[11px] text-slate-400">
              พร้อมพิมพ์ {itemCount} จุดวาง (A4 Landscape)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={excelUrl}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            ดาวน์โหลด Excel
          </a>

          <a
            href={pdfUrl}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            ดาวน์โหลด PDF
          </a>

          <Button
            size="sm"
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 cursor-pointer text-xs h-8 font-medium shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            พิมพ์เอกสาร A4 (Print)
          </Button>
        </div>
      </div>
    </aside>
  );
}
