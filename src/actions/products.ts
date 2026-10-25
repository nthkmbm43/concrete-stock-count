"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface SaveProductInput {
  adminRole: string;
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

export async function saveProductAction(input: SaveProductInput) {
  if (input.adminRole !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  try {
    const now = new Date();
    const prodId =
      input.id || "prod-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    if (isDatabaseConfigured && db) {
      const isNew = !input.id;

      if (isNew) {
        await db.transaction(async (tx) => {
          await tx.insert(schema.products).values({
            id: prodId,
            sku: input.sku.toUpperCase().trim(),
            name: input.name.trim(),
            categoryId: input.categoryId || "finished_goods",
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
            const locId = "loc-" + Math.random().toString(36).slice(2, 9);
            await tx.insert(schema.storageLocations).values({
              id: locId,
              plantId: input.plantId,
              zone: input.defaultZone || "Zone A",
              lockCode: input.defaultLock,
              rowCode: input.defaultRow || "1",
              createdAt: now,
              updatedAt: now,
            });

            await tx.insert(schema.productLocations).values({
              id: "pl-" + Math.random().toString(36).slice(2, 9),
              productId: prodId,
              storageLocationId: locId,
              expectedQuantity: input.currentQuantity || 0,
              isPrimary: true,
              createdAt: now,
              updatedAt: now,
            });
          }
        });
      } else {
        await db
          .update(schema.products)
          .set({
            name: input.name.trim(),
            categoryId: input.categoryId || "finished_goods",
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
    return { success: true, productId: prodId };
  } catch (error) {
    console.error("saveProductAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save product",
    };
  }
}
