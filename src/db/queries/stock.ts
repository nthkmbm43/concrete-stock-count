import { cache } from "react";
import { db, schema, isDatabaseConfigured } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { StockCount, StockAdjustment, StockCountLocation } from "@/lib/types";
import { DataProvider } from "@/lib/data-provider";
import { requireStaffOrAdmin } from "@/lib/auth/server";

export const getStockCounts = cache(
  async (roundId?: string, limit = 100): Promise<StockCount[]> => {
    await requireStaffOrAdmin();
    if (!isDatabaseConfigured || !db) {
      return DataProvider.getStockCounts(roundId);
    }

    try {
      const counts = await db.query.stockCounts.findMany({
        where: roundId ? eq(schema.stockCounts.roundId, roundId) : undefined,
        orderBy: [desc(schema.stockCounts.createdAt)],
        limit,
        with: {
          product: true,
          user: true,
          locations: true,
        },
      });

      return counts.map((c) => ({
        id: c.id,
        count_round_id: c.roundId,
        plant_id: c.product?.plantId || 1,
        inventory_item_id: c.productId,
        user_id: c.userId,
        user_name: c.user?.name || "Staff",
        previous_quantity: c.previousQuantity,
        counted_quantity: c.countedQuantity,
        difference: c.difference,
        status: c.status as "DRAFT" | "SUBMITTED",
        notes: c.note || undefined,
        locations: (c.locations || []).map((l) => ({
          id: l.id,
          client_id: l.id,
          source_type: l.sourceType as "SYSTEM" | "NEW",
          storage_location_id: l.storageLocationId || undefined,
          lock_code: l.lockCode,
          row_code: l.rowCode,
          previous_quantity: l.previousQuantity,
          counted_quantity: l.countedQuantity,
          difference: l.difference,
          observation_status: l.observationStatus as any,
          note: l.note || undefined,
        })),
        counted_at: c.createdAt.toISOString(),
        submitted_at: c.submittedAt ? c.submittedAt.toISOString() : undefined,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.warn("getStockCounts fallback:", err);
      return DataProvider.getStockCounts(roundId);
    }
  }
);

export const getItemCountHistory = cache(
  async (productId: string, limit = 20): Promise<StockCount[]> => {
    if (!isDatabaseConfigured || !db) {
      return DataProvider.getItemHistory(productId);
    }

    try {
      const counts = await db.query.stockCounts.findMany({
        where: and(
          eq(schema.stockCounts.productId, productId),
          eq(schema.stockCounts.status, "SUBMITTED")
        ),
        orderBy: [desc(schema.stockCounts.createdAt)],
        limit,
        with: {
          product: true,
          user: true,
          locations: true,
        },
      });

      return counts.map((c) => ({
        id: c.id,
        count_round_id: c.roundId,
        plant_id: c.product?.plantId || 1,
        inventory_item_id: c.productId,
        user_id: c.userId,
        user_name: c.user?.name || "Staff",
        previous_quantity: c.previousQuantity,
        counted_quantity: c.countedQuantity,
        difference: c.difference,
        status: c.status as "DRAFT" | "SUBMITTED",
        notes: c.note || undefined,
        locations: (c.locations || []).map((l) => ({
          id: l.id,
          client_id: l.id,
          source_type: l.sourceType as "SYSTEM" | "NEW",
          storage_location_id: l.storageLocationId || undefined,
          lock_code: l.lockCode,
          row_code: l.rowCode,
          previous_quantity: l.previousQuantity,
          counted_quantity: l.countedQuantity,
          difference: l.difference,
          observation_status: l.observationStatus as any,
          note: l.note || undefined,
        })),
        counted_at: c.createdAt.toISOString(),
        submitted_at: c.submittedAt ? c.submittedAt.toISOString() : undefined,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.warn("getItemCountHistory fallback:", err);
      return DataProvider.getItemHistory(productId);
    }
  }
);

export const getAdjustments = cache(
  async (limit = 100): Promise<StockAdjustment[]> => {
    await requireStaffOrAdmin();
    if (!isDatabaseConfigured || !db) {
      return DataProvider.getAdjustments();
    }

    try {
      const rows = await db.query.stockAdjustments.findMany({
        orderBy: [desc(schema.stockAdjustments.createdAt)],
        limit,
        with: {
          adminUser: true,
        },
      });

      return rows.map((r) => ({
        id: r.id,
        inventory_item_id: r.productId,
        plant_id: 1,
        admin_user_id: r.adminUserId,
        adjusted_by_name: r.adminUser?.name || "Admin",
        previous_quantity: r.oldQuantity,
        old_quantity: r.oldQuantity,
        new_quantity: r.newQuantity,
        difference: r.difference,
        reason: r.reason,
        created_at: r.createdAt.toISOString(),
      }));
    } catch (err) {
      console.warn("getAdjustments fallback:", err);
      return DataProvider.getAdjustments();
    }
  }
);
