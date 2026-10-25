import ExcelJS from "exceljs";
import { ReportDataResult, ReportItemRow, PlantReportSummary } from "@/db/queries/reports";

const COLORS = {
  headerBg: "1E3A8A", // Deep Navy/Blue
  headerText: "FFFFFF",
  subHeaderBg: "F1F5F9",
  subHeaderText: "1E293B",
  border: "CBD5E1",
  zebraBg: "F8FAFC",
  white: "FFFFFF",
  surplusBg: "DCFCE7", // Light green
  surplusText: "166534", // Dark green
  deficitBg: "FEE2E2", // Light red
  deficitText: "991B1B", // Dark red
  neutralText: "64748B",
  cardBg: "F8FAFC",
  cardBorder: "E2E8F0",
};

export async function generateStockCountExcel(data: ReportDataResult): Promise<Buffer> {
  const { summary, rows, groupedByPlant, differenceRows } = data;
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Concrete Factory Stock System";
  workbook.lastModifiedBy = summary.generatedBy || "Inventory Admin";
  workbook.created = new Date();
  workbook.modified = new Date();

  // ─────────────────────────────────────────────────────────
  // SHEET 1: สรุปรอบนับ (Executive Summary & KPIs)
  // ─────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet("สรุปรอบนับ", {
    views: [{ showGridLines: true }],
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  setupSummarySheet(summarySheet, summary);

  // ─────────────────────────────────────────────────────────
  // SHEETS 2..N: Per-Plant Detailed Sheets
  // ─────────────────────────────────────────────────────────
  for (const plantSum of summary.plantSummaries) {
    const pRows = groupedByPlant[plantSum.plantId] || [];
    const sheetName = `โรง ${plantSum.plantId}`;
    const plantSheet = workbook.addWorksheet(sheetName, {
      views: [{ state: "frozen", ySplit: 7, xSplit: 0, showGridLines: true }],
      pageSetup: {
        orientation: "landscape",
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    populateDetailSheet(
      plantSheet,
      pRows,
      `${summary.title} - ${plantSum.plantName}`,
      summary.generatedAt,
      summary.companyNameTh
        ? `${summary.companyNameTh} (${summary.brandName || "KCON"})`
        : "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด (KCON)"
    );
  }

  // ─────────────────────────────────────────────────────────
  // SHEET: รายการมีผลต่าง (Only items with differences)
  // ─────────────────────────────────────────────────────────
  if (differenceRows.length > 0) {
    const diffSheet = workbook.addWorksheet("รายการมีผลต่าง", {
      views: [{ state: "frozen", ySplit: 7, xSplit: 0, showGridLines: true }],
      pageSetup: {
        orientation: "landscape",
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    populateDetailSheet(
      diffSheet,
      differenceRows,
      `${summary.title} (เฉพาะรายการที่มียอดผลต่าง ${differenceRows.length} จุด)`,
      summary.generatedAt,
      summary.companyNameTh
        ? `${summary.companyNameTh} (${summary.brandName || "KCON"})`
        : "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด (KCON)"
    );
  }

  // Write and return buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function setupSummarySheet(ws: ExcelJS.Worksheet, summary: any) {
  ws.columns = [
    { width: 5 },  // A
    { width: 28 }, // B
    { width: 18 }, // C
    { width: 18 }, // D
    { width: 18 }, // E
    { width: 18 }, // F
    { width: 18 }, // G
    { width: 22 }, // H
    { width: 5 },  // I
  ];

  // 1. Company Banner
  ws.mergeCells("B2:H2");
  const titleCell = ws.getCell("B2");
  titleCell.value = summary.companyNameTh
    ? `${summary.companyNameTh} (${summary.brandName || "KCON"})`
    : "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด (KCON)";
  titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(2).height = 26;

  ws.mergeCells("B3:H3");
  const subTitleCell = ws.getCell("B3");
  subTitleCell.value = summary.title;
  subTitleCell.font = { name: "Arial", size: 13, bold: true, color: { argb: "FF334155" } };
  subTitleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(3).height = 22;

  ws.mergeCells("B4:H4");
  const metaCell = ws.getCell("B4");
  const metaText = [
    summary.roundPeriod ? `ช่วงเวลา: ${summary.roundPeriod}` : "",
    summary.roundStatus ? `สถานะ: ${summary.roundStatus}` : "",
    `วันที่พิมพ์รายงาน: ${summary.generatedAt}`,
  ]
    .filter(Boolean)
    .join("   |   ");
  metaCell.value = metaText;
  metaCell.font = { name: "Arial", size: 10, color: { argb: "FF64748B" } };
  metaCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(4).height = 18;

  // 2. KPI Cards Block (Row 6 - 8)
  const kpis = [
    { label: "จำนวน SKU ทั้งหมด", val: `${summary.totalSkus.toLocaleString()} รายการ`, col: "B" },
    { label: "ตรวจนับแล้วเสร็จ", val: `${summary.countedSkus.toLocaleString()} (${summary.countedPercentage}%)`, col: "C" },
    { label: "ยอดคงเหลือระบบ", val: `${summary.totalSystemQty.toLocaleString()}`, col: "D" },
    { label: "ยอดนับจริงรวม", val: `${summary.totalCountedQty.toLocaleString()}`, col: "E" },
    {
      label: "ผลต่างสุทธิ",
      val: `${summary.totalDifferenceQty >= 0 ? "+" : ""}${summary.totalDifferenceQty.toLocaleString()}`,
      col: "F",
      highlight: summary.totalDifferenceQty !== 0,
    },
    {
      label: "รายการที่พบผลต่าง",
      val: `${summary.itemsWithDiffCount.toLocaleString()} จุด`,
      col: "G",
      highlight: summary.itemsWithDiffCount > 0,
    },
  ];

  ws.getRow(6).height = 18;
  ws.getRow(7).height = 24;

  kpis.forEach((kpi) => {
    const lblCell = ws.getCell(`${kpi.col}6`);
    lblCell.value = kpi.label;
    lblCell.font = { name: "Arial", size: 9, color: { argb: "FF64748B" }, bold: true };
    lblCell.alignment = { vertical: "middle", horizontal: "center" };
    lblCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    setThinBorder(lblCell);

    const valCell = ws.getCell(`${kpi.col}7`);
    valCell.value = kpi.val;
    valCell.font = {
      name: "Arial",
      size: 13,
      bold: true,
      color: {
        argb: kpi.highlight
          ? summary.totalDifferenceQty < 0
            ? "FFDC2626"
            : "FF16A34A"
          : "FF0F172A",
      },
    };
    valCell.alignment = { vertical: "middle", horizontal: "center" };
    valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
    setThinBorder(valCell);
  });

  // 3. Plant Breakdown Table (Row 10+)
  ws.mergeCells("B10:H10");
  const tableTitle = ws.getCell("B10");
  tableTitle.value = "สรุปผลการตรวจนับแยกรายโรงงาน";
  tableTitle.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF1E3A8A" } };
  tableTitle.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(10).height = 22;

  const plantHeaders = [
    { title: "โรงงาน / แผนก", col: "B" },
    { title: "จำนวน SKU", col: "C" },
    { title: "นับเสร็จแล้ว", col: "D" },
    { title: "ยอดระบบรวม", col: "E" },
    { title: "ยอดนับจริงรวม", col: "F" },
    { title: "ผลต่างรวม", col: "G" },
    { title: "จุดที่มีผลต่าง", col: "H" },
  ];

  ws.getRow(11).height = 24;
  plantHeaders.forEach((h) => {
    const cell = ws.getCell(`${h.col}11`);
    cell.value = h.title;
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.headerBg}` } };
    setThinBorder(cell);
  });

  let curRow = 12;
  for (const p of summary.plantSummaries) {
    ws.getRow(curRow).height = 20;
    const isEven = curRow % 2 === 0;
    const bg = isEven ? COLORS.zebraBg : COLORS.white;

    const bCell = ws.getCell(`B${curRow}`);
    bCell.value = p.plantName;
    bCell.font = { name: "Arial", size: 10, bold: true };
    bCell.alignment = { vertical: "middle", horizontal: "left" };
    bCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${bg}` } };
    setThinBorder(bCell);

    const cCell = ws.getCell(`C${curRow}`);
    cCell.value = p.totalSkus;
    cCell.font = { name: "Arial", size: 10 };
    cCell.alignment = { vertical: "middle", horizontal: "right" };
    cCell.numFmt = "#,##0";
    cCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${bg}` } };
    setThinBorder(cCell);

    const dCell = ws.getCell(`D${curRow}`);
    dCell.value = p.countedSkus;
    dCell.font = { name: "Arial", size: 10 };
    dCell.alignment = { vertical: "middle", horizontal: "right" };
    dCell.numFmt = "#,##0";
    dCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${bg}` } };
    setThinBorder(dCell);

    const eCell = ws.getCell(`E${curRow}`);
    eCell.value = p.systemQty;
    eCell.font = { name: "Arial", size: 10 };
    eCell.alignment = { vertical: "middle", horizontal: "right" };
    eCell.numFmt = "#,##0";
    eCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${bg}` } };
    setThinBorder(eCell);

    const fCell = ws.getCell(`F${curRow}`);
    fCell.value = p.countedQty;
    fCell.font = { name: "Arial", size: 10 };
    fCell.alignment = { vertical: "middle", horizontal: "right" };
    fCell.numFmt = "#,##0";
    fCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${bg}` } };
    setThinBorder(fCell);

    const gCell = ws.getCell(`G${curRow}`);
    gCell.value = p.differenceQty;
    gCell.font = {
      name: "Arial",
      size: 10,
      bold: p.differenceQty !== 0,
      color: {
        argb:
          p.differenceQty < 0
            ? `FF${COLORS.deficitText}`
            : p.differenceQty > 0
            ? `FF${COLORS.surplusText}`
            : `FF${COLORS.neutralText}`,
      },
    };
    gCell.alignment = { vertical: "middle", horizontal: "right" };
    gCell.numFmt = "+#,##0;-#,##0;0";
    gCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb:
          p.differenceQty < 0
            ? `FF${COLORS.deficitBg}`
            : p.differenceQty > 0
            ? `FF${COLORS.surplusBg}`
            : `FF${bg}`,
      },
    };
    setThinBorder(gCell);

    const hCell = ws.getCell(`H${curRow}`);
    hCell.value = p.diffCount;
    hCell.font = { name: "Arial", size: 10 };
    hCell.alignment = { vertical: "middle", horizontal: "right" };
    hCell.numFmt = "#,##0";
    hCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${bg}` } };
    setThinBorder(hCell);

    curRow++;
  }

  // Total summary row
  ws.getRow(curRow).height = 22;
  const totCell = ws.getCell(`B${curRow}`);
  totCell.value = "รวมทั้งหมด";
  totCell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF1E3A8A" } };
  totCell.alignment = { vertical: "middle", horizontal: "left" };
  totCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  setThinBorder(totCell);

  const tC = ws.getCell(`C${curRow}`);
  tC.value = summary.totalSkus;
  tC.font = { name: "Arial", size: 10, bold: true };
  tC.alignment = { vertical: "middle", horizontal: "right" };
  tC.numFmt = "#,##0";
  tC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  setThinBorder(tC);

  const tD = ws.getCell(`D${curRow}`);
  tD.value = summary.countedSkus;
  tD.font = { name: "Arial", size: 10, bold: true };
  tD.alignment = { vertical: "middle", horizontal: "right" };
  tD.numFmt = "#,##0";
  tD.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  setThinBorder(tD);

  const tE = ws.getCell(`E${curRow}`);
  tE.value = summary.totalSystemQty;
  tE.font = { name: "Arial", size: 10, bold: true };
  tE.alignment = { vertical: "middle", horizontal: "right" };
  tE.numFmt = "#,##0";
  tE.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  setThinBorder(tE);

  const tF = ws.getCell(`F${curRow}`);
  tF.value = summary.totalCountedQty;
  tF.font = { name: "Arial", size: 10, bold: true };
  tF.alignment = { vertical: "middle", horizontal: "right" };
  tF.numFmt = "#,##0";
  tF.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  setThinBorder(tF);

  const tG = ws.getCell(`G${curRow}`);
  tG.value = summary.totalDifferenceQty;
  tG.font = {
    name: "Arial",
    size: 10,
    bold: true,
    color: {
      argb:
        summary.totalDifferenceQty < 0
          ? `FF${COLORS.deficitText}`
          : summary.totalDifferenceQty > 0
          ? `FF${COLORS.surplusText}`
          : `FF${COLORS.neutralText}`,
    },
  };
  tG.alignment = { vertical: "middle", horizontal: "right" };
  tG.numFmt = "+#,##0;-#,##0;0";
  tG.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  setThinBorder(tG);

  const tH = ws.getCell(`H${curRow}`);
  tH.value = summary.itemsWithDiffCount;
  tH.font = { name: "Arial", size: 10, bold: true };
  tH.alignment = { vertical: "middle", horizontal: "right" };
  tH.numFmt = "#,##0";
  tH.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  setThinBorder(tH);

  // 4. Formal Signature Block (Row curRow + 4)
  const sigStart = curRow + 4;
  ws.getRow(sigStart).height = 20;
  ws.getRow(sigStart + 1).height = 40;
  ws.getRow(sigStart + 2).height = 20;
  ws.getRow(sigStart + 3).height = 20;

  const signatures = [
    { title: "ผู้จัดทำ / ผู้ตรวจนับสต๊อก", startCol: "B", endCol: "C" },
    { title: "หัวหน้าฝ่ายคลังสินค้า / ผู้ตรวจสอบ", startCol: "D", endCol: "E" },
    { title: "ผู้จัดการโรงงาน / ผู้อนุมัติ", startCol: "G", endCol: "H" },
  ];

  signatures.forEach((sig) => {
    ws.mergeCells(`${sig.startCol}${sigStart}:${sig.endCol}${sigStart}`);
    const hCell = ws.getCell(`${sig.startCol}${sigStart}`);
    hCell.value = sig.title;
    hCell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF475569" } };
    hCell.alignment = { vertical: "middle", horizontal: "center" };

    ws.mergeCells(`${sig.startCol}${sigStart + 1}:${sig.endCol}${sigStart + 1}`);
    const signArea = ws.getCell(`${sig.startCol}${sigStart + 1}`);
    signArea.value = "\n\n(......................................................)";
    signArea.font = { name: "Arial", size: 9, color: { argb: "FF64748B" } };
    signArea.alignment = { vertical: "bottom", horizontal: "center" };

    ws.mergeCells(`${sig.startCol}${sigStart + 2}:${sig.endCol}${sigStart + 2}`);
    const dateArea = ws.getCell(`${sig.startCol}${sigStart + 2}`);
    dateArea.value = "วันที่ ..... / ..... / .........";
    dateArea.font = { name: "Arial", size: 9, color: { argb: "FF64748B" } };
    dateArea.alignment = { vertical: "middle", horizontal: "center" };
  });
}

function populateDetailSheet(
  ws: ExcelJS.Worksheet,
  rows: ReportItemRow[],
  sheetTitle: string,
  generatedAt: string,
  companyTitle = "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด (KCON)"
) {
  // Columns definition
  ws.columns = [
    { width: 6 },  // A: No
    { width: 16 }, // B: SKU
    { width: 34 }, // C: Name
    { width: 18 }, // D: Spec
    { width: 10 }, // E: Unit
    { width: 12 }, // F: Plant
    { width: 10 }, // G: Lock
    { width: 8 },  // H: Row
    { width: 14 }, // I: System Qty
    { width: 14 }, // J: Counted Qty
    { width: 14 }, // K: Diff
    { width: 16 }, // L: Location Status
    { width: 24 }, // M: Location Note
    { width: 22 }, // N: Count Note
    { width: 16 }, // O: Counted By
    { width: 18 }, // P: Counted At
  ];

  // 1. Title Banner
  ws.mergeCells("A2:P2");
  const compCell = ws.getCell("A2");
  compCell.value = companyTitle;
  compCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF1E3A8A" } };
  compCell.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(2).height = 22;

  ws.mergeCells("A3:P3");
  const tCell = ws.getCell("A3");
  tCell.value = sheetTitle;
  tCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF1E293B" } };
  tCell.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(3).height = 20;

  ws.mergeCells("A4:P4");
  const mCell = ws.getCell("A4");
  mCell.value = `วันที่พิมพ์รายงาน: ${generatedAt}  |  จำนวนรายการทั้งหมด: ${rows.length} จุดวาง`;
  mCell.font = { name: "Arial", size: 9, color: { argb: "FF64748B" } };
  mCell.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(4).height = 18;

  // 2. Table Headers (Row 7)
  const headers = [
    "ลำดับ",
    "รหัสสินค้า",
    "ชื่อสินค้า",
    "สเปก/ขนาด",
    "หน่วย",
    "โรง",
    "ล็อค",
    "แถว",
    "ยอดระบบ",
    "ยอดนับจริง",
    "ผลต่าง",
    "สถานะจุดวาง",
    "หมายเหตุจุดวาง",
    "หมายเหตุรวม",
    "ผู้ตรวจนับ",
    "วันเวลานับ",
  ];

  const headerRow = ws.getRow(7);
  headerRow.height = 28;

  headers.forEach((h, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    const cell = ws.getCell(`${colLetter}7`);
    cell.value = h;
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = {
      vertical: "middle",
      horizontal: idx >= 8 && idx <= 10 ? "right" : idx >= 5 && idx <= 7 ? "center" : idx === 0 ? "center" : "left",
      wrapText: true,
    };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.headerBg}` } };
    setThinBorder(cell);
  });

  // Enable Auto-filter on row 7
  ws.autoFilter = { from: "A7", to: "P7" };

  // 3. Populate Rows
  let curRow = 8;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const row = ws.getRow(curRow);
    row.height = 20;
    const isEven = i % 2 === 0;
    const baseBg = isEven ? COLORS.white : COLORS.zebraBg;

    // A: No
    setCellValue(ws.getCell(`A${curRow}`), i + 1, "center", baseBg);

    // B: SKU (repeated for multi-location)
    setCellValue(ws.getCell(`B${curRow}`), r.sku, "left", baseBg, true);

    // C: Name
    setCellValue(ws.getCell(`C${curRow}`), r.name, "left", baseBg);

    // D: Spec
    setCellValue(ws.getCell(`D${curRow}`), r.spec, "left", baseBg);

    // E: Unit
    setCellValue(ws.getCell(`E${curRow}`), r.unit, "center", baseBg);

    // F: Plant
    setCellValue(ws.getCell(`F${curRow}`), `โรง ${r.plantId}`, "center", baseBg);

    // G: Lock
    setCellValue(ws.getCell(`G${curRow}`), r.lockCode, "center", baseBg, r.locationSource === "NEW");

    // H: Row
    setCellValue(ws.getCell(`H${curRow}`), r.rowCode, "center", baseBg);

    // I: System Qty
    const sysCell = ws.getCell(`I${curRow}`);
    sysCell.value = r.systemQuantity;
    sysCell.numFmt = "#,##0";
    sysCell.alignment = { vertical: "middle", horizontal: "right" };
    sysCell.font = { name: "Arial", size: 9 };
    sysCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${baseBg}` } };
    setThinBorder(sysCell);

    // J: Counted Qty
    const cntCell = ws.getCell(`J${curRow}`);
    cntCell.value = r.countedQuantity;
    cntCell.numFmt = "#,##0";
    cntCell.alignment = { vertical: "middle", horizontal: "right" };
    cntCell.font = { name: "Arial", size: 9, bold: true };
    cntCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${baseBg}` } };
    setThinBorder(cntCell);

    // K: Difference with Conditional Colors
    const diffCell = ws.getCell(`K${curRow}`);
    diffCell.value = r.difference;
    diffCell.numFmt = "+#,##0;-#,##0;0";
    diffCell.alignment = { vertical: "middle", horizontal: "right" };
    const diffBg =
      r.difference < 0
        ? COLORS.deficitBg
        : r.difference > 0
        ? COLORS.surplusBg
        : baseBg;
    const diffFg =
      r.difference < 0
        ? COLORS.deficitText
        : r.difference > 0
        ? COLORS.surplusText
        : COLORS.neutralText;
    diffCell.font = { name: "Arial", size: 9, bold: r.difference !== 0, color: { argb: `FF${diffFg}` } };
    diffCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${diffBg}` } };
    setThinBorder(diffCell);

    // L: Location Status
    const obsLabel = formatObservationStatus(r.observationStatus, r.locationSource);
    setCellValue(ws.getCell(`L${curRow}`), obsLabel, "center", baseBg);

    // M: Location Note
    setCellValue(ws.getCell(`M${curRow}`), r.locationNote || "-", "left", baseBg);

    // N: Count Note
    setCellValue(ws.getCell(`N${curRow}`), r.generalNote || "-", "left", baseBg);

    // O: Counted By
    setCellValue(ws.getCell(`O${curRow}`), r.countedBy || "-", "left", baseBg);

    // P: Counted At
    setCellValue(ws.getCell(`P${curRow}`), r.countedAt || "-", "center", baseBg);

    curRow++;
  }

  // Summary Row at the bottom
  ws.getRow(curRow).height = 24;
  ws.mergeCells(`A${curRow}:H${curRow}`);
  const totLbl = ws.getCell(`A${curRow}`);
  totLbl.value = "ยอดรวมสุทธิ (Total)";
  totLbl.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF1E3A8A" } };
  totLbl.alignment = { vertical: "middle", horizontal: "center" };
  totLbl.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  setThinBorder(totLbl);

  // Sum formula for System Qty
  const sysTotal = ws.getCell(`I${curRow}`);
  sysTotal.value = { formula: `SUM(I8:I${curRow - 1})` };
  sysTotal.numFmt = "#,##0";
  sysTotal.font = { name: "Arial", size: 10, bold: true };
  sysTotal.alignment = { vertical: "middle", horizontal: "right" };
  sysTotal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  setThinBorder(sysTotal);

  // Sum formula for Counted Qty
  const cntTotal = ws.getCell(`J${curRow}`);
  cntTotal.value = { formula: `SUM(J8:J${curRow - 1})` };
  cntTotal.numFmt = "#,##0";
  cntTotal.font = { name: "Arial", size: 10, bold: true };
  cntTotal.alignment = { vertical: "middle", horizontal: "right" };
  cntTotal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  setThinBorder(cntTotal);

  // Sum formula for Difference
  const diffTotal = ws.getCell(`K${curRow}`);
  diffTotal.value = { formula: `SUM(K8:K${curRow - 1})` };
  diffTotal.numFmt = "+#,##0;-#,##0;0";
  diffTotal.font = { name: "Arial", size: 10, bold: true };
  diffTotal.alignment = { vertical: "middle", horizontal: "right" };
  diffTotal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  setThinBorder(diffTotal);

  ws.mergeCells(`L${curRow}:P${curRow}`);
  const padCell = ws.getCell(`L${curRow}`);
  padCell.value = "";
  padCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  setThinBorder(padCell);
}

function setCellValue(
  cell: ExcelJS.Cell,
  val: any,
  align: "left" | "center" | "right",
  bg: string,
  bold = false
) {
  cell.value = val;
  cell.font = { name: "Arial", size: 9, bold };
  cell.alignment = { vertical: "middle", horizontal: align };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${bg}` } };
  setThinBorder(cell);
}

function setThinBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: "thin", color: { argb: "FFCBD5E1" } },
    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    left: { style: "thin", color: { argb: "FFCBD5E1" } },
    right: { style: "thin", color: { argb: "FFCBD5E1" } },
  };
}

function formatObservationStatus(obsStatus?: string, sourceType?: string): string {
  if (sourceType === "NEW") return "จุดวางใหม่";
  switch (obsStatus) {
    case "FOUND":
      return "พบปกติ";
    case "MOVED":
      return "ย้ายตำแหน่ง";
    case "NOT_FOUND":
      return "ไม่พบสินค้า";
    case "NEW_LOCATION":
      return "จุดวางใหม่";
    default:
      return "ปกติ";
  }
}
