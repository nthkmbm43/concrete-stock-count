/**
 * Data Normalization and Validation Utilities for Concrete Stock Count Import
 */

/**
 * Normalizes Plant value to an integer 1, 2, 3, or 4
 */
export function normalizePlantId(value: any): number | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str) return null;

  // Direct number 1..4
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 1 && num <= 4 && /^\d+$/.test(str)) {
    return num;
  }

  // Regex extraction for "โรง 1", "โรงงาน 2", "Plant 3", "โรงงาน 4 (..."
  const match = str.match(/(?:โรงงาน|โรง|plant)\s*(\d)/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (parsed >= 1 && parsed <= 4) return parsed;
  }

  // Try extracting any single digit between 1 and 4 if short string
  if (str.length <= 10) {
    const anyDigit = str.match(/\b([1-4])\b/);
    if (anyDigit && anyDigit[1]) {
      return parseInt(anyDigit[1], 10);
    }
  }

  return null;
}

/**
 * Unit Alias Mapping
 */
const UNIT_MAP: Record<string, string> = {
  ต้น: "ต้น",
  ton: "ต้น",
  แผ่น: "แผ่น",
  แผ่นพื้น: "แผ่น",
  pan: "แผ่น",
  ชิ้น: "ชิ้น",
  pcs: "ชิ้น",
  piece: "ชิ้น",
  ท่อน: "ท่อน",
  thn: "ท่อน",
  อัน: "อัน",
  ก้อน: "ก้อน",
  บล็อก: "ก้อน",
  blk: "ก้อน",
  ถุง: "ถุง",
  bag: "ถุง",
  กิโลกรัม: "กก.",
  กก: "กก.",
  "กก.": "กก.",
  kg: "กก.",
  kgs: "กก.",
  kilogram: "กก.",
  ตัน: "ตัน",
  tonne: "ตัน",
  เมตร: "เมตร",
  "ม.": "เมตร",
  ม: "เมตร",
  m: "เมตร",
  คิว: "คิว",
  "ลบ.ม.": "คิว",
  m3: "คิว",
  ม้วน: "ม้วน",
  rol: "ม้วน",
  roll: "ม้วน",
  เส้น: "เส้น",
  bar: "เส้น",
  ลิตร: "ลิตร",
  ltr: "ลิตร",
  liter: "ลิตร",
  ชุด: "ชุด",
  set: "ชุด",
  พาเลท: "พาเลท",
  plt: "พาเลท",
  pallet: "พาเลท",
};

/**
 * Normalizes Unit to a recognized system Unit ID
 */
export function normalizeUnit(value: any): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim().toLowerCase();
  if (!str) return null;

  if (UNIT_MAP[str]) {
    return UNIT_MAP[str];
  }

  // Exact match without lowercasing if not found
  const raw = String(value).trim();
  if (UNIT_MAP[raw]) {
    return UNIT_MAP[raw];
  }

  return raw; // Return raw trimmed string for validation check against DB units
}

/**
 * Normalizes Storage Location Lock Code (e.g. "a3" -> "A3", "sil-b" -> "Sil-B")
 */
export function normalizeLockCode(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  if (!str) return "";

  // If simple alphanumeric like "a3", "b2", uppercase
  if (/^[a-zA-Z0-9\-]+$/.test(str)) {
    // Check if it's Sil-A / Sil-B style
    if (/^sil[-_]?[ab]$/i.test(str)) {
      return `Sil-${str.slice(-1).toUpperCase()}`;
    }
    // Check if it's yard-1 style
    if (/^yard[-_]?\d+$/i.test(str)) {
      return `Yard-${str.match(/\d+$/)?.[0] || "1"}`;
    }
    return str.toUpperCase();
  }

  return str;
}

/**
 * Normalizes Row Code (e.g. " 6 " -> "6")
 */
export function normalizeRowCode(value: any): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Escapes strings for CSV/Excel export to prevent CSV / Formula injection
 * Prepends a single quote if string starts with =, +, -, @, or tab
 */
export function escapeFormulaInjection(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/^[=\+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Parses numeric quantity safely
 */
export function parseQuantity(value: any, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number") return isNaN(value) ? fallback : Math.max(0, value);
  const clean = String(value).replace(/,/g, "").trim();
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? fallback : Math.max(0, parsed);
}
