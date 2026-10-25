"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface AdjustStockInput {
  productId: string;
  adminUserId: string;
  adminRole: string;
  newQuantity: number;
  reason: string;
}

/**
 * 32. DATABASE TRANSACTION: Admin Stock Adjustment
 * Records adjustment audit trail and updates product stock atomically.
 */
export async function adjustStockAction(input: AdjustStockInput) {
  if (input.adminRole !== "ADMIN") {
    return {
      success: false,
      error: "Unauthorized: Admin privileges required",
    };
  }

  try {
    const adjId = "adj-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const now = new Date();

    if (isDatabaseConfigured && db) {
      await db.transaction(async (tx) => {
        const [prod] = await tx
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, input.productId));

        const oldQty = prod ? prod.currentQuantity : 0;
        const diff = input.newQuantity - oldQty;

        // Record adjustment audit log
        await tx.insert(schema.stockAdjustments).values({
          id: adjId,
          productId: input.productId,
          adminUserId: input.adminUserId,
          oldQuantity: oldQty,
          newQuantity: input.newQuantity,
          difference: diff,
          reason: input.reason,
          createdAt: now,
        });

        // Update product current stock
        await tx
          .update(schema.products)
          .set({
            currentQuantity: input.newQuantity,
            lastCountedAt: now,
            updatedAt: now,
          })
          .where(eq(schema.products.id, input.productId));
      });
    }

    revalidatePath("/");
    return {
      success: true,
      adjustmentId: adjId,
      newQuantity: input.newQuantity,
    };
  } catch (error) {
    console.error("adjustStockAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to adjust stock",
    };
  }
}
