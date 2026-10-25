export type UserRole = "STAFF" | "ADMIN";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  plant_id?: number;
  avatar_url?: string;
  phone?: string;
}

export interface Plant {
  id: number;
  name: string;
  code: string;
  description: string;
  total_skus: number;
}

export type ItemCategory = "raw_material" | "finished_goods";
export type ItemStatus = "ACTIVE" | "INACTIVE";

// Storage Position (Plant, Lock, Row)
export interface StorageLocation {
  id: string;
  plant_id: number;
  lock_code: string; // e.g. "A3", "B3", "B5"
  row_code: string;  // e.g. "6", "2", "1"
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ItemStorageLocation {
  id: string;
  inventory_item_id: string;
  storage_location_id?: string;
  lock_code: string;
  row_code: string;
  expected_quantity: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: ItemCategory;
  variant: string;
  size: string;
  height?: string; // e.g. "2.50 ม."
  width?: string;  // e.g. "18 นิ้ว"
  length?: string; // e.g. "2.50 ม."
  unit: string;
  plant_id: number;
  zone?: string;
  image_url?: string;
  current_quantity: number;
  last_counted_at?: string;
  last_counted_by?: string;
  last_counted_by_name?: string;
  status: ItemStatus;
  is_active?: boolean;
  locations?: ItemStorageLocation[];
  created_at: string;
  updated_at: string;
}

export type CountRoundType = "MONTHLY" | "WEEKLY" | "RECOUNT";
export type CountRoundStatus = "OPEN" | "CLOSED";

export interface CountRound {
  id: string;
  name: string;
  title: string;
  type: CountRoundType;
  count_type?: CountRoundType;
  start_date: string;
  end_date: string;
  status: CountRoundStatus;
  plant_ids: number[];
  notes?: string;
  created_at: string;
}

export type CountStatus = "DRAFT" | "SUBMITTED";

export interface StockCountLocation {
  id?: string;
  stock_count_id?: string;
  storage_location_id?: string;
  lock_code: string;
  row_code: string;
  previous_quantity: number;
  counted_quantity: number;
  difference: number;
  created_at?: string;
}

export interface StockCount {
  id: string;
  count_round_id: string;
  plant_id: number;
  inventory_item_id: string;
  user_id: string;
  user_name: string;
  previous_quantity: number;
  counted_quantity: number;
  difference: number;
  status: CountStatus;
  notes?: string;
  locations?: StockCountLocation[];
  counted_at: string;
  submitted_at?: string;
  created_at: string;
}

export interface StockAdjustment {
  id: string;
  inventory_item_id: string;
  plant_id: number;
  adjusted_by: string;
  adjusted_by_name: string;
  previous_quantity: number;
  new_quantity: number;
  difference: number;
  reason: string;
  created_at: string;
}

export interface PlantCountProgress {
  plant_id: number;
  plant_name: string;
  total_skus: number;
  counted_skus: number;
  percentage: number;
}

export interface RoundProgress {
  count_round_id: string;
  total_skus: number;
  counted_skus: number;
  uncounted_skus: number;
  recounted_skus: number;
  difference_skus: number;
  percentage: number;
  plants: PlantCountProgress[];
}

export type CountFilter = "ALL" | "UNCOUNTED" | "COUNTED" | "RECOUNTED";
