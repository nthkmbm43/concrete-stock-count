import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import ExcelJS from "exceljs";
import { parseImportBuffer, validateAndAggregateRows } from "../src/lib/import/engine";
import { normalizePlantId, normalizeUnit, normalizeLockCode, escapeFormulaInjection } from "../src/lib/import/normalizer";
import { autoDetectField } from "../src/lib/import/aliases";
import { exportErrorReportAction } from "../src/actions/import";
import { getCompanySettings } from "../src/db/queries/company";

async function runTests() {
  console.log("==================================================");
  console.log("STARTING IMPORT & BRANDING AUTOMATED TEST SUITE");
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
  // 1. Test Field Auto-Detection & Aliases
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 1. Testing Field Aliases & Auto-Detection ---");
  assert(autoDetectField("รหัสสินค้า").key === "sku", "Detect 'รหัสสินค้า' -> sku");
  assert(autoDetectField("SKU").key === "sku", "Detect 'SKU' -> sku");
  assert(autoDetectField("ชื่อสินค้า (ไทย)").key === "name", "Detect 'ชื่อสินค้า (ไทย)' -> name");
  assert(autoDetectField("โรงงาน (1-4)").key === "plant", "Detect 'โรงงาน (1-4)' -> plant");
  assert(autoDetectField("หน่วยนับ").key === "stockUnit", "Detect 'หน่วยนับ' -> stockUnit");
  assert(autoDetectField("จำนวนในสต๊อก").key === "quantity", "Detect 'จำนวนในสต๊อก' -> quantity");
  assert(autoDetectField("จุดวาง (ล็อค)").key === "lockCode", "Detect 'จุดวาง (ล็อค)' -> lockCode");
  assert(autoDetectField("แถว").key === "rowCode", "Detect 'แถว' -> rowCode");

  // ─────────────────────────────────────────────────────────────
  // 2. Test Normalizers
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Testing Normalizers ---");
  assert(normalizePlantId("1") === 1, "normalizePlantId '1' -> 1");
  assert(normalizePlantId("โรง 2") === 2, "normalizePlantId 'โรง 2' -> 2");
  assert(normalizePlantId("โรงงาน 3") === 3, "normalizePlantId 'โรงงาน 3' -> 3");
  assert(normalizePlantId("Plant 4") === 4, "normalizePlantId 'Plant 4' -> 4");
  assert(normalizePlantId("5") === null, "normalizePlantId '5' -> null (invalid plant)");
  assert(normalizePlantId("โรง 9") === null, "normalizePlantId 'โรง 9' -> null");

  assert(normalizeUnit("ต้น") === "ต้น", "normalizeUnit 'ต้น' -> 'ต้น'");
  assert(normalizeUnit("แผ่นพื้น") === "แผ่น", "normalizeUnit 'แผ่นพื้น' -> 'แผ่น'");
  assert(normalizeUnit("กก.") === "กก.", "normalizeUnit 'กก.' -> 'กก.'");
  assert(normalizeUnit("kg") === "กก.", "normalizeUnit 'kg' -> 'กก.'");
  assert(normalizeUnit("ท่อน") === "ท่อน", "normalizeUnit 'ท่อน' -> 'ท่อน'");

  assert(normalizeLockCode("a3") === "A3", "normalizeLockCode 'a3' -> 'A3'");
  assert(normalizeLockCode("sil-a") === "Sil-A", "normalizeLockCode 'sil-a' -> 'Sil-A'");
  assert(normalizeLockCode("yard-1") === "Yard-1", "normalizeLockCode 'yard-1' -> 'Yard-1'");

  // Formula injection check
  assert(escapeFormulaInjection("=SUM(A1:A10)") === "'=SUM(A1:A10)", "Escape formula injection '='");
  assert(escapeFormulaInjection("+cmd|'/C'") === "'+cmd|'/C'", "Escape formula injection '+'");
  assert(escapeFormulaInjection("@HYPERLINK") === "'@HYPERLINK", "Escape formula injection '@'");
  assert(escapeFormulaInjection("Normal Text") === "Normal Text", "Do not alter safe string");

  // ─────────────────────────────────────────────────────────────
  // 3. Test Excel Parsing & Auto-Mapping
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. Testing In-Memory Excel Buffer Parsing ---");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Products");
  ws.addRow(["รหัสสินค้า", "ชื่อสินค้า", "โรงงาน", "หน่วยนับ", "จำนวน", "ล็อค", "แถว"]);
  ws.addRow(["TEST-SKU-1", "คอนกรีตทดสอบ 1", 2, "ต้น", 50, "A3", "1"]);
  ws.addRow(["TEST-SKU-1", "คอนกรีตทดสอบ 1", 2, "ต้น", 30, "B3", "2"]); // Repeated SKU multi-location
  ws.addRow(["TEST-SKU-2", "แผ่นพื้นทดสอบ", "โรง 3", "แผ่น", 100, "HC-A", "1"]);
  const excelBuffer = await wb.xlsx.writeBuffer();

  const parseResult = await parseImportBuffer(excelBuffer, "test-import.xlsx");
  assert(parseResult.sheetNames.length === 1, "Detected 1 worksheet");
  assert(parseResult.headers.includes("รหัสสินค้า"), "Headers include 'รหัสสินค้า'");
  assert(parseResult.rawRows.length === 3, "Parsed 3 data rows");
  assert(parseResult.initialMapping["รหัสสินค้า"] === "sku", "Auto-mapped 'รหัสสินค้า' -> 'sku'");
  assert(parseResult.initialMapping["ชื่อสินค้า"] === "name", "Auto-mapped 'ชื่อสินค้า' -> 'name'");
  assert(parseResult.initialMapping["โรงงาน"] === "plant", "Auto-mapped 'โรงงาน' -> 'plant'");
  assert(parseResult.initialMapping["หน่วยนับ"] === "stockUnit", "Auto-mapped 'หน่วยนับ' -> 'stockUnit'");

  // ─────────────────────────────────────────────────────────────
  // 4. Test Multi-Location Aggregation & Duplicate Policy
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 4. Testing Multi-Location Aggregation ---");
  const existingDbSkus = new Set(["EXISTING-SKU-99"]);

  const valResult = validateAndAggregateRows(
    parseResult.rawRows,
    parseResult.initialMapping,
    existingDbSkus,
    "skip"
  );

  assert(valResult.totalRows === 3, "Total rows is 3");
  assert(valResult.items.length === 2, "Items aggregated into 2 unique SKUs");

  const sku1 = valResult.items.find((i) => i.sku === "TEST-SKU-1");
  assert(Boolean(sku1), "Found TEST-SKU-1");
  assert(sku1!.currentQuantity === 80, "Aggregated quantity 50 + 30 = 80");
  assert(sku1!.locations.length === 2, "Aggregated 2 locations (A3/1 and B3/2)");
  assert(sku1!.locations[0].lockCode === "A3" && sku1!.locations[0].quantity === 50, "Location 1 is A3/1 with 50 units");
  assert(sku1!.locations[1].lockCode === "B3" && sku1!.locations[1].quantity === 30, "Location 2 is B3/2 with 30 units");
  assert(valResult.warningCount === 1, "Generated 1 warning for multi-location aggregation");

  // ─────────────────────────────────────────────────────────────
  // 5. Test CSV Parsing
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 5. Testing CSV Parsing ---");
  const csvContent =
    "SKU,Name,Plant,StockUnit,Quantity\n" +
    "CSV-001,ท่อคอนกรีตระบายน้ำ 40 ซม.,1,ท่อน,65\n" +
    "CSV-002,เสาเข็มไอ 22,2,ต้น,40\n";
  const csvBuffer = Buffer.from(csvContent, "utf-8");

  const csvParseResult = await parseImportBuffer(csvBuffer, "data.csv");
  assert(csvParseResult.rawRows.length === 2, "Parsed 2 rows from CSV");
  assert(csvParseResult.initialMapping["SKU"] === "sku", "Auto-mapped CSV 'SKU'");
  assert(csvParseResult.initialMapping["Plant"] === "plant", "Auto-mapped CSV 'Plant'");

  // ─────────────────────────────────────────────────────────────
  // 6. Test Error Report Generation
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 6. Testing Error Report Generator ---");
  const testErrors = [
    {
      rowNumber: 4,
      sku: "ERR-001",
      column: "โรงงาน",
      message: "โรงงาน '9' ไม่ถูกต้อง",
      severity: "error" as const,
      suggestedFix: "ระบุเลขโรงงาน 1-4",
    },
  ];
  const errReport = await exportErrorReportAction(testErrors, "sample.xlsx");
  assert(errReport.success === true, "Generated error report successfully");
  assert(Boolean(errReport.base64), "Error report has valid base64 payload");

  // ─────────────────────────────────────────────────────────────
  // 7. Test KCON Company Profile Single Source of Truth
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 7. Testing KCON Company Profile ---");
  const company = await getCompanySettings();
  assert(company.brandName === "KCON", "Brand name is KCON");
  assert(company.companyNameTh.includes("ขอนแก่นผลิตภัณฑ์คอนกรีต"), "Company name TH verified");
  assert(company.website === "www.kcon-concrete.com", "Website verified");
  assert(company.email === "kcon.eng@gmail.com", "Email verified");
  assert(company.phone === "043-255-111", "Phone verified");

  console.log("\n==================================================");
  console.log(`ALL TESTS PASSED: ${passed}/${total}`);
  console.log("==================================================");
  process.exit(0);
}

runTests().catch((e) => {
  console.error("Test failure:", e);
  process.exit(1);
});
