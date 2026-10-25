import { cache } from "react";
import { db, schema, isDatabaseConfigured } from "@/db";
import { desc, eq } from "drizzle-orm";
import { DataProvider } from "@/lib/data-provider";

export interface HistoryActivityItem {
  id: string;
  type: "COUNT" | "ADJUSTMENT";
  item_id: string;
  sku: string;
  item_name: string;
  plant_id: number;
  by_name: string;
  quantity: number;
  previous_quantity: number;
  difference: number;
  notes?: string;
  timestamp: string;
  locations?: Array<{
    lock_code: string;
    row_code: string;
    counted_quantity: number;
    note?: string;
  }>;
}

/**
 * 58. ACTIVITY:
 * Recent Activity: Limit 10-20 items, single round-trip.
 */
export const getRecentActivity = cache(
  async (limit = 20): Promise<HistoryActivityItem[]> => {
    if (!isDatabaseConfigured || !db) {
      const counts = await DataProvider.getStockCounts();
      const adjustments = await DataProvider.getAdjustments();
      const items = await DataProvider.getItems();
      const itemMap = new Map(items.map((i) => [i.id, i]));

      const combined: HistoryActivityItem[] = [];

      counts.slice(0, limit).forEach((c) => {
        const item = itemMap.get(c.inventory_item_id);
        combined.push({
          id: c.id,
          type: "COUNT",
          item_id: c.inventory_item_id,
          sku: item?.sku || "SKU",
          item_name: item?.name || "สินค้า",
          plant_id: c.plant_id,
          by_name: c.user_name,
          quantity: c.counted_quantity,
          previous_quantity: c.previous_quantity,
          difference: c.difference,
          notes: c.notes,
          timestamp: c.submitted_at || c.counted_at,
          locations: (c.locations || []).map((l) => ({
            lock_code: l.lock_code,
            row_code: l.row_code,
            counted_quantity: l.counted_quantity,
            note: l.note,
          })),
        });
      });

      adjustments.slice(0, limit).forEach((a) => {
        const item = itemMap.get(a.inventory_item_id);
        combined.push({
          id: a.id,
          type: "ADJUSTMENT",
          item_id: a.inventory_item_id,
          sku: item?.sku || "SKU",
          item_name: item?.name || "สินค้า",
          plant_id: a.plant_id || 1,
          by_name: `${a.adjusted_by_name} (แอดมิน)`,
          quantity: a.new_quantity,
          previous_quantity: a.previous_quantity,
          difference: a.difference,
          notes: a.reason,
          timestamp: a.created_at,
        });
      });

      return combined
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    }

    try {
      const [recentCounts, recentAdjustments] = await Promise.all([
        db.query.stockCounts.findMany({
          where: eq(schema.stockCounts.status, "SUBMITTED"),
          orderBy: [desc(schema.stockCounts.createdAt)],
          limit,
          with: {
            product: true,
            user: true,
            locations: true,
          },
        }),
        db.query.stockAdjustments.findMany({
          orderBy: [desc(schema.stockAdjustments.createdAt)],
          limit,
          with: {
            product: true,
            adminUser: true,
          },
        }),
      ]);

      const combined: HistoryActivityItem[] = [];

      recentCounts.forEach((c) => {
        combined.push({
          id: c.id,
          type: "COUNT",
          item_id: c.productId,
          sku: c.product?.sku || "SKU",
          item_name: c.product?.name || "สินค้า",
          plant_id: c.product?.plantId || 1,
          by_name: c.user?.name || "พนักงาน",
          quantity: c.countedQuantity,
          previous_quantity: c.previousQuantity,
          difference: c.difference,
          notes: c.note || undefined,
          timestamp: c.submittedAt ? c.submittedAt.toISOString() : c.createdAt.toISOString(),
          locations: (c.locations || []).map((l) => ({
            lock_code: l.lockCode,
            row_code: l.rowCode,
            counted_quantity: l.countedQuantity,
            note: l.note || undefined,
          })),
        });
      });

      recentAdjustments.forEach((a) => {
        combined.push({
          id: a.id,
          type: "ADJUSTMENT",
          item_id: a.productId,
          sku: a.product?.sku || "SKU",
          item_name: a.product?.name || "สินค้า",
          plant_id: a.product?.plantId || 1,
          by_name: `${a.adminUser?.name || "แอดมิน"} (แอดมิน)`,
          quantity: a.newQuantity,
          previous_quantity: a.oldQuantity,
          difference: a.difference,
          notes: a.reason,
          timestamp: a.createdAt.toISOString(),
        });
      });

      return combined
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (err) {
      console.warn("getRecentActivity fallback:", err);
      return [];
    }
  }
);
