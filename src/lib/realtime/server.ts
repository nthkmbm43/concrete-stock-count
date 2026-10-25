import { createRealtime } from "@neon/realtime/server";
import { drizzleAdapter } from "@neon/realtime-drizzle";
import { db, schema, isDatabaseConfigured } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import type { SealedLiveQuery } from "@neon/realtime/client";

// Neon Realtime Capability Issuer configuration
const secret = process.env.NEON_REALTIME_SECRET || "default_development_secret_key_32_chars_min";
const dbName = process.env.PGDATABASE || "neondb";

let realtimeInstance: ReturnType<typeof createRealtime> | null = null;

export function getRealtimeServer() {
  if (!realtimeInstance) {
    try {
      realtimeInstance = createRealtime({
        secret,
        db: dbName,
        debugMode: process.env.NODE_ENV !== "production",
        adapter: drizzleAdapter(),
      });
    } catch (e) {
      console.warn("createRealtime server init notice:", e);
    }
  }
  return realtimeInstance;
}

/**
 * 5. SEALED QUERY: Server-side sealed query creation
 * Checks authorization and produces an encrypted capability token for client live queries.
 */
export async function sealProductsLiveQuery(plantId?: number | null): Promise<SealedLiveQuery<any> | null> {
  const realtime = getRealtimeServer();
  if (!realtime || !db) return null;

  try {
    const query = db
      .select({
        id: schema.products.id,
        sku: schema.products.sku,
        name: schema.products.name,
        plantId: schema.products.plantId,
        currentQuantity: schema.products.currentQuantity,
        stockUnitId: schema.products.stockUnitId,
        heightValue: schema.products.heightValue,
        widthValue: schema.products.widthValue,
        lengthValue: schema.products.lengthValue,
        lastCountedAt: schema.products.lastCountedAt,
        lastCountedBy: schema.products.lastCountedBy,
        isActive: schema.products.isActive,
      })
      .from(schema.products)
      .where(
        plantId ? eq(schema.products.plantId, plantId) : undefined
      )
      .orderBy(desc(schema.products.updatedAt));

    const sealed = await realtime.seal({ query });
    return sealed;
  } catch (err) {
    console.warn("sealProductsLiveQuery error:", err);
    return null;
  }
}

export async function sealProductStockLiveQuery(productId: string): Promise<SealedLiveQuery<any> | null> {
  const realtime = getRealtimeServer();
  if (!realtime || !db) return null;

  try {
    const query = db
      .select({
        id: schema.products.id,
        currentQuantity: schema.products.currentQuantity,
        lastCountedAt: schema.products.lastCountedAt,
        lastCountedBy: schema.products.lastCountedBy,
      })
      .from(schema.products)
      .where(eq(schema.products.id, productId));

    const sealed = await realtime.seal({ query });
    return sealed;
  } catch (err) {
    console.warn("sealProductStockLiveQuery error:", err);
    return null;
  }
}

export async function sealRoundCountsLiveQuery(roundId: string): Promise<SealedLiveQuery<any> | null> {
  const realtime = getRealtimeServer();
  if (!realtime || !db) return null;

  try {
    const query = db
      .select({
        id: schema.stockCounts.id,
        productId: schema.stockCounts.productId,
        countedQuantity: schema.stockCounts.countedQuantity,
        previousQuantity: schema.stockCounts.previousQuantity,
        difference: schema.stockCounts.difference,
        status: schema.stockCounts.status,
        note: schema.stockCounts.note,
        createdAt: schema.stockCounts.createdAt,
      })
      .from(schema.stockCounts)
      .where(
        and(
          eq(schema.stockCounts.roundId, roundId),
          eq(schema.stockCounts.status, "SUBMITTED")
        )
      )
      .orderBy(desc(schema.stockCounts.createdAt));

    const sealed = await realtime.seal({ query });
    return sealed;
  } catch (err) {
    console.warn("sealRoundCountsLiveQuery error:", err);
    return null;
  }
}
