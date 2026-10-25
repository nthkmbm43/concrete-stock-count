import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ReportDataResult, ReportItemRow } from "@/db/queries/reports";

let cachedFontBase64: string | null = null;

function getThaiFontBase64(): string | null {
  if (cachedFontBase64) return cachedFontBase64;
  try {
    const fontPath = path.join(process.cwd(), "public", "fonts", "tahoma.ttf");
    if (fs.existsSync(fontPath)) {
      cachedFontBase64 = fs.readFileSync(fontPath).toString("base64");
      return cachedFontBase64;
    }
  } catch (err) {
    console.warn("Failed to read public/fonts/tahoma.ttf:", err);
  }
  return null;
}

export async function generateStockCountPdf(data: ReportDataResult): Promise<Buffer> {
  const { summary, rows } = data;

  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const fontBase64 = getThaiFontBase64();
  const fontName = fontBase64 ? "tahoma" : "helvetica";

  if (fontBase64) {
    doc.addFileToVFS("tahoma.ttf", fontBase64);
    doc.addFont("tahoma.ttf", "tahoma", "normal");
  }

  doc.setFont(fontName);

  // 1. Header Information
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138); // #1E3A8A
  const companyTitle = summary.companyNameTh
    ? `${summary.companyNameTh} (${summary.brandName || "KCON"})`
    : "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด (KCON)";
  doc.text(companyTitle, 14, 12);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text(summary.title, 14, 18);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // #64748B
  const subMeta = [
    summary.roundPeriod ? `ช่วงเวลา: ${summary.roundPeriod}` : "",
    summary.roundStatus ? `สถานะ: ${summary.roundStatus}` : "",
    `วันที่พิมพ์: ${summary.generatedAt}`,
  ]
    .filter(Boolean)
    .join("   |   ");
  doc.text(subMeta, 14, 23);

  // 2. Summary Mini-Card Row (Y: 26 to 36)
  const pageWidth = 297;
  const cardY = 26;
  const cardHeight = 10;
  const cardWidth = 43;
  const startX = 14;

  const kpis = [
    { label: "จำนวน SKU", val: `${summary.totalSkus.toLocaleString()} รายการ` },
    { label: "นับแล้วเสร็จ", val: `${summary.countedSkus} (${summary.countedPercentage}%)` },
    { label: "ยอดคงเหลือระบบ", val: `${summary.totalSystemQty.toLocaleString()}` },
    { label: "ยอดนับจริงรวม", val: `${summary.totalCountedQty.toLocaleString()}` },
    {
      label: "ผลต่างสุทธิ",
      val: `${summary.totalDifferenceQty >= 0 ? "+" : ""}${summary.totalDifferenceQty.toLocaleString()}`,
      alert: summary.totalDifferenceQty !== 0,
    },
    {
      label: "จุดที่พบผลต่าง",
      val: `${summary.itemsWithDiffCount.toLocaleString()} จุด`,
      alert: summary.itemsWithDiffCount > 0,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = startX + idx * (cardWidth + 2);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(x, cardY, cardWidth, cardHeight, "FD");

    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + cardWidth / 2, cardY + 3.5, { align: "center" });

    doc.setFontSize(8.5);
    if (kpi.alert) {
      doc.setTextColor(summary.totalDifferenceQty < 0 ? 220 : 22, summary.totalDifferenceQty < 0 ? 38 : 163, summary.totalDifferenceQty < 0 ? 38 : 74);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(kpi.val, x + cardWidth / 2, cardY + 8, { align: "center" });
  });

  // 3. Table Rows
  const tableData = rows.map((r, i) => {
    const diffText = r.difference > 0 ? `+${r.difference.toLocaleString()}` : r.difference.toLocaleString();
    const locStatus = r.locationSource === "NEW" ? "จุดวางใหม่" : r.observationStatus === "MOVED" ? "ย้าย" : r.observationStatus === "NOT_FOUND" ? "ไม่พบ" : "ปกติ";
    const noteText = [r.locationNote, r.generalNote].filter(Boolean).join(" | ");

    return [
      (i + 1).toString(),
      r.sku,
      r.name,
      r.spec,
      r.unit,
      `โรง ${r.plantId}`,
      r.lockCode,
      r.rowCode,
      r.systemQuantity.toLocaleString(),
      r.countedQuantity.toLocaleString(),
      diffText,
      locStatus,
      noteText || "-",
      r.countedBy || "-",
    ];
  });

  autoTable(doc, {
    startY: 39,
    styles: {
      font: fontName,
      fontSize: 7.5,
      cellPadding: 1.5,
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [30, 58, 138], // #1E3A8A
      textColor: [255, 255, 255],
      fontStyle: "normal",
      halign: "center",
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },  // No
      1: { halign: "left", cellWidth: 20 },    // SKU
      2: { halign: "left", cellWidth: 42 },    // Name
      3: { halign: "left", cellWidth: 24 },    // Spec
      4: { halign: "center", cellWidth: 12 },  // Unit
      5: { halign: "center", cellWidth: 14 },  // Plant
      6: { halign: "center", cellWidth: 12 },  // Lock
      7: { halign: "center", cellWidth: 10 },  // Row
      8: { halign: "right", cellWidth: 16 },   // System
      9: { halign: "right", cellWidth: 16 },   // Counted
      10: { halign: "right", cellWidth: 16 },  // Diff
      11: { halign: "center", cellWidth: 18 }, // Status
      12: { halign: "left", cellWidth: 38 },   // Note
      13: { halign: "left", cellWidth: 21 },   // Counter
    },
    head: [
      [
        "ลำดับ",
        "รหัสสินค้า",
        "ชื่อสินค้า",
        "สเปก/ขนาด",
        "หน่วย",
        "โรง",
        "ล็อค",
        "แถว",
        "ยอดระบบ",
        "นับจริง",
        "ผลต่าง",
        "สถานะ",
        "หมายเหตุ",
        "ผู้ตรวจนับ",
      ],
    ],
    body: tableData,
    didParseCell: (data) => {
      // Highlight Difference column
      if (data.section === "body" && data.column.index === 10) {
        const rawVal = rows[data.row.index]?.difference ?? 0;
        if (rawVal < 0) {
          data.cell.styles.fillColor = [254, 226, 226]; // Light red
          data.cell.styles.textColor = [153, 27, 27];
        } else if (rawVal > 0) {
          data.cell.styles.fillColor = [220, 252, 231]; // Light green
          data.cell.styles.textColor = [22, 101, 52];
        } else {
          data.cell.styles.textColor = [100, 116, 139];
        }
      }
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const totalPages = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `หน้า ${data.pageNumber} จาก ${totalPages}  |  รายงานระบบตรวจนับคลังสินค้าคอนกรีต`,
        pageWidth / 2,
        205,
        { align: "center" }
      );
    },
  });

  // 4. Signatures on Last Page
  const finalY = (doc as any).lastAutoTable.finalY || 160;
  const sigY = finalY > 155 ? 170 : Math.max(finalY + 12, 150);

  // If table went too close to bottom, add a new page for signatures
  if (finalY > 165) {
    doc.addPage();
    drawSignatures(doc, 30);
  } else {
    drawSignatures(doc, sigY);
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

function drawSignatures(doc: jsPDF, y: number) {
  const sigBlocks = [
    { title: "ผู้จัดทำ / ผู้ตรวจนับสต๊อก", x: 35 },
    { title: "หัวหน้าฝ่ายคลังสินค้า / ผู้ตรวจสอบ", x: 125 },
    { title: "ผู้จัดการโรงงาน / ผู้อนุมัติ", x: 215 },
  ];

  sigBlocks.forEach((sig) => {
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(sig.title, sig.x, y, { align: "center" });

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("(......................................................)", sig.x, y + 14, { align: "center" });
    doc.text("วันที่ ..... / ..... / .........", sig.x, y + 20, { align: "center" });
  });
}
