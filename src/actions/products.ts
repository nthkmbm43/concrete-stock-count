"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/permissions";

export interface SaveProductInput {
  id?: string;
  sku: string;
  name: string;
  categoryId?: string;
  plantId: number;
  variant?: string;
  heightValue?: string;
  heightUnit?: string;
  widthValue?: string;
  widthUnit?: string;
  lengthValue?: string;
  lengthUnit?: string;
  stockUnitId?: string;
  currentQuantity?: number;
  status?: "ACTIVE" | "INACTIVE";
  defaultLock?: string;
  defaultRow?: string;
  defaultZone?: string;
}

/**
 * Admin Product Management Action
 * Identity & ADMIN authorization strictly verified on server via Better Auth + DB.
 */
export async function saveProductAction(input: SaveProductInput) {
  try {
    // 1. Authenticate & Authorize strictly on server
    const admin = await requireAdmin();

    // 2. Validate input
    if (!input.sku?.trim()) {
      return { success: false, error: "กรุณาระบุรหัสสินค้า (SKU)" };
    }
    if (!input.name?.trim()) {
      return { success: false, error: "กรุณาระบุชื่อสินค้า" };
    }
    if (!input.plantId || input.plantId < 1 || input.plantId > 4) {
      return { success: false, error: "กรุณาระบุโรงงานให้ถูกต้อง (1-4)" };
    }

    const now = new Date();
    const prodId = input.id || `prod-${crypto.randomUUID()}`;

    if (isDatabaseConfigured && db) {
      const isNew = !input.id;

      if (isNew) {
        await db.transaction(async (tx) => {
          await tx.insert(schema.products).values({
            id: prodId,
            sku: input.sku.toUpperCase().trim(),
            name: input.name.trim(),
            categoryId: input.categoryId || "fences",
            plantId: input.plantId,
            variant: input.variant || "-",
            heightValue: input.heightValue || null,
            heightUnit: input.heightUnit || "เมตร",
            widthValue: input.widthValue || null,
            widthUnit: input.widthUnit || "นิ้ว",
            lengthValue: input.lengthValue || null,
            lengthUnit: input.lengthUnit || "เมตร",
            stockUnitId: input.stockUnitId || "ต้น",
            currentQuantity: input.currentQuantity || 0,
            isActive: input.status !== "INACTIVE",
            createdAt: now,
            updatedAt: now,
          });

          if (input.defaultLock) {
            const locId = `loc-${input.plantId}-${input.defaultLock.toLowerCase().replace(/[^a-z0-9]/g, "")}-${input.defaultRow || "1"}`;
            await tx
              .insert(schema.storageLocations)
              .values({
                id: locId,
                plantId: input.plantId,
                zone: input.defaultZone || "Yard-1",
                lockCode: input.defaultLock.trim(),
                rowCode: input.defaultRow?.trim() || "1",
                createdAt: now,
                updatedAt: now,
              })
              .onConflictDoNothing();

            await tx
              .insert(schema.productLocations)
              .values({
                id: `pl-${prodId}-0`,
                productId: prodId,
                storageLocationId: locId,
                expectedQuantity: input.currentQuantity || 0,
                isPrimary: true,
                createdAt: now,
                updatedAt: now,
              })
              .onConflictDoNothing();
          }
        });
      } else {
        await db
          .update(schema.products)
          .set({
            name: input.name.trim(),
            categoryId: input.categoryId || "fences",
            plantId: input.plantId,
            variant: input.variant || "-",
            heightValue: input.heightValue || null,
            heightUnit: input.heightUnit || "เมตร",
            widthValue: input.widthValue || null,
            widthUnit: input.widthUnit || "นิ้ว",
            lengthValue: input.lengthValue || null,
            lengthUnit: input.lengthUnit || "เมตร",
            stockUnitId: input.stockUnitId || "ต้น",
            isActive: input.status !== "INACTIVE",
            updatedAt: now,
          })
          .where(eq(schema.products.id, prodId));
      }
    }

    revalidatePath("/");
    revalidatePath("/admin/products");
    revalidatePath("/reports/print");

    return {
      success: true,
      productId: prodId,
      savedBy: admin.fullName,
    };
  } catch (error: any) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    console.error("saveProductAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกสินค้า",
    };
  }
}
