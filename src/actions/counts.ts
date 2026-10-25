"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaffOrAdmin } from "@/lib/auth/server";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/permissions";

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
  countedLocations: CountLocationInput[];
  notes?: string;
  // Optional client-hint for legacy callers; server MUST ignore and use trusted session
  userId?: string;
  userName?: string;
}

/**
 * 32. DATABASE TRANSACTION: Stock Count Submission
 * User identity is strictly resolved from Better Auth server session.
 * Client-provided userId/userName are discarded.
 */
export async function submitStockCountAction(input: SubmitCountInput) {
  try {
    // 1. Authenticate user from Server Session
    const user = await requireStaffOrAdmin();

    // 2. Validate input
    if (!input.roundId?.trim()) {
      return { success: false, error: "กรุณาระบุรอบการตรวจนับ (Round ID)" };
    }
    if (!input.productId?.trim()) {
      return { success: false, error: "กรุณาระบุรหัสสินค้า (Product ID)" };
    }

    const totalCounted = input.countedLocations.reduce(
      (sum, loc) => sum + loc.countedQuantity,
      0
    );
    const totalPrevious = input.countedLocations.reduce(
      (sum, loc) => sum + loc.previousQuantity,
      0
    );
    const totalDiff = totalCounted - totalPrevious;
    const countId = `count-${crypto.randomUUID()}`;
    const now = new Date();

    if (isDatabaseConfigured && db) {
      await db.transaction(async (tx) => {
        // 1. Insert stock_counts record using trusted user.id
        await tx.insert(schema.stockCounts).values({
          id: countId,
          roundId: input.roundId,
          productId: input.productId,
          userId: user.id,
          previousQuantity: totalPrevious,
          countedQuantity: totalCounted,
          difference: totalDiff,
          status: "SUBMITTED",
          note: input.notes || null,
          submittedAt: now,
          createdAt: now,
          updatedAt: now,
        });

        // 2. Batch insert stock_count_locations records
        if (input.countedLocations.length > 0) {
          await tx.insert(schema.stockCountLocations).values(
            input.countedLocations.map((loc) => ({
              id: `scl-${crypto.randomUUID()}`,
              stockCountId: countId,
              storageLocationId: loc.storageLocationId || null,
              sourceType: loc.sourceType || "MASTER",
              zone: loc.zone || "Yard-1",
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
            lastCountedBy: user.fullName,
            updatedAt: now,
          })
          .where(eq(schema.products.id, input.productId));
      });
    }

    revalidatePath("/");
    revalidatePath("/history");
    revalidatePath("/reports/print");

    return {
      success: true,
      countId,
      countedQuantity: totalCounted,
      previousQuantity: totalPrevious,
      difference: totalDiff,
      submittedBy: user.fullName,
      submittedAt: now.toISOString(),
    };
  } catch (error: any) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    console.error("submitStockCountAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกยอดนับ",
    };
  }
}
