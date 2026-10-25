import {
  UserProfile,
  Plant,
  InventoryItem,
  CountRound,
  StockCount,
  StockCountLocation,
  StockAdjustment,
  RoundProgress,
  PlantCountProgress,
  ItemStorageLocation,
} from "./types";
import {
  MOCK_USERS,
  MOCK_PLANTS,
  MOCK_ROUNDS,
  MOCK_ITEMS,
  MOCK_STOCK_COUNTS,
  MOCK_ADJUSTMENTS,
} from "./mock-data";
import {
  submitStockCountAction,
  adjustStockAction,
  saveProductAction,
} from "@/actions/stock-actions";

const STORAGE_KEYS = {
  CURRENT_USER: "cc_current_user_v2",
  PLANTS: "cc_plants_v2",
  ROUNDS: "cc_rounds_v2",
  ITEMS: "cc_items_v2",
  COUNTS: "cc_counts_v2",
  ADJUSTMENTS: "cc_adjustments_v2",
  DRAFTS: "cc_drafts_v2",
};

let realtimeChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  realtimeChannel = new BroadcastChannel("concrete_stock_realtime_channel");
}

function getStored<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const val = localStorage.getItem(key);
    if (!val) return defaultVal;
    return JSON.parse(val);
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn("LocalStorage save error:", err);
  }
}

function notifyRealtime(type: string, payload: unknown) {
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type, payload, timestamp: Date.now() });
  }
}

export class DataProvider {
  // Current User Management
  static async getCurrentUser(): Promise<UserProfile> {
    const stored = getStored<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (stored) return stored;
    return MOCK_USERS[1]; // Default to Somchai (Staff)
  }

  static getCurrentUserSync(): UserProfile {
    const stored = getStored<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    return stored || MOCK_USERS[1];
  }

  static async setCurrentUser(user: UserProfile): Promise<void> {
    setStored(STORAGE_KEYS.CURRENT_USER, user);
    notifyRealtime("USER_CHANGED", user);
  }

  static async getUsers(): Promise<UserProfile[]> {
    return MOCK_USERS;
  }

  static getUsersSync(): UserProfile[] {
    return MOCK_USERS;
  }

  // Plants
  static async getPlants(): Promise<Plant[]> {
    return getStored<Plant[]>(STORAGE_KEYS.PLANTS, MOCK_PLANTS);
  }

  // Count Rounds
  static async getCountRounds(): Promise<CountRound[]> {
    return getStored<CountRound[]>(STORAGE_KEYS.ROUNDS, MOCK_ROUNDS);
  }

  static async getActiveRound(): Promise<CountRound> {
    const rounds = await this.getCountRounds();
    const openRound = rounds.find((r) => r.status === "OPEN");
    return openRound || rounds[0] || MOCK_ROUNDS[0];
  }

  // Items
  static async getItems(): Promise<InventoryItem[]> {
    return getStored<InventoryItem[]>(STORAGE_KEYS.ITEMS, MOCK_ITEMS);
  }

  static async getItemById(id: string): Promise<InventoryItem | null> {
    const items = await this.getItems();
    return items.find((i) => i.id === id || i.sku === id) || null;
  }

  // Stock Counts
  static async getStockCounts(roundId?: string): Promise<StockCount[]> {
    const all = getStored<StockCount[]>(STORAGE_KEYS.COUNTS, MOCK_STOCK_COUNTS);
    if (roundId) {
      return all.filter((c) => c.count_round_id === roundId);
    }
    return all;
  }

  static async getItemHistory(itemId: string, roundId?: string): Promise<StockCount[]> {
    const counts = await this.getStockCounts(roundId);
    return counts.filter((c) => c.inventory_item_id === itemId);
  }

  static async getDraftCount(roundId: string, itemId: string): Promise<StockCount | null> {
    const drafts = getStored<Record<string, StockCount>>(STORAGE_KEYS.DRAFTS, {});
    return drafts[`${roundId}_${itemId}`] || null;
  }

  static getItemDraftSync(itemId: string, roundId: string): StockCount | null {
    const drafts = getStored<Record<string, StockCount>>(STORAGE_KEYS.DRAFTS, {});
    return drafts[`${roundId}_${itemId}`] || null;
  }

  static async getItemDraft(roundId: string, itemId: string): Promise<StockCount | null> {
    return this.getDraftCount(roundId, itemId);
  }

  static async saveDraftCount(count: Partial<StockCount>): Promise<StockCount> {
    return this.saveDraft(count);
  }

  static async saveDraft(count: Partial<StockCount>): Promise<StockCount> {
    const drafts = getStored<Record<string, StockCount>>(STORAGE_KEYS.DRAFTS, {});
    const key = `${count.count_round_id}_${count.inventory_item_id}`;
    const user = await this.getCurrentUser();
    const existing = drafts[key];
    const nowIso = new Date().toISOString();

    const draftRecord: StockCount = {
      id: existing?.id || "draft-" + Math.random().toString(36).substring(2, 9),
      count_round_id: count.count_round_id!,
      plant_id: count.plant_id!,
      inventory_item_id: count.inventory_item_id!,
      user_id: user.id,
      user_name: user.full_name,
      previous_quantity: count.previous_quantity || 0,
      counted_quantity: count.counted_quantity || 0,
      difference: (count.counted_quantity || 0) - (count.previous_quantity || 0),
      status: "DRAFT",
      notes: count.notes,
      locations: count.locations || [],
      counted_at: existing?.counted_at || nowIso,
      created_at: existing?.created_at || nowIso,
      updated_at: nowIso,
    };

    drafts[key] = draftRecord;
    setStored(STORAGE_KEYS.DRAFTS, drafts);
    notifyRealtime("DRAFT_SAVED", draftRecord);
    return draftRecord;
  }

  // Stock Adjustments
  static async getAdjustments(): Promise<StockAdjustment[]> {
    return getStored<StockAdjustment[]>(STORAGE_KEYS.ADJUSTMENTS, MOCK_ADJUSTMENTS);
  }

  // Calculate Progress
  static async getRoundProgress(roundId: string): Promise<RoundProgress> {
    const rounds = await this.getCountRounds();
    const round = rounds.find((r) => r.id === roundId) || rounds[0];
    const items = await this.getItems();
    const counts = await this.getStockCounts(roundId);

    const relevantItems = items.filter((item) =>
      round?.plant_ids ? round.plant_ids.includes(item.plant_id) : true
    );

    const submittedCounts = counts.filter((c) => c.status === "SUBMITTED");
    const countedItemIds = new Set(submittedCounts.map((c) => c.inventory_item_id));

    const totalSkus = relevantItems.length;
    const countedSkus = countedItemIds.size;
    const uncountedSkus = Math.max(0, totalSkus - countedSkus);
    const percentage = totalSkus > 0 ? Math.round((countedSkus / totalSkus) * 100) : 0;

    let matchedCount = 0;
    let overCount = 0;
    let underCount = 0;

    countedItemIds.forEach((itemId) => {
      const itemCounts = submittedCounts.filter((c) => c.inventory_item_id === itemId);
      const latestCount = itemCounts[0];
      if (latestCount) {
        if (latestCount.difference === 0) matchedCount++;
        else if (latestCount.difference > 0) overCount++;
        else underCount++;
      }
    });

    const plantProgress: PlantCountProgress[] = (round?.plant_ids || [1, 2, 3, 4]).map(
      (plantId) => {
        const plantItems = relevantItems.filter((i) => i.plant_id === plantId);
        const plantCountedIds = new Set(
          submittedCounts
            .filter((c) => c.plant_id === plantId)
            .map((c) => c.inventory_item_id)
        );
        const pTotal = plantItems.length;
        const pCounted = plantCountedIds.size;
        return {
          plant_id: plantId,
          plant_name: `โรง ${plantId}`,
          total_skus: pTotal,
          counted_skus: pCounted,
          percentage: pTotal > 0 ? Math.round((pCounted / pTotal) * 100) : 0,
        };
      }
    );

    return {
      count_round_id: roundId,
      round_id: roundId,
      total_skus: totalSkus,
      counted_skus: countedSkus,
      uncounted_skus: uncountedSkus,
      percentage,
      matched_count: matchedCount,
      over_count: overCount,
      under_count: underCount,
      plants: plantProgress,
    };
  }

  // Submit Count with Server Transaction
  static async submitCount(params: {
    round_id: string;
    plant_id: number;
    item_id: string;
    counted_quantity: number;
    locations?: StockCountLocation[];
    notes?: string;
  }): Promise<StockCount> {
    const user = await this.getCurrentUser();
    const items = await this.getItems();
    const item = items.find((i) => i.id === params.item_id);
    const prevQty = item?.current_quantity || 0;
    const diff = params.counted_quantity - prevQty;
    const nowIso = new Date().toISOString();

    const newRecord: StockCount = {
      id: "count-" + Math.random().toString(36).substring(2, 9),
      count_round_id: params.round_id,
      plant_id: params.plant_id,
      inventory_item_id: params.item_id,
      user_id: user.id,
      user_name: user.full_name,
      previous_quantity: prevQty,
      counted_quantity: params.counted_quantity,
      difference: diff,
      status: "SUBMITTED",
      notes: params.notes,
      locations: params.locations || [],
      counted_at: nowIso,
      submitted_at: nowIso,
      created_at: nowIso,
    };

    // Trigger atomic server action database transaction
    try {
      await submitStockCountAction({
        roundId: params.round_id,
        productId: params.item_id,
        userId: user.id,
        userName: user.full_name,
        countedLocations: (params.locations || []).map((l) => ({
          storageLocationId: l.storage_location_id,
          sourceType: l.source_type === "NEW" ? "OBSERVED_NEW" : "MASTER",
          lockCode: l.lock_code,
          rowCode: l.row_code,
          previousQuantity: l.previous_quantity,
          countedQuantity: l.counted_quantity,
          difference: l.difference,
          observationStatus: l.observation_status || "FOUND",
        })),
        notes: params.notes,
      });
    } catch (err) {
      console.warn("Server action submit count error, keeping local sync:", err);
    }

    // Always update local cache
    const counts = getStored<StockCount[]>(STORAGE_KEYS.COUNTS, MOCK_STOCK_COUNTS);
    setStored(STORAGE_KEYS.COUNTS, [newRecord, ...counts]);

    // Clear draft if any
    const drafts = getStored<Record<string, StockCount>>(STORAGE_KEYS.DRAFTS, {});
    delete drafts[`${params.round_id}_${params.item_id}`];
    setStored(STORAGE_KEYS.DRAFTS, drafts);

    // Update item current_quantity and location expected quantities
    const updatedItems = items.map((i) => {
      if (i.id === params.item_id) {
        const existingLocs = i.locations || [];
        const updatedLocs: ItemStorageLocation[] = [...existingLocs];

        if (params.locations) {
          params.locations.forEach((pLoc) => {
            const foundIdx = updatedLocs.findIndex(
              (l) => l.lock_code === pLoc.lock_code && l.row_code === pLoc.row_code
            );
            if (foundIdx !== -1) {
              updatedLocs[foundIdx] = {
                ...updatedLocs[foundIdx],
                expected_quantity: pLoc.counted_quantity,
              };
            } else {
              updatedLocs.push({
                id: "loc-" + Math.random().toString(36).substring(2, 7),
                inventory_item_id: i.id,
                lock_code: pLoc.lock_code,
                row_code: pLoc.row_code,
                expected_quantity: pLoc.counted_quantity,
                source_type: pLoc.source_type || "NEW",
              });
            }
          });
        }

        return {
          ...i,
          current_quantity: params.counted_quantity,
          last_counted_at: nowIso,
          last_counted_by: user.id,
          last_counted_by_name: user.full_name,
          locations: updatedLocs,
        };
      }
      return i;
    });

    setStored(STORAGE_KEYS.ITEMS, updatedItems);

    notifyRealtime("COUNT_SUBMITTED", {
      count: newRecord,
      item_id: params.item_id,
      new_quantity: params.counted_quantity,
    });

    return newRecord;
  }

  // Admin Stock Adjustment with Server Action
  static async adjustStock(params: {
    item_id: string;
    new_quantity: number;
    reason: string;
  }): Promise<StockAdjustment> {
    const user = await this.getCurrentUser();
    const items = await this.getItems();
    const item = items.find((i) => i.id === params.item_id);
    const oldQty = item?.current_quantity || 0;
    const diff = params.new_quantity - oldQty;
    const nowIso = new Date().toISOString();

    const adjRecord: StockAdjustment = {
      id: "adj-" + Math.random().toString(36).substring(2, 9),
      inventory_item_id: params.item_id,
      admin_id: user.id,
      admin_name: user.full_name,
      old_quantity: oldQty,
      previous_quantity: oldQty,
      new_quantity: params.new_quantity,
      difference: diff,
      reason: params.reason,
      created_at: nowIso,
    };

    // Trigger server action with role verification
    try {
      await adjustStockAction({
        productId: params.item_id,
        adminUserId: user.id,
        adminRole: user.role,
        newQuantity: params.new_quantity,
        reason: params.reason,
      });
    } catch (err) {
      console.warn("Server action adjust stock error:", err);
    }

    const adjustments = getStored<StockAdjustment[]>(
      STORAGE_KEYS.ADJUSTMENTS,
      MOCK_ADJUSTMENTS
    );
    setStored(STORAGE_KEYS.ADJUSTMENTS, [adjRecord, ...adjustments]);

    const updatedItems = items.map((i) => {
      if (i.id === params.item_id) {
        return {
          ...i,
          current_quantity: params.new_quantity,
          last_counted_at: nowIso,
          last_counted_by: user.id,
          last_counted_by_name: user.full_name + " (ปรับยอดสต๊อก)",
        };
      }
      return i;
    });
    setStored(STORAGE_KEYS.ITEMS, updatedItems);

    notifyRealtime("STOCK_ADJUSTED", {
      item_id: params.item_id,
      new_quantity: params.new_quantity,
      reason: params.reason,
      adjusted_by: user.full_name,
    });

    return adjRecord;
  }

  // Admin Item Management
  static async saveItem(
    item: Partial<InventoryItem> & { default_lock?: string; default_row?: string }
  ): Promise<InventoryItem> {
    const user = await this.getCurrentUser();
    const items = await this.getItems();
    const nowIso = new Date().toISOString();
    let saved: InventoryItem;

    if (item.id) {
      const existing = items.find((i) => i.id === item.id);
      let updatedLocations = item.locations ?? existing?.locations ?? [];

      if (updatedLocations.length === 0 && item.default_lock) {
        updatedLocations = [
          {
            id: "loc-" + Math.random().toString(36).substring(2, 9),
            inventory_item_id: item.id,
            lock_code: item.default_lock,
            row_code: item.default_row || "1",
            expected_quantity: item.current_quantity ?? existing?.current_quantity ?? 0,
            source_type: "SYSTEM",
          },
        ];
      }

      saved = {
        ...existing,
        ...item,
        height: item.height ?? existing?.height,
        width: item.width ?? existing?.width,
        length: item.length ?? existing?.length,
        locations: updatedLocations,
        is_active: (item.status ?? existing?.status) === "ACTIVE",
        updated_at: nowIso,
      } as InventoryItem;
      const updated = items.map((i) => (i.id === item.id ? saved : i));
      setStored(STORAGE_KEYS.ITEMS, updated);
    } else {
      const newItemId = "item-" + Math.random().toString(36).substring(2, 9);
      let initialLocations = item.locations || [];
      if (initialLocations.length === 0 && item.default_lock) {
        initialLocations = [
          {
            id: "loc-" + Math.random().toString(36).substring(2, 9),
            inventory_item_id: newItemId,
            lock_code: item.default_lock,
            row_code: item.default_row || "1",
            expected_quantity: item.current_quantity || 0,
            source_type: "SYSTEM",
          },
        ];
      }

      saved = {
        id: newItemId,
        sku: item.sku || "SKU-" + Date.now().toString().slice(-4),
        name: item.name || "สินค้าใหม่",
        category: item.category || "finished_goods",
        variant: item.variant || "-",
        size: item.size || "-",
        height: item.height,
        width: item.width,
        length: item.length,
        unit: item.unit || "ชิ้น",
        plant_id: item.plant_id || 1,
        zone: item.zone || "Zone A",
        current_quantity: item.current_quantity || 0,
        status: item.status || "ACTIVE",
        is_active: (item.status || "ACTIVE") === "ACTIVE",
        locations: initialLocations,
        created_at: nowIso,
        updated_at: nowIso,
      };
      setStored(STORAGE_KEYS.ITEMS, [saved, ...items]);
    }

    // Call server action for PostgreSQL persistence
    try {
      await saveProductAction({
        adminRole: user.role,
        id: item.id,
        sku: saved.sku,
        name: saved.name,
        categoryId: saved.category,
        plantId: saved.plant_id,
        variant: saved.variant,
        heightValue: saved.height,
        widthValue: saved.width,
        lengthValue: saved.length,
        stockUnitId: saved.unit,
        currentQuantity: saved.current_quantity,
        status: saved.status,
        defaultLock: item.default_lock,
        defaultRow: item.default_row,
      });
    } catch (err) {
      console.warn("Server action save product error:", err);
    }

    notifyRealtime("ITEM_SAVED", saved);
    return saved;
  }

  // Subscribe to realtime updates via BroadcastChannel
  static onStockUpdate(callback: (event: { type: string; payload: unknown }) => void) {
    if (typeof window === "undefined") return () => {};

    const handleMessage = (e: MessageEvent) => {
      callback(e.data);
    };
    if (realtimeChannel) {
      realtimeChannel.addEventListener("message", handleMessage);
    }

    return () => {
      if (realtimeChannel) {
        realtimeChannel.removeEventListener("message", handleMessage);
      }
    };
  }
}
