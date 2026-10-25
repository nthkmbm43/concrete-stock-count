import { cache } from "react";
import { db, schema, isDatabaseConfigured } from "@/db";
import { eq, desc } from "drizzle-orm";
import { StorageLocation } from "@/lib/types";

export const getStorageLocations = cache(
  async (plantId?: number): Promise<StorageLocation[]> => {
    if (!isDatabaseConfigured || !db) {
      return [];
    }

    try {
      const rows = await db.query.storageLocations.findMany({
        where: plantId ? eq(schema.storageLocations.plantId, plantId) : undefined,
        orderBy: [desc(schema.storageLocations.createdAt)],
      });

      return rows.map((r) => ({
        id: r.id,
        plant_id: r.plantId,
        lock_code: r.lockCode,
        row_code: r.rowCode,
        description: r.description || undefined,
        is_active: r.active,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.warn("getStorageLocations fallback:", err);
      return [];
    }
  }
);
