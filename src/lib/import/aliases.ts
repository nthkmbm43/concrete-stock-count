export type CanonicalFieldKey =
  | "sku"
  | "name"
  | "plant"
  | "category"
  | "stockUnit"
  | "quantity"
  | "variant"
  | "zone"
  | "lockCode"
  | "rowCode"
  | "height"
  | "width"
  | "length"
  | "status";

export interface CanonicalFieldDef {
  key: CanonicalFieldKey;
  label: string;
  required: boolean;
  type: "string" | "number" | "boolean";
  description: string;
  aliases: string[];
}

export const CANONICAL_FIELDS: CanonicalFieldDef[] = [
  {
    key: "sku",
    label: "รหัสสินค้า (SKU)",
    required: true,
    type: "string",
    description: "รหัสเฉพาะของสินค้า เช่น FP-250-18, I-26, HC-05",
    aliases: [
      "รหัสสินค้า",
      "รหัส",
      "sku",
      "item code",
      "itemcode",
      "product code",
      "productcode",
      "part number",
      "code",
      "item no",
      "item_no",
      "p_code",
    ],
  },
  {
    key: "name",
    label: "ชื่อสินค้า",
    required: true,
    type: "string",
    description: "ชื่อสินค้าคอนกรีต เช่น เสารั้วลวดหนาม 2.5 นิ้ว ยาว 1.80 ม.",
    aliases: [
      "ชื่อสินค้า",
      "ชื่อ",
      "product name",
      "item name",
      "description",
      "description thai",
      "item_description",
      "รายละเอียด",
      "รายการสินค้า",
      "ชื่อรายการ",
    ],
  },
  {
    key: "plant",
    label: "โรงงาน (Plant 1-4)",
    required: true,
    type: "number",
    description: "เลขโรงงาน 1 ถึง 4 (รองรับ 1, โรง 1, โรงงาน 1, Plant 1)",
    aliases: [
      "โรงงาน",
      "โรง",
      "plant",
      "plant id",
      "plant_id",
      "factory",
      "site",
      "สาขา",
      "โรงผลิต",
    ],
  },
  {
    key: "category",
    label: "หมวดหมู่สินค้า",
    required: false,
    type: "string",
    description: "หมวดหมู่ เช่น fences, piles, hollow_core, curbstones, raw_materials",
    aliases: [
      "หมวดหมู่",
      "หมวด",
      "หมวดสินค้า",
      "category",
      "category id",
      "category_id",
      "product category",
      "ประเภท",
      "กลุ่มสินค้า",
    ],
  },
  {
    key: "stockUnit",
    label: "หน่วยนับ",
    required: true,
    type: "string",
    description: "หน่วยนับ เช่น ต้น, แผ่น, ชิ้น, ท่อน, ตัน, กก., ม้วน, เส้น",
    aliases: [
      "หน่วยนับ",
      "หน่วย",
      "unit",
      "uom",
      "stock unit",
      "stock_unit",
      "stock_unit_id",
      "หน่วยสต๊อก",
    ],
  },
  {
    key: "quantity",
    label: "จำนวนในสต๊อก",
    required: false,
    type: "number",
    description: "จำนวนคงเหลือเริ่มต้นหรือยกมา (ตัวเลข >= 0)",
    aliases: [
      "จำนวน",
      "จำนวนในสต๊อก",
      "จำนวนคงเหลือ",
      "ยอดสต๊อก",
      "ยอดคงเหลือ",
      "ยกมา",
      "สต๊อกยกมา",
      "quantity",
      "qty",
      "stock",
      "balance",
      "current quantity",
      "current_quantity",
      "on hand",
    ],
  },
  {
    key: "variant",
    label: "รุ่น / แบบ / ขนาด",
    required: false,
    type: "string",
    description: "สเปคหรือรุ่นย่อย เช่น เสารั้วคอนกรีตอัดแรง, L-Wall, มาตรฐาน",
    aliases: [
      "รุ่น",
      "แบบ",
      "รุ่น/แบบ",
      "variant",
      "model",
      "spec",
      "specification",
      "สเปค",
      "ชนิด",
    ],
  },
  {
    key: "zone",
    label: "โซน / ลานวาง",
    required: false,
    type: "string",
    description: "โซนเก็บสินค้า เช่น Yard-1, Yard แผ่นพื้น, ไซโลปูน",
    aliases: ["โซน", "zone", "ลาน", "พื้นที่", "คลัง", "อาคาร"],
  },
  {
    key: "lockCode",
    label: "ล็อค (จุดวาง)",
    required: false,
    type: "string",
    description: "รหัสล็อค เช่น A3, B3, B5, Sil-A, Yard-1",
    aliases: [
      "ล็อค",
      "ล็อก",
      "lock",
      "lock code",
      "lock_code",
      "จุดวาง",
      "bay",
      "ช่องเก็บ",
      "รหัสจุดวาง",
    ],
  },
  {
    key: "rowCode",
    label: "แถว / ชั้น",
    required: false,
    type: "string",
    description: "แถวหรือชั้นวาง เช่น 1, 2, 6, A, กอง 1",
    aliases: ["แถว", "row", "row code", "row_code", "ชั้น", "layer"],
  },
  {
    key: "height",
    label: "ความสูง / ความหนา",
    required: false,
    type: "string",
    description: "ความสูงหรือหนาของชิ้นงาน เช่น 15 ซม., 0.15 ม.",
    aliases: ["ความสูง", "ความหนา", "สูง", "หนา", "height", "thickness"],
  },
  {
    key: "width",
    label: "ความกว้าง",
    required: false,
    type: "string",
    description: "ความกว้าง เช่น 30 ซม., 1.20 ม.",
    aliases: ["ความกว้าง", "กว้าง", "width"],
  },
  {
    key: "length",
    label: "ความยาว",
    required: false,
    type: "string",
    description: "ความยาว เช่น 1.80 ม., 100 ซม.",
    aliases: ["ความยาว", "ยาว", "length"],
  },
  {
    key: "status",
    label: "สถานะใช้งาน",
    required: false,
    type: "boolean",
    description: "เปิดใช้งาน (active) หรือ ปิดใช้งาน (inactive)",
    aliases: ["สถานะ", "status", "is active", "is_active", "active", "เปิดใช้งาน"],
  },
];

/**
 * Normalizes header string for comparison: lowercase, trim, remove symbols
 */
export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[\(\)\[\]\{\}\*\:\_\-\.\/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Auto-detect canonical field key from an uploaded Excel/CSV column header
 */
export function autoDetectField(columnHeader: string): {
  key: CanonicalFieldKey | null;
  confidence: number;
} {
  const norm = normalizeHeader(columnHeader);
  if (!norm) return { key: null, confidence: 0 };

  // 1. Direct match on key or exact Thai label
  for (const field of CANONICAL_FIELDS) {
    if (norm === field.key.toLowerCase() || norm === normalizeHeader(field.label)) {
      return { key: field.key, confidence: 1.0 };
    }
  }

  // 2. Exact match in aliases
  for (const field of CANONICAL_FIELDS) {
    for (const alias of field.aliases) {
      if (norm === normalizeHeader(alias)) {
        return { key: field.key, confidence: 0.95 };
      }
    }
  }

  // 3. Partial / Contains match in aliases
  for (const field of CANONICAL_FIELDS) {
    for (const alias of field.aliases) {
      const normAlias = normalizeHeader(alias);
      if (norm.includes(normAlias) || normAlias.includes(norm)) {
        return { key: field.key, confidence: 0.8 };
      }
    }
  }

  return { key: null, confidence: 0 };
}
