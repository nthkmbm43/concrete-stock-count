import { NextRequest, NextResponse, connection } from "next/server";
import ExcelJS from "exceljs";
import { getOptionalUser } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  await connection();
  const _url = new URL(req.url);
  try {
    const user = await getOptionalUser();
    if (!user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนดาวน์โหลด Template (401 Unauthorized)" },
        { status: 401 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "KCON Concrete Stock System";
    workbook.created = new Date();

    // ────────────────────────────────────────────────────────
    // Sheet 1: Master Products & Stock Template
    // ────────────────────────────────────────────────────────
    const sheet1 = workbook.addWorksheet("รายการสินค้า (Products)", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    const columns = [
      { header: "รหัสสินค้า (SKU) *", key: "sku", width: 18 },
      { header: "ชื่อสินค้า *", key: "name", width: 42 },
      { header: "โรงงาน (1-4) *", key: "plant", width: 16 },
      { header: "หมวดหมู่ (Category)", key: "category", width: 20 },
      { header: "หน่วยนับ *", key: "stockUnit", width: 14 },
      { header: "จำนวนในสต๊อก", key: "quantity", width: 16 },
      { header: "รุ่น / แบบ / สเปค", key: "variant", width: 28 },
      { header: "ล็อค (จุดวาง)", key: "lockCode", width: 16 },
      { header: "แถว / ชั้น", key: "rowCode", width: 12 },
      { header: "โซน / ลานวาง", key: "zone", width: 18 },
      { header: "ความสูง / หนา", key: "height", width: 16 },
      { header: "ความกว้าง", key: "width", width: 16 },
      { header: "ความยาว", key: "length", width: 16 },
    ];

    sheet1.columns = columns;

    // Header Styling
    const headerRow = sheet1.getRow(1);
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A8A" }, // Dark Navy
      };
      cell.font = {
        name: "Segoe UI",
        bold: true,
        color: { argb: "FFFFFFFF" },
        size: 11,
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF0F172A" } },
        left: { style: "thin", color: { argb: "FF0F172A" } },
        bottom: { style: "medium", color: { argb: "FF0F172A" } },
        right: { style: "thin", color: { argb: "FF0F172A" } },
      };
    });

    // Sample Data Rows (Realistic KCON concrete items)
    const sampleRows = [
      {
        sku: "FP-250-18",
        name: "เสารั้วลวดหนาม 2.5 นิ้ว ยาว 1.80 ม.",
        plant: 2,
        category: "fences",
        stockUnit: "ต้น",
        quantity: 45,
        variant: "เสารั้วคอนกรีตอัดแรง ลวด 4 เส้น",
        lockCode: "A3",
        rowCode: "6",
        zone: "Yard-1",
        height: "2.5 นิ้ว",
        width: "2.5 นิ้ว",
        length: "1.80 ม.",
      },
      {
        sku: "FP-250-18",
        name: "เสารั้วลวดหนาม 2.5 นิ้ว ยาว 1.80 ม.",
        plant: 2,
        category: "fences",
        stockUnit: "ต้น",
        quantity: 45,
        variant: "เสารั้วคอนกรีตอัดแรง ลวด 4 เส้น (จุดวางที่ 2)",
        lockCode: "B3",
        rowCode: "2",
        zone: "Yard-1",
        height: "2.5 นิ้ว",
        width: "2.5 นิ้ว",
        length: "1.80 ม.",
      },
      {
        sku: "I-26",
        name: "เสาเข็มไอ 26 ซม. ปลายเปิด",
        plant: 2,
        category: "piles",
        stockUnit: "ต้น",
        quantity: 120,
        variant: "เสาเข็มคอนกรีตอัดแรง I-26",
        lockCode: "Yard-1",
        rowCode: "1",
        zone: "Yard-1",
        height: "26 ซม.",
        width: "26 ซม.",
        length: "6.00 ม.",
      },
      {
        sku: "HC-05",
        name: "แผ่นพื้นคอนกรีตสำเร็จรูป Hollow Core หนา 5 ซม.",
        plant: 3,
        category: "hollow_core",
        stockUnit: "แผ่น",
        quantity: 350,
        variant: "Hollow Core Slab 5 cm.",
        lockCode: "HC-A",
        rowCode: "1",
        zone: "Yard แผ่นพื้น",
        height: "5 ซม.",
        width: "1.20 ม.",
        length: "4.00 ม.",
      },
      {
        sku: "CB-STD",
        name: "ขอบคันหินคอนกรีตมาตรฐาน 15x30x100 ซม.",
        plant: 4,
        category: "curbstones",
        stockUnit: "ท่อน",
        quantity: 140,
        variant: "ขอบคันหินรางน้ำคอนกรีต",
        lockCode: "Yard-1",
        rowCode: "1",
        zone: "Yard L-Wall",
        height: "30 ซม.",
        width: "15 ซม.",
        length: "100 ซม.",
      },
      {
        sku: "RM-CEM-T3",
        name: "ปูนซีเมนต์ปอร์ตแลนด์ Type 3 (ตราช้าง)",
        plant: 1,
        category: "raw_materials",
        stockUnit: "ถุง",
        quantity: 500,
        variant: "ปูนซีเมนต์ปอร์ตแลนด์แข็งตัวเร็ว Type 3",
        lockCode: "Sil-A",
        rowCode: "1",
        zone: "ไซโลปูน",
        height: "-",
        width: "-",
        length: "-",
      },
    ];

    sampleRows.forEach((row, idx) => {
      const addedRow = sheet1.addRow(row);
      addedRow.height = 24;
      const isEven = idx % 2 === 0;
      addedRow.eachCell((cell, colNumber) => {
        cell.font = { name: "Segoe UI", size: 10 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: isEven ? "FFFFFFFF" : "FFF8FAFC" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        // Alignments
        if (colNumber === 3 || colNumber === 5 || colNumber === 6 || colNumber === 8 || colNumber === 9) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        }
      });
    });

    // ────────────────────────────────────────────────────────
    // Sheet 2: Guidelines & Reference Code Master
    // ────────────────────────────────────────────────────────
    const sheet2 = workbook.addWorksheet("คำแนะนำและรหัสอ้างอิง");
    sheet2.columns = [
      { header: "หัวข้อ", key: "topic", width: 28 },
      { header: "ค่าที่รองรับ / ตัวอย่าง", key: "val", width: 36 },
      { header: "คำอธิบาย", key: "desc", width: 55 },
    ];

    const refHeader = sheet2.getRow(1);
    refHeader.height = 28;
    refHeader.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF334155" },
      };
      cell.font = { name: "Segoe UI", bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    const refRows = [
      {
        topic: "โรงงาน (Plant ID) *",
        val: "1, 2, 3, 4",
        desc: "1 = สนง.ใหญ่ / ไซโลปูน, 2 = ลานเสารั้ว-เสาเข็ม, 3 = แผ่นพื้น Hollow Core, 4 = L-Wall / ขอบคันหิน",
      },
      {
        topic: "หน่วยนับ (Stock Unit) *",
        val: "ต้น, แผ่น, ชิ้น, ท่อน, อัน, ก้อน, ถุง, กก., ตัน, เมตร, คิว, ม้วน, เส้น, ชุด, พาเลท",
        desc: "หน่วยนับหลักของสต๊อก ระบบจะปรับรูปแบบตัวย่อให้อัตโนมัติ (เช่น kg -> กก., pcs -> ชิ้น)",
      },
      {
        topic: "หมวดหมู่ (Category)",
        val: "fences, piles, planks, hollow_core, curbstones, retaining_walls, pipes, blocks, raw_materials",
        desc: "รหัสหมวดหมู่สินค้า หรือระบุเป็นภาษาไทย เช่น เสารั้ว, เสาเข็ม, แผ่นพื้น, ขอบคันหิน, วัตถุดิบ",
      },
      {
        topic: "การรวมหลายจุดวาง (Multi-Location)",
        val: "ใส่ SKU เดียวกันในหลายแถว",
        desc: "หาก SKU เดียวกันมีสินค้าอยู่ในหลายล็อค/แถว สามารถใส่ซ้ำได้ ระบบจะรวมจุดวางและยอดสต๊อกให้อัตโนมัติ",
      },
      {
        topic: "นโยบายสินค้าซ้ำ (Policy)",
        val: "ข้าม (Skip) / อัปเดต (Update)",
        desc: "ตอนนำเข้าสามารถเลือกได้ว่า หากพบ SKU ที่มีอยู่ในฐานข้อมูลแล้ว จะให้ข้าม หรืออัปเดตยอดสต๊อก",
      },
    ];

    refRows.forEach((r) => {
      const row = sheet2.addRow(r);
      row.height = 24;
      row.eachCell((cell) => {
        cell.font = { name: "Segoe UI", size: 10 };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="kcon-stock-import-template.xlsx"; filename*=UTF-8\'\'kcon-stock-import-template.xlsx',
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate template", details: error.message },
      { status: 500 }
    );
  }
}
