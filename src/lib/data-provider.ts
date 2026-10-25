import {
  UserProfile,
  Plant,
  InventoryItem,
  CountRound,
  StockCount,
  StockAdjustment,
  RoundProgress,
  PlantCountProgress,
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
  CURRENT_USER: "cc_current_user",
  PLANTS: "cc_plants",
  ROUNDS: "cc_rounds",
  ITEMS: "cc_items",
  COUNTS: "cc_counts",
  ADJUSTMENTS: "cc_adjustments",
};

// BroadcastChannel for multi-tab realtime simulation when running local mock
let realtimeChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  realtimeChannel = new BroadcastChannel("concrete_stock_realtime_channel");
}

function getStored<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
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

// Broadcast event to other tabs
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
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("plants").select("*").order("id");
      if (!error && data && data.length > 0) return data;
    }
    return getStored<Plant[]>(STORAGE_KEYS.PLANTS, MOCK_PLANTS);
  }

  // Count Rounds
  static async getCountRounds(): Promise<CountRound[]> {
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
          plant_ids: r.count_round_plants?.map((p: { plant_id: number }) => p.plant_id) || [1, 2, 3, 4],
        }));
      }
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
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("inventory_items").select("*").order("sku");
      if (!error && data && data.length > 0) return data;
    }
    return getStored<InventoryItem[]>(STORAGE_KEYS.ITEMS, MOCK_ITEMS);
  }

  static async getItemById(id: string): Promise<InventoryItem | null> {
    const items = await this.getItems();
    return items.find((i) => i.id === id || i.sku === id) || null;
  }

  // Stock Counts
  static async getStockCounts(roundId?: string): Promise<StockCount[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from("stock_counts").select("*").order("counted_at", { ascending: false });
      if (roundId) {
        query = query.eq("count_round_id", roundId);
      }
      const { data, error } = await query;
      if (!error && data) return data;
    }
    const all = getStored<StockCount[]>(STORAGE_KEYS.COUNTS, MOCK_STOCK_COUNTS);
    if (roundId) {
      return all.filter((c) => c.count_round_id === roundId);
    }
    return all;
  }

  // Get item history across all submissions & adjustments
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
        timestamp: c.counted_at,
        notes: c.notes,
        status: c.status,
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
      })),
    ];

    return historyItems.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Stock Adjustments
  static async getAdjustments(): Promise<StockAdjustment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("stock_adjustments")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) return data;
    }
    return getStored<StockAdjustment[]>(STORAGE_KEYS.ADJUSTMENTS, MOCK_ADJUSTMENTS);
  }

  // Calculate Progress accurately per prompt rule:
  // "ถ้า SKU เดียวถูกนับ 3 ครั้ง ให้นับ Progress เป็น: 1 SKU ไม่ใช่ 3 รายการ"
  static async getRoundProgress(roundId: string): Promise<RoundProgress> {
    const rounds = await this.getCountRounds();
    const round = rounds.find((r) => r.id === roundId) || rounds[0];
    const plants = await this.getPlants();
    const items = await this.getItems();
    const counts = await this.getStockCounts(round.id);

    // Filter items belonging to plants in this round
    const activePlantIds = new Set(round.plant_ids);
    const roundItems = items.filter((item) => activePlantIds.has(item.plant_id));

    // Map counts by item_id (only submitted counts contribute to progress)
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
    const uncounted_skus = total_skus - counted_skus;

    // Recounted: items counted >= 2 times
    let recounted_skus = 0;
    countOccurrences.forEach((num) => {
      if (num >= 2) recounted_skus++;
    });

    const difference_skus = countDifferences.size;
    const percentage = total_skus > 0 ? Math.round((counted_skus / total_skus) * 100) : 0;

    // By Plant
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

  // Submit Count: Creates a new stock_counts record and updates inventory_item current_quantity
  // Never overwrites previous records!
  static async submitCount(params: {
    round_id: string;
    item_id: string;
    plant_id: number;
    counted_quantity: number;
    notes?: string;
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
      counted_at: nowIso,
      created_at: nowIso,
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from("stock_counts").insert({
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
      });
      // Trigger handles updating item
    } else {
      // Local fallback
      const counts = getStored<StockCount[]>(STORAGE_KEYS.COUNTS, MOCK_STOCK_COUNTS);
      setStored(STORAGE_KEYS.COUNTS, [newRecord, ...counts]);

      // Update current item quantity
      const updatedItems = items.map((i) => {
        if (i.id === params.item_id) {
          return {
            ...i,
            current_quantity: params.counted_quantity,
            last_counted_at: nowIso,
            last_counted_by: user.id,
            last_counted_by_name: user.full_name,
            updated_at: nowIso,
          };
        }
        return i;
      });
      setStored(STORAGE_KEYS.ITEMS, updatedItems);
    }

    notifyRealtime("COUNT_SUBMITTED", {
      item_id: params.item_id,
      counted_quantity: params.counted_quantity,
      user_name: user.full_name,
      time: nowIso,
    });

    return newRecord;
  }

  // Save Draft Count: Staff can save and adjust before submitting
  static async saveDraftCount(params: {
    round_id: string;
    item_id: string;
    plant_id: number;
    counted_quantity: number;
    notes?: string;
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
      counted_at: nowIso,
      created_at: nowIso,
    };

    const counts = getStored<StockCount[]>(STORAGE_KEYS.COUNTS, MOCK_STOCK_COUNTS);
    // Replace any existing draft for this user + item + round
    const filtered = counts.filter(
      (c) => !(c.inventory_item_id === params.item_id && c.count_round_id === params.round_id && c.user_id === user.id && c.status === "DRAFT")
    );
    setStored(STORAGE_KEYS.COUNTS, [draftRecord, ...filtered]);

    return draftRecord;
  }

  // Admin Stock Adjustment with reason
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

    if (isSupabaseConfigured && supabase) {
      await supabase.from("stock_adjustments").insert({
        inventory_item_id: params.item_id,
        plant_id: params.plant_id,
        adjusted_by: user.id,
        adjusted_by_name: user.full_name,
        previous_quantity: prevQty,
        new_quantity: params.new_quantity,
        difference: diff,
        reason: params.reason,
      });
    } else {
      const adjs = getStored<StockAdjustment[]>(STORAGE_KEYS.ADJUSTMENTS, MOCK_ADJUSTMENTS);
      setStored(STORAGE_KEYS.ADJUSTMENTS, [adjRecord, ...adjs]);

      // Update item
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
    }

    notifyRealtime("STOCK_ADJUSTED", {
      item_id: params.item_id,
      new_quantity: params.new_quantity,
      reason: params.reason,
      adjusted_by: user.full_name,
    });

    return adjRecord;
  }

  // Admin Item Management (Create / Update / Toggle Status)
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
        created_at: nowIso,
        updated_at: nowIso,
      };
      setStored(STORAGE_KEYS.ITEMS, [saved, ...items]);
    }

    notifyRealtime("ITEM_SAVED", saved);
    return saved;
  }

  // Subscribe to realtime changes
  static onStockUpdate(callback: (event: { type: string; payload: unknown }) => void) {
    if (typeof window === "undefined") return () => {};

    // 1. BroadcastChannel for local / multi-tab instant sync
    const handleMessage = (e: MessageEvent) => {
      callback(e.data);
    };
    if (realtimeChannel) {
      realtimeChannel.addEventListener("message", handleMessage);
    }

    // 2. Supabase Realtime Channel
    let supabaseSub: any = null;
    if (isSupabaseConfigured && supabase) {
      supabaseSub = supabase
        .channel("public:stock_updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "stock_counts" },
          (payload) => {
            callback({ type: "COUNT_SUBMITTED", payload: payload.new });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "inventory_items" },
          (payload) => {
            callback({ type: "ITEM_SAVED", payload: payload.new });
          }
        )
        .subscribe();
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
