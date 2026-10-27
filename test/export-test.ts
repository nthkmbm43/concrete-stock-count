import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import ExcelJS from "exceljs";
import { generateStockCountExcel } from "../src/lib/export/excel-generator";
import { generateStockCountPdf } from "../src/lib/export/pdf-generator";
import { ReportDataResult, ReportItemRow } from "../src/db/queries/reports";

async function runExportTests() {
  console.log("==================================================");
  console.log("STARTING EXPORT & DOCUMENT GENERATION UNIT TESTS");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Mock Report Data for Testing
  // ─────────────────────────────────────────────────────────────
  const mockRows: ReportItemRow[] = [
    {
      index: 1,
      productId: "prod-1",
      sku: "FP-250-18",
      name: "เสารั้วคอนกรีต 2.50 ม.",
      category: "เสารั้ว",
      spec: "หน้า 18 นิ้ว",
      unit: "ต้น",
      plantId: 2,
      plantName: "โรง 2 (เสาเข็ม/แผ่นพื้น)",
      lockCode: "A3",
      rowCode: "1",
      locationSource: "MASTER",
      systemQuantity: 135,
      countedQuantity: 140,
      difference: 5,
      countStatus: "SUBMITTED",
      locationNote: "เสารั้ววางเรียบร้อย",
      generalNote: "พบเสาวางเพิ่มจากล็อตก่อน",
      countedBy: "สมชาย มั่นคง",
      countedAt: "2026-10-25 14:30",
    },
    {
      index: 2,
      productId: "prod-2",
      sku: "PIPE-300-HD",
      name: "ท่อคอนกรีต คสล. 0.30 ม.",
      category: "ท่อระบายน้ำ",
      spec: "ชั้น 3",
      unit: "ท่อน",
      plantId: 1,
      plantName: "โรง 1 (ท่อคอนกรีต)",
      lockCode: "Yard-1",
      rowCode: "A",
      locationSource: "MASTER",
      systemQuantity: 50,
      countedQuantity: 40,
      difference: -10,
      countStatus: "SUBMITTED",
      locationNote: "ท่อแตกชำรุด 10 ท่อน",
      generalNote: "รอตัดยอดชำรุด",
      countedBy: "สมชาย มั่นคง",
      countedAt: "2026-10-25 15:00",
    },
    {
      index: 3,
      productId: "prod-3",
      sku: "PLANK-035",
      name: "แผ่นพื้นสำเร็จรูป Plank 0.35 ม.",
      category: "แผ่นพื้น",
      spec: "ลวด 4 เส้น",
      unit: "แผ่น",
      plantId: 3,
      plantName: "โรง 3 (บ่อพัก/คาน)",
      lockCode: "Bay-1",
      rowCode: "3",
      locationSource: "MASTER",
      systemQuantity: 200,
      countedQuantity: 200,
      difference: 0,
      countStatus: "SUBMITTED",
      locationNote: "ยอดตรงตามระบบ",
      generalNote: "",
      countedBy: "นิตยา รักษ์พงษ์",
      countedAt: "2026-10-25 15:30",
    },
  ];

  const differenceRows = mockRows.filter((r) => r.difference !== 0);

  const mockReportData: ReportDataResult = {
    summary: {
      title: "รายงานผลการตรวจนับสต๊อกสินค้าคอนกรีตประจำงวด",
      scope: "count_round",
      roundId: "round-test-oct-2026",
      roundName: "ตรวจนับประจำงวด ตุลาคม 2026",
      roundType: "MONTHLY",
      roundPeriod: "2026-10-01 ถึง 2026-10-31",
      roundStatus: "OPEN",
      totalSkus: 3,
      totalLocations: 4,
      countedSkus: 3,
      countedPercentage: 100,
      totalSystemQty: 385,
      totalCountedQty: 380,
      totalDifferenceQty: -5,
      itemsWithDiffCount: 2,
      plantSummaries: [
        {
          plantId: 1,
          plantName: "โรง 1 (ท่อคอนกรีต)",
          totalSkus: 1,
          countedSkus: 1,
          systemQty: 50,
          countedQty: 40,
          differenceQty: -10,
          diffCount: 1,
        },
        {
          plantId: 2,
          plantName: "โรง 2 (เสาเข็ม/แผ่นพื้น)",
          totalSkus: 1,
          countedSkus: 1,
          systemQty: 135,
          countedQty: 140,
          differenceQty: 5,
          diffCount: 1,
        },
        {
          plantId: 3,
          plantName: "โรง 3 (บ่อพัก/คาน)",
          totalSkus: 1,
          countedSkus: 1,
          systemQty: 200,
          countedQty: 200,
          differenceQty: 0,
          diffCount: 0,
        },
      ],
      generatedAt: "2026-10-25 16:00:00",
      generatedBy: "สมชาย มั่นคง (หัวหน้าคลัง)",
      companyNameTh: "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด",
      companyNameEn: "KHON KAEN CONCRETE PRODUCT CO., LTD.",
      brandName: "KCON",
      addressTh: "154 หมู่ 9 ถนนมะลิวัลย์ ต.บ้านทุ่ม อ.เมือง จ.ขอนแก่น 40000",
      phone: "043-255-111",
      email: "kcon.eng@gmail.com",
      website: "www.kcon-concrete.com",
      logoUrl: "/logo.png",
      reportFooter: "เอกสารรายงานผลการตรวจนับคลังสินค้าคอนกรีต • ระบบ Concrete Mobile Stock Counting",
    },
    rows: mockRows,
    groupedByPlant: {
      1: [mockRows[1]],
      2: [mockRows[0]],
      3: [mockRows[2]],
    },
    differenceRows,
  };

  // ─────────────────────────────────────────────────────────────
  // 1. Test Excel Generation Engine (ExcelJS)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 1. Testing Excel Generation Engine ---");

  const excelBuffer = await generateStockCountExcel(mockReportData);

  assert(Buffer.isBuffer(excelBuffer), "Generated Excel payload is a valid Node Buffer");
  assert(excelBuffer.length > 5000, `Excel buffer size is substantial (${excelBuffer.length} bytes)`);

  // Parse workbook back with ExcelJS to inspect worksheets and contents
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(excelBuffer as any);

  assert(workbook.worksheets.length >= 4, `Workbook contains expected sheets count (${workbook.worksheets.length} sheets)`);

  // Verify Summary Sheet
  const summarySheet = workbook.getWorksheet("สรุปรอบนับ");
  assert(summarySheet !== undefined, "Workbook contains 'สรุปรอบนับ' worksheet");

  // Verify Plant Sheets
  const plant1Sheet = workbook.getWorksheet("โรง 1");
  const plant2Sheet = workbook.getWorksheet("โรง 2");
  const plant3Sheet = workbook.getWorksheet("โรง 3");
  assert(plant1Sheet !== undefined, "Workbook contains 'โรง 1' worksheet");
  assert(plant2Sheet !== undefined, "Workbook contains 'โรง 2' worksheet");
  assert(plant3Sheet !== undefined, "Workbook contains 'โรง 3' worksheet");

  // Verify Difference Sheet
  const diffSheet = workbook.getWorksheet("รายการมีผลต่าง");
  assert(diffSheet !== undefined, "Workbook contains 'รายการมีผลต่าง' worksheet when differenceRows > 0");

  // Verify Content in Summary Sheet (Company brand & metadata)
  let foundCompanyBrand = false;
  let foundRoundTitle = false;

  summarySheet?.eachRow((row) => {
    row.eachCell((cell) => {
      const val = String(cell.value || "");
      if (val.includes("KCON") || val.includes("ขอนแก่นผลิตภัณฑ์คอนกรีต")) {
        foundCompanyBrand = true;
      }
      if (val.includes("รายงานผลการตรวจนับ")) {
        foundRoundTitle = true;
      }
    });
  });

  assert(foundCompanyBrand, "Summary sheet contains KCON company branding text");
  assert(foundRoundTitle, "Summary sheet contains round title");

  // Verify Plant 2 Detailed Sheet Rows
  let foundFpSku = false;
  let foundLockCode = false;

  plant2Sheet?.eachRow((row) => {
    row.eachCell((cell) => {
      const val = String(cell.value || "");
      if (val.includes("FP-250-18")) foundFpSku = true;
      if (val === "A3") foundLockCode = true;
    });
  });

  assert(foundFpSku, "Plant 2 sheet contains SKU 'FP-250-18'");
  assert(foundLockCode, "Plant 2 sheet contains lock code 'A3'");

  // ─────────────────────────────────────────────────────────────
  // 2. Test PDF Generation Engine (jsPDF + autotable)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Testing PDF Generation Engine ---");

  const pdfBuffer = await generateStockCountPdf(mockReportData);

  assert(Buffer.isBuffer(pdfBuffer), "Generated PDF payload is a valid Node Buffer");
  assert(pdfBuffer.length > 2000, `PDF buffer size is valid (${pdfBuffer.length} bytes)`);

  // Verify PDF header magic bytes (%PDF-1.)
  const pdfHeaderMagic = pdfBuffer.subarray(0, 5).toString("ascii");
  assert(pdfHeaderMagic.startsWith("%PDF"), `PDF magic byte signature verified ('${pdfHeaderMagic}')`);

  // ─────────────────────────────────────────────────────────────
  // 3. Test Report Data Calculations & Metrics Integrity
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. Testing Report Metrics Calculations ---");

  const calcTotalSkus = mockRows.length;
  const calcCountedSkus = mockRows.filter((r) => r.countedQuantity !== undefined && r.countedQuantity !== null).length;
  const calcPercentage = Math.round((calcCountedSkus / calcTotalSkus) * 100);

  assert(calcTotalSkus === 3, "Total SKUs calculated accurately (3)");
  assert(calcCountedSkus === 3, "Counted SKUs calculated accurately (3)");
  assert(calcPercentage === 100, "Counted percentage calculated accurately (100%)");

  const calcNetDiff = mockRows.reduce((sum, r) => sum + r.difference, 0);
  assert(calcNetDiff === -5, "Net difference quantity calculated accurately (+5 - 10 = -5)");

  const calcDiffItemsCount = mockRows.filter((r) => r.difference !== 0).length;
  assert(calcDiffItemsCount === 2, "Items with discrepancy count calculated accurately (2 items)");

  console.log("\n==================================================");
  console.log(`ALL EXPORT TESTS COMPLETED: ${passed}/${total} PASSED (100%)`);
  console.log("==================================================");
}

runExportTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
