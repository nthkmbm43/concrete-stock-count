import ExcelJS from "exceljs";
import {
  CanonicalFieldKey,
  CANONICAL_FIELDS,
  autoDetectField,
} from "./aliases";
import {
  normalizePlantId,
  normalizeUnit,
  normalizeLockCode,
  normalizeRowCode,
  parseQuantity,
} from "./normalizer";

export interface ColumnMappingItem {
  excelColumn: string;
  columnIndex: number;
  mappedField: CanonicalFieldKey | "ignore";
  confidence: number;
}

export interface RawRowData {
  rowNumber: number;
  values: Record<string, any>; // keyed by excel column header
}

export interface ParsedSheetResult {
  sheetNames: string[];
  selectedSheet: string;
  headers: string[];
  rawRows: RawRowData[];
  initialMapping: Record<string, CanonicalFieldKey | "ignore">;
  previewRows: Record<string, any>[];
}

export interface RowErrorItem {
  rowNumber: number;
  sku?: string;
  column?: string;
  message: string;
  severity: "error" | "warning";
  suggestedFix?: string;
}

export interface AggregatedLocation {
  lockCode: string;
  rowCode: string;
  zone: string;
  quantity: number;
}

export interface ValidatedImportItem {
  sku: string;
  name: string;
  plantId: number;
  categoryId: string;
  stockUnitId: string;
  currentQuantity: number;
  variant: string;
  heightValue?: string;
  widthValue?: string;
  lengthValue?: string;
  locations: AggregatedLocation[];
  action: "create" | "update" | "skip";
  sourceRows: number[];
}

export interface ImportValidationResult {
  totalRows: number;
  readyCount: number;
  skippedCount: number;
  warningCount: number;
  errorCount: number;
  items: ValidatedImportItem[];
  errors: RowErrorItem[];
  duplicatePolicy: "skip" | "update" | "create_only";
}

/**
 * Parses an Excel or CSV file buffer and returns sheet metadata, headers, rows, and auto-mapping
 */
export async function parseImportBuffer(
  buffer: ArrayBuffer | Buffer,
  fileName: string,
  targetSheetName?: string
): Promise<ParsedSheetResult> {
  const workbook = new ExcelJS.Workbook();
  const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const isCsv = fileName.toLowerCase().endsWith(".csv");

  if (isCsv) {
    // Read CSV into a stream or string buffer
    const { Readable } = await import("stream");
    const stream = Readable.from(nodeBuffer);
    await workbook.csv.read(stream);
  } else {
    await workbook.xlsx.load(nodeBuffer as any);
  }

  const sheetNames = workbook.worksheets.map((ws) => ws.name);
  if (sheetNames.length === 0) {
    throw new Error("ไม่พบแผ่นงาน (Sheet) ในไฟล์ที่อัปโหลด");
  }

  const sheet = targetSheetName
    ? workbook.getWorksheet(targetSheetName) || workbook.worksheets[0]
    : workbook.worksheets[0];

  const headers: string[] = [];
  const rawRows: RawRowData[] = [];
  let headerRowIndex = 1;

  // Find header row (first non-empty row)
  sheet.eachRow((row, rowNumber) => {
    if (headers.length === 0) {
      const values = row.values as any[];
      // ExcelJS row.values is 1-indexed, values[0] is undefined
      const rowHeaders: string[] = [];
      let hasText = false;
      for (let i = 1; i < values.length; i++) {
        const val = values[i];
        const str = val !== null && val !== undefined ? String(val).trim() : "";
        if (str) hasText = true;
        rowHeaders.push(str || `คอลัมน์ ${i}`);
      }
      if (hasText) {
        headers.push(...rowHeaders);
        headerRowIndex = rowNumber;
      }
    } else if (rowNumber > headerRowIndex) {
      const values = row.values as any[];
      const rowObj: Record<string, any> = {};
      let hasData = false;

      for (let i = 0; i < headers.length; i++) {
        const cellValue = values[i + 1];
        if (cellValue !== null && cellValue !== undefined && cellValue !== "") {
          hasData = true;
          // Format Date or formula results
          if (typeof cellValue === "object" && cellValue !== null) {
            if ("result" in cellValue) {
              rowObj[headers[i]] = cellValue.result;
            } else if ("text" in cellValue) {
              rowObj[headers[i]] = cellValue.text;
            } else {
              rowObj[headers[i]] = String(cellValue);
            }
          } else {
            rowObj[headers[i]] = cellValue;
          }
        } else {
          rowObj[headers[i]] = "";
        }
      }

      if (hasData) {
        rawRows.push({
          rowNumber,
          values: rowObj,
        });
      }
    }
  });

  if (headers.length === 0) {
    throw new Error("ไม่พบคอลัมน์หัวตาราง (Header) ในไฟล์");
  }

  // Auto-detect mappings for each header
  const initialMapping: Record<string, CanonicalFieldKey | "ignore"> = {};
  const usedFields = new Set<CanonicalFieldKey>();

  for (const header of headers) {
    const { key, confidence } = autoDetectField(header);
    if (key && !usedFields.has(key) && confidence >= 0.7) {
      initialMapping[header] = key;
      usedFields.add(key);
    } else {
      initialMapping[header] = "ignore";
    }
  }

  const previewRows = rawRows.slice(0, 50).map((r) => r.values);

  return {
    sheetNames,
    selectedSheet: sheet.name,
    headers,
    rawRows,
    initialMapping,
    previewRows,
  };
}

/**
 * Validates raw rows against user column mapping and aggregates multi-location SKUs
 */
export function validateAndAggregateRows(
  rawRows: RawRowData[],
  mapping: Record<string, CanonicalFieldKey | "ignore">,
  existingSkusSet: Set<string>,
  duplicatePolicy: "skip" | "update" | "create_only" = "skip"
): ImportValidationResult {
  const errors: RowErrorItem[] = [];
  const itemsMap = new Map<string, ValidatedImportItem>();
  let warningCount = 0;
  let skippedCount = 0;

  // Build reverse map: canonical key -> excel column header
  const fieldToCol = new Map<CanonicalFieldKey, string>();
  for (const [col, field] of Object.entries(mapping)) {
    if (field !== "ignore") {
      fieldToCol.set(field, col);
    }
  }

  // Check required fields are mapped
  const requiredFields = CANONICAL_FIELDS.filter((f) => f.required);
  for (const req of requiredFields) {
    if (!fieldToCol.has(req.key)) {
      errors.push({
        rowNumber: 1,
        message: `ยังไม่ได้จับคู่คอลัมน์จำเป็น: ${req.label}`,
        severity: "error",
        suggestedFix: `โปรดเลือกคอลัมน์ใน Excel ให้ตรงกับ ${req.label}`,
      });
    }
  }

  if (errors.some((e) => e.severity === "error")) {
    return {
      totalRows: rawRows.length,
      readyCount: 0,
      skippedCount: 0,
      warningCount: 0,
      errorCount: errors.length,
      items: [],
      errors,
      duplicatePolicy,
    };
  }

  // Process rows
  for (const row of rawRows) {
    const getVal = (key: CanonicalFieldKey) => {
      const col = fieldToCol.get(key);
      return col ? row.values[col] : undefined;
    };

    const rawSku = getVal("sku");
    const rawName = getVal("name");
    const rawPlant = getVal("plant");
    const rawUnit = getVal("stockUnit");
    const rawQty = getVal("quantity");
    const rawCategory = getVal("category");
    const rawVariant = getVal("variant");
    const rawLock = getVal("lockCode");
    const rawRow = getVal("rowCode");
    const rawZone = getVal("zone");
    const rawHeight = getVal("height");
    const rawWidth = getVal("width");
    const rawLength = getVal("length");

    // 1. Validate SKU
    const sku = rawSku !== null && rawSku !== undefined ? String(rawSku).trim().toUpperCase() : "";
    if (!sku) {
      errors.push({
        rowNumber: row.rowNumber,
        column: fieldToCol.get("sku"),
        message: "รหัสสินค้า (SKU) ห้ามว่าง",
        severity: "error",
        suggestedFix: "ระบุรหัสสินค้าเช่น FP-250-18 หรือ CB-STD",
      });
      continue;
    }

    // 2. Validate Name
    const name = rawName !== null && rawName !== undefined ? String(rawName).trim() : "";
    if (!name) {
      errors.push({
        rowNumber: row.rowNumber,
        sku,
        column: fieldToCol.get("name"),
        message: "ชื่อสินค้าห้ามว่าง",
        severity: "error",
        suggestedFix: "ระบุชื่อสินค้าคอนกรีต",
      });
      continue;
    }

    // 3. Validate Plant
    const plantId = normalizePlantId(rawPlant);
    if (!plantId) {
      errors.push({
        rowNumber: row.rowNumber,
        sku,
        column: fieldToCol.get("plant"),
        message: `โรงงาน '${rawPlant}' ไม่ถูกต้อง (ต้องเป็น 1 ถึง 4)`,
        severity: "error",
        suggestedFix: "ระบุเลขโรงงานเป็น 1, 2, 3 หรือ 4",
      });
      continue;
    }

    // 4. Validate Unit
    const stockUnitId = normalizeUnit(rawUnit);
    if (!stockUnitId) {
      errors.push({
        rowNumber: row.rowNumber,
        sku,
        column: fieldToCol.get("stockUnit"),
        message: `หน่วยนับ '${rawUnit || ""}' ไม่ถูกต้องหรือว่าง`,
        severity: "error",
        suggestedFix: "ระบุหน่วย เช่น ต้น, แผ่น, ชิ้น, ท่อน, ตัน, กก., ม้วน",
      });
      continue;
    }

    // 5. Quantity & Location
    const quantity = parseQuantity(rawQty, 0);
    const lockCode = normalizeLockCode(rawLock);
    const rowCode = normalizeRowCode(rawRow);
    const zone = rawZone ? String(rawZone).trim() : "Yard-1";

    // Build location object if lockCode exists
    const hasLocation = Boolean(lockCode);
    const locObj: AggregatedLocation | null = hasLocation
      ? {
          lockCode,
          rowCode: rowCode || "1",
          zone: zone || "Yard-1",
          quantity,
        }
      : null;

    // Check Multi-location aggregation for repeated SKU
    if (itemsMap.has(sku)) {
      const existing = itemsMap.get(sku)!;
      existing.sourceRows.push(row.rowNumber);

      // Merge location
      if (locObj) {
        // Check if identical lock & row already exists
        const locIdx = existing.locations.findIndex(
          (l) => l.lockCode === locObj.lockCode && l.rowCode === locObj.rowCode
        );
        if (locIdx >= 0) {
          existing.locations[locIdx].quantity += locObj.quantity;
        } else {
          existing.locations.push(locObj);
        }
      }

      // Sum quantities
      existing.currentQuantity += quantity;

      warningCount++;
      errors.push({
        rowNumber: row.rowNumber,
        sku,
        message: `พบ SKU '${sku}' ซ้ำในไฟล์ - รวมยอดและจุดวางกับแถวที่ ${existing.sourceRows[0]} เรียบร้อยแล้ว`,
        severity: "warning",
      });
    } else {
      // First time seeing this SKU in file
      const existsInDb = existingSkusSet.has(sku);
      let action: "create" | "update" | "skip" = "create";

      if (existsInDb) {
        if (duplicatePolicy === "skip") {
          action = "skip";
          skippedCount++;
        } else if (duplicatePolicy === "update") {
          action = "update";
        } else if (duplicatePolicy === "create_only") {
          errors.push({
            rowNumber: row.rowNumber,
            sku,
            message: `SKU '${sku}' มีอยู่ในระบบแล้ว แต่นโยบายกำหนดไม่อนุญาตนำเข้าซ้ำ`,
            severity: "error",
            suggestedFix: "เปลี่ยนนโยบายเป็น 'อัปเดตข้อมูล' หรือ 'ข้ามรายการซ้ำ'",
          });
          continue;
        }
      }

      const item: ValidatedImportItem = {
        sku,
        name,
        plantId,
        categoryId: rawCategory ? String(rawCategory).trim().toLowerCase() : "fences",
        stockUnitId,
        currentQuantity: quantity,
        variant: rawVariant ? String(rawVariant).trim() : "",
        heightValue: rawHeight ? String(rawHeight).trim() : undefined,
        widthValue: rawWidth ? String(rawWidth).trim() : undefined,
        lengthValue: rawLength ? String(rawLength).trim() : undefined,
        locations: locObj ? [locObj] : [],
        action,
        sourceRows: [row.rowNumber],
      };

      itemsMap.set(sku, item);
    }
  }

  const items = Array.from(itemsMap.values());
  const errorCount = errors.filter((e) => e.severity === "error").length;
  const readyCount = items.filter((i) => i.action !== "skip").length;

  return {
    totalRows: rawRows.length,
    readyCount,
    skippedCount,
    warningCount,
    errorCount,
    items,
    errors,
    duplicatePolicy,
  };
}
