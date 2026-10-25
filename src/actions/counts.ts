"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CountLocationInput {
  storageLocationId?: string;
  sourceType?: "MASTER" | "OBSERVED_NEW";
  zone?: string;
  lockCode: string;
  rowCode: string;
  previousQuantity: number;
  countedQuantity: number;
  difference: number;
  observationStatus?: "FOUND" | "MOVED" | "NOT_FOUND" | "NEW_LOCATION";
  note?: string;
}

export interface SubmitCountInput {
  roundId: string;
  productId: string;
  userId: string;
  userName: string;
  countedLocations: CountLocationInput[];
  notes?: string;
}

/**
 * 32. DATABASE TRANSACTION & 33. ONE ACTION = ONE MUTATION FLOW & 34. BATCH WRITES
 * Executes full stock count submission in a single atomic transaction with batch writes.
 */
export async function submitStockCountAction(input: SubmitCountInput) {
  try {
    const totalCounted = input.countedLocations.reduce(
      (sum, loc) => sum + loc.countedQuantity,
      0
    );
    const totalPrevious = input.countedLocations.reduce(
      (sum, loc) => sum + loc.previousQuantity,
      0
    );
    const totalDiff = totalCounted - totalPrevious;
    const countId = "count-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const now = new Date();

    if (isDatabaseConfigured && db) {
      await db.transaction(async (tx) => {
        // 1. Insert stock_counts record
        await tx.insert(schema.stockCounts).values({
          id: countId,
          roundId: input.roundId,
          productId: input.productId,
          userId: input.userId,
          previousQuantity: totalPrevious,
          countedQuantity: totalCounted,
          difference: totalDiff,
          status: "SUBMITTED",
          note: input.notes || null,
          submittedAt: now,
          createdAt: now,
          updatedAt: now,
        });

        // 2. Batch insert stock_count_locations records (Rule 34: BATCH WRITES)
        if (input.countedLocations.length > 0) {
          await tx.insert(schema.stockCountLocations).values(
            input.countedLocations.map((loc) => ({
              id: "scl-" + Math.random().toString(36).slice(2, 9),
              stockCountId: countId,
              storageLocationId: loc.storageLocationId || null,
              sourceType: loc.sourceType || "MASTER",
              zone: loc.zone || "Zone A",
              lockCode: loc.lockCode,
              rowCode: loc.rowCode,
              previousQuantity: loc.previousQuantity,
              countedQuantity: loc.countedQuantity,
              difference: loc.difference,
              observationStatus: loc.observationStatus || "FOUND",
              note: loc.note || null,
              createdAt: now,
              updatedAt: now,
            }))
          );
        }

        // 3. Update products current stock and last counted info
        await tx
          .update(schema.products)
          .set({
            currentQuantity: totalCounted,
            lastCountedAt: now,
            lastCountedBy: input.userName,
            updatedAt: now,
          })
          .where(eq(schema.products.id, input.productId));
      });
    }

    revalidatePath("/");
    return {
      success: true,
      countId,
      countedQuantity: totalCounted,
      previousQuantity: totalPrevious,
      difference: totalDiff,
      submittedAt: now.toISOString(),
    };
  } catch (error) {
    console.error("submitStockCountAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit count",
    };
  }
}
