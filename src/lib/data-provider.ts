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
import { supabase, isSupabaseConfigured } from "./supabase";

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
  // Current logged in user
  static getCurrentUser(): UserProfile {
    return getStored<UserProfile>(STORAGE_KEYS.CURRENT_USER, MOCK_USERS[0]);
  }

  static setCurrentUser(user: UserProfile): void {
    setStored(STORAGE_KEYS.CURRENT_USER, user);
    notifyRealtime("USER_SWITCHED", user);
  }

  static getUsers(): UserProfile[] {
    return MOCK_USERS;
  }

  // Plants
  static async getPlants(): Promise<Plant[]> {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from("plants").select("*").order("id");
        if (!error && data && data.length > 0) return data;
      }
    } catch (e) {
      console.warn("Supabase getPlants error, using local fallback:", e);
    }
    return getStored<Plant[]>(STORAGE_KEYS.PLANTS, MOCK_PLANTS);
  }

  // Count Rounds
  static async getCountRounds(): Promise<CountRound[]> {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("count_rounds")
          .select(`
            *,
            count_round_plants (plant_id)
          `)
          .order("start_date", { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((r) => ({
            ...r,
            name: r.name || r.title,
            title: r.title || r.name,
            plant_ids: r.count_round_plants?.map((p: { plant_id: number }) => p.plant_id) || [1, 2, 3, 4],
          }));
        }
      }
    } catch (e) {
      console.warn("Supabase getCountRounds error, using local fallback:", e);
    }
    return getStored<CountRound[]>(STORAGE_KEYS.ROUNDS, MOCK_ROUNDS);
  }

  static async getActiveRound(): Promise<CountRound> {
    const rounds = await this.getCountRounds();
    const openRound = rounds.find((r) => r.status === "OPEN");
    return openRound || rounds[0] || MOCK_ROUNDS[0];
  }

  // Items
  static async getItems(): Promise<InventoryItem[]> {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("inventory_items")
          .select(`
            *,
            inventory_item_locations (*)
          `)
          .order("sku");
        if (!error && data && data.length > 0) {
          return data.map((i) => ({
            ...i,
            locations: i.inventory_item_locations || [],
          }));
        }
      }
    } catch (e) {
      console.warn("Supabase getItems error, using local fallback:", e);
    }
    return getStored<InventoryItem[]>(STORAGE_KEYS.ITEMS, MOCK_ITEMS);
  }

  static async getItemById(id: string): Promise<InventoryItem | null> {
    const items = await this.getItems();
    return items.find((i) => i.id === id || i.sku === id) || null;
  }

  // Stock Counts
  static async getStockCounts(roundId?: string): Promise<StockCount[]> {
    try {
      if (isSupabaseConfigured && supabase) {
        let query = supabase
          .from("stock_counts")
          .select(`
            *,
            stock_count_locations (*)
          `)
          .order("counted_at", { ascending: false });
        if (roundId) {
          query = query.eq("count_round_id", roundId);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data.map((c) => ({
            ...c,
            locations: c.stock_count_locations || [],
          }));
        }
      }
    } catch (e) {
      console.warn("Supabase getStockCounts error, using local fallback:", e);
    }
    const all = getStored<StockCount[]>(STORAGE_KEYS.COUNTS, MOCK_STOCK_COUNTS);
    if (roundId) {
      return all.filter((c) => c.count_round_id === roundId);
    }
    return all;
  }

  // Get item history with full location breakdown!
  static async getItemHistory(itemId: string) {
    const counts = (await this.getStockCounts()).filter((c) => c.inventory_item_id === itemId);
    const adjustments = (await this.getAdjustments()).filter((a) => a.inventory_item_id === itemId);

    const historyItems = [
      ...counts.map((c) => ({
        type: "COUNT" as const,
        id: c.id,
        quantity: c.counted_quantity,
        previous_quantity: c.previous_quantity,
        difference: c.difference,
        by_name: c.user_name,
        timestamp: c.submitted_at || c.counted_at,
        notes: c.notes,
        status: c.status,
        locations: c.locations || [],
      })),
      ...adjustments.map((a) => ({
        type: "ADJUSTMENT" as const,
        id: a.id,
        quantity: a.new_quantity,
        previous_quantity: a.previous_quantity,
        difference: a.difference,
        by_name: `${a.adjusted_by_name} (แอดมิน)`,
        timestamp: a.created_at,
        notes: a.reason,
        status: "ADJUSTED" as const,
        locations: [] as StockCountLocation[],
      })),
    ];

    return historyItems.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Stock Adjustments
  static async getAdjustments(): Promise<StockAdjustment[]> {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("stock_adjustments")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) return data;
      }
    } catch (e) {
      console.warn("Supabase getAdjustments error, using local fallback:", e);
    }
    return getStored<StockAdjustment[]>(STORAGE_KEYS.ADJUSTMENTS, MOCK_ADJUSTMENTS);
  }

  // Calculate Progress
  static async getRoundProgress(roundId: string): Promise<RoundProgress> {
    const rounds = await this.getCountRounds();
    const round = rounds.find((r) => r.id === roundId) || rounds[0] || MOCK_ROUNDS[0];
    const plants = await this.getPlants();
    const items = await this.getItems();
    const counts = await this.getStockCounts(round.id);

    const activePlantIds = new Set(round.plant_ids || [1, 2, 3, 4]);
    const roundItems = items.filter((item) => activePlantIds.has(item.plant_id));

    const submittedCounts = counts.filter((c) => c.status === "SUBMITTED");
    const countOccurrences = new Map<string, number>();
    const countDifferences = new Map<string, number>();

    for (const c of submittedCounts) {
      const curr = countOccurrences.get(c.inventory_item_id) || 0;
      countOccurrences.set(c.inventory_item_id, curr + 1);
      if (c.difference !== 0) {
        countDifferences.set(c.inventory_item_id, c.difference);
      }
    }

    const countedItemIds = new Set(countOccurrences.keys());
    const total_skus = roundItems.length;
    const counted_skus = roundItems.filter((i) => countedItemIds.has(i.id)).length;
    const uncounted_skus = Math.max(0, total_skus - counted_skus);

    let recounted_skus = 0;
    countOccurrences.forEach((num) => {
      if (num >= 2) recounted_skus++;
    });

    const difference_skus = countDifferences.size;
    const percentage = total_skus > 0 ? Math.round((counted_skus / total_skus) * 100) : 0;

    const plantProgressList: PlantCountProgress[] = plants
      .filter((p) => activePlantIds.has(p.id))
      .map((p) => {
        const pItems = roundItems.filter((item) => item.plant_id === p.id);
        const pCounted = pItems.filter((item) => countedItemIds.has(item.id)).length;
        const pPct = pItems.length > 0 ? Math.round((pCounted / pItems.length) * 100) : 0;
        return {
          plant_id: p.id,
          plant_name: p.name,
          total_skus: pItems.length,
          counted_skus: pCounted,
          percentage: pPct,
        };
      });

    return {
      count_round_id: round.id,
      total_skus,
      counted_skus,
      uncounted_skus,
      recounted_skus,
      difference_skus,
      percentage,
      plants: plantProgressList,
    };
  }

  // Get active Draft for an item and round
  static getItemDraft(itemId: string, roundId: string): StockCount | null {
    const drafts = getStored<Record<string, StockCount>>(STORAGE_KEYS.DRAFTS, {});
    const key = `${roundId}_${itemId}`;
    return drafts[key] || null;
  }

  // Submit Count with multiple storage locations!
  static async submitCount(params: {
    round_id: string;
    item_id: string;
    plant_id: number;
    counted_quantity: number;
    notes?: string;
    locations?: StockCountLocation[];
  }): Promise<StockCount> {
    const user = this.getCurrentUser();
    const items = await this.getItems();
    const item = items.find((i) => i.id === params.item_id);
    const prevQty = item ? item.current_quantity : 0;
    const diff = params.counted_quantity - prevQty;
    const nowIso = new Date().toISOString();

    const newRecord: StockCount = {
      id: "cnt-" + Math.random().toString(36).substring(2, 9),
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

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: countData } = await supabase
          .from("stock_counts")
          .insert({
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
            counted_at: nowIso,
            submitted_at: nowIso,
          })
          .select()
          .single();

        if (countData && params.locations && params.locations.length > 0) {
          const locationRows = params.locations.map((loc) => ({
            stock_count_id: countData.id,
            storage_location_id: loc.storage_location_id,
            lock_code: loc.lock_code,
            row_code: loc.row_code,
            previous_quantity: loc.previous_quantity,
            counted_quantity: loc.counted_quantity,
            difference: loc.difference,
          }));
          await supabase.from("stock_count_locations").insert(locationRows);
        }
      } catch (err) {
        console.warn("Supabase submit count error:", err);
      }
    }

    // Always update local storage
    const counts = getStored<StockCount[]>(STORAGE_KEYS.COUNTS, MOCK_STOCK_COUNTS);
    setStored(STORAGE_KEYS.COUNTS, [newRecord, ...counts]);

    // Clear draft if any
    const drafts = getStored<Record<string, StockCount>>(STORAGE_KEYS.DRAFTS, {});
    delete drafts[`${params.round_id}_${params.item_id}`];
    setStored(STORAGE_KEYS.DRAFTS, drafts);

    // Update item current_quantity and location expected quantities
    const updatedItems = items.map((i) => {
      if (i.id === params.item_id) {
        // Also update locations if new ones were added
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
              });
            }
          });
        }

        return {
          ...i,
          current_quantity: params.counted_quantity,
          locations: updatedLocs,
          last_counted_at: nowIso,
          last_counted_by: user.id,
          last_counted_by_name: user.full_name,
          updated_at: nowIso,
        };
      }
      return i;
    });
    setStored(STORAGE_KEYS.ITEMS, updatedItems);

    notifyRealtime("COUNT_SUBMITTED", {
      item_id: params.item_id,
      counted_quantity: params.counted_quantity,
      user_name: user.full_name,
      time: nowIso,
      locations: params.locations,
    });

    return newRecord;
  }

  // Save Draft with storage locations
  static async saveDraftCount(params: {
    round_id: string;
    item_id: string;
    plant_id: number;
    counted_quantity: number;
    notes?: string;
    locations?: StockCountLocation[];
  }): Promise<StockCount> {
    const user = this.getCurrentUser();
    const items = await this.getItems();
    const item = items.find((i) => i.id === params.item_id);
    const prevQty = item ? item.current_quantity : 0;
    const diff = params.counted_quantity - prevQty;
    const nowIso = new Date().toISOString();

    const draftRecord: StockCount = {
      id: "draft-" + Math.random().toString(36).substring(2, 9),
      count_round_id: params.round_id,
      plant_id: params.plant_id,
      inventory_item_id: params.item_id,
      user_id: user.id,
      user_name: user.full_name,
      previous_quantity: prevQty,
      counted_quantity: params.counted_quantity,
      difference: diff,
      status: "DRAFT",
      notes: params.notes,
      locations: params.locations || [],
      counted_at: nowIso,
      created_at: nowIso,
    };

    const drafts = getStored<Record<string, StockCount>>(STORAGE_KEYS.DRAFTS, {});
    drafts[`${params.round_id}_${params.item_id}`] = draftRecord;
    setStored(STORAGE_KEYS.DRAFTS, drafts);

    return draftRecord;
  }

  // Add custom storage position found by worker
  static async addLocationToItem(
    itemId: string,
    plantId: number,
    lockCode: string,
    rowCode: string,
    quantity: number = 0
  ): Promise<ItemStorageLocation> {
    const items = await this.getItems();
    const item = items.find((i) => i.id === itemId);
    const newLoc: ItemStorageLocation = {
      id: "loc-" + Math.random().toString(36).substring(2, 8),
      inventory_item_id: itemId,
      lock_code: lockCode.toUpperCase(),
      row_code: rowCode,
      expected_quantity: quantity,
    };

    if (item) {
      const existing = item.locations || [];
      const updated = [...existing, newLoc];
      const updatedItems = items.map((i) => (i.id === itemId ? { ...i, locations: updated } : i));
      setStored(STORAGE_KEYS.ITEMS, updatedItems);
    }

    return newLoc;
  }

  // Admin Stock Adjustment
  static async adjustStock(params: {
    item_id: string;
    plant_id: number;
    new_quantity: number;
    reason: string;
  }): Promise<StockAdjustment> {
    const user = this.getCurrentUser();
    const items = await this.getItems();
    const item = items.find((i) => i.id === params.item_id);
    const prevQty = item ? item.current_quantity : 0;
    const diff = params.new_quantity - prevQty;
    const nowIso = new Date().toISOString();

    const adjRecord: StockAdjustment = {
      id: "adj-" + Math.random().toString(36).substring(2, 9),
      inventory_item_id: params.item_id,
      plant_id: params.plant_id,
      adjusted_by: user.id,
      adjusted_by_name: user.full_name,
      previous_quantity: prevQty,
      new_quantity: params.new_quantity,
      difference: diff,
      reason: params.reason,
      created_at: nowIso,
    };

    const adjs = getStored<StockAdjustment[]>(STORAGE_KEYS.ADJUSTMENTS, MOCK_ADJUSTMENTS);
    setStored(STORAGE_KEYS.ADJUSTMENTS, [adjRecord, ...adjs]);

    const updatedItems = items.map((i) => {
      if (i.id === params.item_id) {
        return {
          ...i,
          current_quantity: params.new_quantity,
          last_counted_at: nowIso,
          last_counted_by: user.id,
          last_counted_by_name: user.full_name + " (แอดมิน)",
          updated_at: nowIso,
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
  static async saveItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    const items = await this.getItems();
    const nowIso = new Date().toISOString();
    let saved: InventoryItem;

    if (item.id) {
      saved = {
        ...items.find((i) => i.id === item.id)!,
        ...item,
        updated_at: nowIso,
      } as InventoryItem;
      const updated = items.map((i) => (i.id === item.id ? saved : i));
      setStored(STORAGE_KEYS.ITEMS, updated);
    } else {
      saved = {
        id: "item-" + Math.random().toString(36).substring(2, 9),
        sku: item.sku || "SKU-" + Date.now().toString().slice(-4),
        name: item.name || "สินค้าใหม่",
        category: item.category || "finished_goods",
        variant: item.variant || "-",
        size: item.size || "-",
        unit: item.unit || "ชิ้น",
        plant_id: item.plant_id || 1,
        zone: item.zone || "Zone A",
        current_quantity: item.current_quantity || 0,
        status: item.status || "ACTIVE",
        is_active: true,
        locations: [],
        created_at: nowIso,
        updated_at: nowIso,
      };
      setStored(STORAGE_KEYS.ITEMS, [saved, ...items]);
    }

    notifyRealtime("ITEM_SAVED", saved);
    return saved;
  }

  // Subscribe to realtime updates
  static onStockUpdate(callback: (event: { type: string; payload: unknown }) => void) {
    if (typeof window === "undefined") return () => {};

    const handleMessage = (e: MessageEvent) => {
      callback(e.data);
    };
    if (realtimeChannel) {
      realtimeChannel.addEventListener("message", handleMessage);
    }

    let supabaseSub: any = null;
    if (isSupabaseConfigured && supabase) {
      try {
        supabaseSub = supabase
          .channel("public:stock_updates")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "stock_counts" },
            (payload: any) => {
              callback({ type: "COUNT_SUBMITTED", payload: payload.new });
            }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "inventory_items" },
            (payload: any) => {
              callback({ type: "ITEM_SAVED", payload: payload.new });
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscription error:", err);
      }
    }

    return () => {
      if (realtimeChannel) {
        realtimeChannel.removeEventListener("message", handleMessage);
      }
      if (supabaseSub && supabase) {
        supabase.removeChannel(supabaseSub);
      }
    };
  }
}
