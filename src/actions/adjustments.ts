"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/permissions";

export interface AdjustStockInput {
  productId: string;
  newQuantity: number;
  reason: string;
}

/**
 * 32. DATABASE TRANSACTION: Admin Stock Adjustment
 * Identity & ADMIN authorization strictly verified on server via Better Auth + DB.
 * Audit trail records the real authenticated administrator ID.
 */
export async function adjustStockAction(input: AdjustStockInput) {
  try {
    // 1. Authenticate & Authorize strictly on server
    const admin = await requireAdmin();

    // 2. Validate input
    if (!input.productId) {
      return { success: false, error: "กรุณาระบุรหัสสินค้า (Product ID)" };
    }
    if (typeof input.newQuantity !== "number" || isNaN(input.newQuantity) || input.newQuantity < 0) {
      return { success: false, error: "จำนวนสต๊อกต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0" };
    }
    if (!input.reason?.trim()) {
      return { success: false, error: "กรุณาระบุเหตุผลการปรับปรุงยอดสต๊อก" };
    }

    const adjId = `adj-${crypto.randomUUID()}`;
    const now = new Date();
    let oldQty = 0;
    let diff = 0;

    if (isDatabaseConfigured && db) {
      await db.transaction(async (tx) => {
        const [prod] = await tx
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, input.productId));

        if (!prod) {
          throw new Error("ไม่พบรายการสินค้าที่ต้องการปรับปรุงยอด");
        }

        oldQty = prod.currentQuantity;
        diff = input.newQuantity - oldQty;

        // Record adjustment audit log with trusted admin identity
        await tx.insert(schema.stockAdjustments).values({
          id: adjId,
          productId: input.productId,
          adminUserId: admin.id,
          oldQuantity: oldQty,
          newQuantity: input.newQuantity,
          difference: diff,
          reason: input.reason.trim(),
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
    revalidatePath("/admin/products");
    revalidatePath("/history");
    revalidatePath("/reports/print");

    return {
      success: true,
      adjustmentId: adjId,
      oldQuantity: oldQty,
      newQuantity: input.newQuantity,
      difference: diff,
      adjustedBy: admin.fullName,
    };
  } catch (error: any) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    console.error("adjustStockAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการปรับยอดสต๊อก",
    };
  }
}
