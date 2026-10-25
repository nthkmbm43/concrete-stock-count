import { ItemCategory } from "./types";
import {
  Warehouse,
  Factory,
  PackageOpen,
  PackageCheck,
  Boxes,
  Shapes,
  type LucideIcon,
} from "lucide-react";

export interface MasterPlantOption {
  id: number;
  name: string;
  subname: string;
  code: string;
  description: string;
  icon: LucideIcon;
  colorName: "amber" | "blue" | "violet" | "teal";
  badgeClass: string;
  bgLightClass: string;
  textColorClass: string;
  borderColorClass: string;
}

export interface MasterCategoryOption {
  key: ItemCategory;
  label: string;
  description: string;
  icon: LucideIcon;
  badgeClass: string;
  bgLightClass: string;
  textColorClass: string;
  borderColorClass: string;
}

// 1. Master Plants
export const MASTER_PLANTS: MasterPlantOption[] = [
  {
    id: 1,
    name: "โรง 1",
    subname: "วัตถุดิบ",
    code: "PLANT-1",
    description: "คลังเก็บปูน, หิน, ทราย, เหล็ก, น้ำยาผสม",
    icon: Warehouse,
    colorName: "amber",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    bgLightClass: "bg-amber-50/70",
    textColorClass: "text-amber-700",
    borderColorClass: "border-amber-300",
  },
  {
    id: 2,
    name: "โรง 2",
    subname: "ผลิต / คลังสินค้า",
    code: "PLANT-2",
    description: "โรงผลิตและเก็บเสารั้ว, เสาไอ, เสาเข็มคอนกรีต",
    icon: Factory,
    colorName: "blue",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    bgLightClass: "bg-blue-50/70",
    textColorClass: "text-blue-700",
    borderColorClass: "border-blue-300",
  },
  {
    id: 3,
    name: "โรง 3",
    subname: "ผลิต / คลังสินค้า",
    code: "PLANT-3",
    description: "โรงผลิตและเก็บแผ่นพื้นสำเร็จรูป Hollowcore / ท้องเรียบ",
    icon: Factory,
    colorName: "violet",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    bgLightClass: "bg-purple-50/70",
    textColorClass: "text-purple-700",
    borderColorClass: "border-purple-300",
  },
  {
    id: 4,
    name: "โรง 4",
    subname: "ผลิต / คลังสินค้า",
    code: "PLANT-4",
    description: "โรงผลิตและเก็บผนังคอนกรีต L-Wall, ท่อระบายน้ำ",
    icon: Factory,
    colorName: "teal",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
    bgLightClass: "bg-teal-50/70",
    textColorClass: "text-teal-700",
    borderColorClass: "border-teal-300",
  },
];

// 2. Master Categories
export const MASTER_CATEGORIES: MasterCategoryOption[] = [
  {
    key: "finished_goods",
    label: "สินค้าสำเร็จรูป",
    description: "เสารั้ว, เสาไอ, แผ่นพื้น, L-Wall, ท่อ",
    icon: PackageCheck,
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    bgLightClass: "bg-blue-50/80",
    textColorClass: "text-blue-700",
    borderColorClass: "border-blue-400",
  },
  {
    key: "raw_material",
    label: "วัตถุดิบ",
    description: "ปูนซีเมนต์, หิน, ทราย, เหล็กเส้น, ลวดอัดแรง",
    icon: PackageOpen,
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    bgLightClass: "bg-amber-50/80",
    textColorClass: "text-amber-700",
    borderColorClass: "border-amber-400",
  },
  {
    key: "consumables",
    label: "วัสดุสิ้นเปลือง",
    description: "ใบตัด, ลวดเชื่อม, น้ำมันทาแบบ, ถุงมือ, น็อต",
    icon: Boxes,
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    bgLightClass: "bg-purple-50/80",
    textColorClass: "text-purple-700",
    borderColorClass: "border-purple-400",
  },
  {
    key: "others",
    label: "อื่น ๆ",
    description: "เครื่องจักรย่อย, บรรจุภัณฑ์, เศษวัสดุ",
    icon: Shapes,
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
    bgLightClass: "bg-slate-50/80",
    textColorClass: "text-slate-700",
    borderColorClass: "border-slate-400",
  },
];

// 3. Master Seed Units
export const SEED_UNITS = [
  "ต้น",
  "แผ่น",
  "ชิ้น",
  "อัน",
  "ก้อน",
  "ถุง",
  "กิโลกรัม",
  "กก.",
  "ตัน",
  "เมตร",
  "เมตร³",
  "คิว",
  "ม้วน",
  "เส้น",
  "ลิตร",
  "ชุด",
  "พาเลท",
  "กล่อง",
];

// 4. Master Seed Zones per Plant
export const SEED_ZONES_BY_PLANT: Record<number, string[]> = {
  1: ["คลังวัตถุดิบ 1", "ไซโลปูน", "ลานหิน-ทราย", "Zone R", "Zone W1"],
  2: ["Yard-1", "Yard-2", "Zone A", "Zone B", "หน้าเตาหล่อ", "ลานเสารั้ว"],
  3: ["Yard แผ่นพื้น", "Zone C", "Zone D", "เตาหล่อ 1-4", "ลานกองพัก"],
  4: ["Yard L-Wall", "Zone E", "Zone F", "ลานท่อคอนกรีต", "ลานพักตรวจรับ"],
};

// 5. Master Seed Locks
export const SEED_LOCKS = [
  "A1", "A2", "A3", "B1", "B2", "B3", "B5", "C1", "C2", "D1", "Sil-A", "Sil-B", "Yard-A", "Yard-B"
];

// 6. Master Seed Rows
export const SEED_ROWS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12", "15"];

// 7. Master Seed Variants
export const SEED_VARIANTS = [
  "ลวด 4 เส้น",
  "ลวด 6 เส้น",
  "ลวด 8 เส้น",
  "ลวด 10 เส้น",
  "Standard",
  "Heavy Duty",
  "ชนิดพิเศษ",
  "หน้าตัดเรียบ",
  "หน้าตัดหยัก",
  "-",
];

// 8. Dimension Units
export const DIMENSION_UNITS = ["เมตร", "มม.", "ซม.", "นิ้ว"] as const;
export type DimensionUnit = (typeof DIMENSION_UNITS)[number];

// Helper: Normalize unit and text inputs
export function normalizeMasterValue(val: string): string {
  if (!val) return "";
  // Trim, remove trailing punctuation like dots or commas
  return val
    .trim()
    .replace(/[.,/\\;]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Local Storage Keys
const STORAGE_KEYS = {
  UNITS: "concrete_app_master_units",
  ZONES: "concrete_app_master_zones",
  LOCKS: "concrete_app_master_locks",
  ROWS: "concrete_app_master_rows",
  VARIANTS: "concrete_app_master_variants",
};

// Safe LocalStorage Access
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota issues
  }
}

export class MasterDataService {
  // Units
  static getUnits(): string[] {
    const custom = getFromStorage<string[]>(STORAGE_KEYS.UNITS, []);
    const merged = Array.from(new Set([...SEED_UNITS, ...custom]));
    return merged;
  }

  static addUnit(newUnit: string): { success: boolean; value: string; isDuplicate: boolean } {
    const normalized = normalizeMasterValue(newUnit);
    if (!normalized) return { success: false, value: "", isDuplicate: false };

    const currentUnits = this.getUnits();
    const existing = currentUnits.find(
      (u) => u.toLowerCase() === normalized.toLowerCase()
    );

    if (existing) {
      return { success: true, value: existing, isDuplicate: true };
    }

    const custom = getFromStorage<string[]>(STORAGE_KEYS.UNITS, []);
    custom.push(normalized);
    saveToStorage(STORAGE_KEYS.UNITS, custom);

    return { success: true, value: normalized, isDuplicate: false };
  }

  // Zones by Plant
  static getZones(plantId: number): string[] {
    const customByPlant = getFromStorage<Record<number, string[]>>(STORAGE_KEYS.ZONES, {});
    const base = SEED_ZONES_BY_PLANT[plantId] || ["Zone A", "Zone B"];
    const custom = customByPlant[plantId] || [];
    return Array.from(new Set([...base, ...custom]));
  }

  static addZone(plantId: number, newZone: string): { success: boolean; value: string } {
    const normalized = normalizeMasterValue(newZone);
    if (!normalized) return { success: false, value: "" };

    const currentZones = this.getZones(plantId);
    const existing = currentZones.find((z) => z.toLowerCase() === normalized.toLowerCase());
    if (existing) return { success: true, value: existing };

    const customByPlant = getFromStorage<Record<number, string[]>>(STORAGE_KEYS.ZONES, {});
    const list = customByPlant[plantId] || [];
    list.push(normalized);
    customByPlant[plantId] = list;
    saveToStorage(STORAGE_KEYS.ZONES, customByPlant);

    return { success: true, value: normalized };
  }

  // Locks
  static getLocks(): string[] {
    const custom = getFromStorage<string[]>(STORAGE_KEYS.LOCKS, []);
    return Array.from(new Set([...SEED_LOCKS, ...custom]));
  }

  static addLock(lock: string): string {
    const normalized = normalizeMasterValue(lock).toUpperCase();
    if (!normalized) return "";
    const locks = this.getLocks();
    if (!locks.includes(normalized)) {
      const custom = getFromStorage<string[]>(STORAGE_KEYS.LOCKS, []);
      custom.push(normalized);
      saveToStorage(STORAGE_KEYS.LOCKS, custom);
    }
    return normalized;
  }

  // Rows
  static getRows(): string[] {
    const custom = getFromStorage<string[]>(STORAGE_KEYS.ROWS, []);
    return Array.from(new Set([...SEED_ROWS, ...custom]));
  }

  static addRow(row: string): string {
    const normalized = normalizeMasterValue(row);
    if (!normalized) return "";
    const rows = this.getRows();
    if (!rows.includes(normalized)) {
      const custom = getFromStorage<string[]>(STORAGE_KEYS.ROWS, []);
      custom.push(normalized);
      saveToStorage(STORAGE_KEYS.ROWS, custom);
    }
    return normalized;
  }

  // Variants
  static getVariants(): string[] {
    const custom = getFromStorage<string[]>(STORAGE_KEYS.VARIANTS, []);
    return Array.from(new Set([...SEED_VARIANTS, ...custom]));
  }

  static addVariant(variant: string): { success: boolean; value: string } {
    const normalized = normalizeMasterValue(variant);
    if (!normalized) return { success: false, value: "" };
    const current = this.getVariants();
    const existing = current.find((v) => v.toLowerCase() === normalized.toLowerCase());
    if (existing) return { success: true, value: existing };

    const custom = getFromStorage<string[]>(STORAGE_KEYS.VARIANTS, []);
    custom.push(normalized);
    saveToStorage(STORAGE_KEYS.VARIANTS, custom);
    return { success: true, value: normalized };
  }

  // Dimension Formatter
  static formatDimensionSize(params: {
    height?: string;
    heightUnit?: string;
    width?: string;
    widthUnit?: string;
    length?: string;
    lengthUnit?: string;
    rawSize?: string;
  }): string {
    const parts: string[] = [];
    if (params.height?.trim()) {
      parts.push(`สูง ${params.height.trim()} ${params.heightUnit || "เมตร"}`);
    }
    if (params.width?.trim()) {
      parts.push(`หน้า ${params.width.trim()} ${params.widthUnit || "นิ้ว"}`);
    }
    if (params.length?.trim()) {
      parts.push(`ยาว ${params.length.trim()} ${params.lengthUnit || "เมตร"}`);
    }

    if (parts.length > 0) {
      return parts.join(" • ");
    }
    return params.rawSize?.trim() || "";
  }

  // Parse dimension value and unit
  static parseDimensionValue(input?: string, defaultUnit: DimensionUnit = "เมตร"): { value: string; unit: DimensionUnit } {
    if (!input) return { value: "", unit: defaultUnit };
    const trimmed = input.trim();
    let detectedUnit: DimensionUnit = defaultUnit;
    if (trimmed.includes("นิ้ว")) detectedUnit = "นิ้ว";
    else if (trimmed.includes("มม.")) detectedUnit = "มม.";
    else if (trimmed.includes("ซม.")) detectedUnit = "ซม.";
    else if (trimmed.includes("ม.") || trimmed.includes("เมตร")) detectedUnit = "เมตร";

    const numMatch = trimmed.match(/(\d+(\.\d+)?)/);
    return {
      value: numMatch ? numMatch[1] : "",
      unit: detectedUnit,
    };
  }
}
