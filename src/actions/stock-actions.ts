"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Type definitions for action payloads
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
}

export interface SubmitCountInput {
  roundId: string;
  productId: string;
  userId: string;
  userName: string;
  countedLocations: CountLocationInput[];
  notes?: string;
}

export interface AdjustStockInput {
  productId: string;
  adminUserId: string;
  adminRole: string;
  newQuantity: number;
  reason: string;
}

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

// ────────────────────────────────────────────────────────
// 1. SUBMIT STOCK COUNT (TRANSACTION PER REQUIREMENT 65)
// ────────────────────────────────────────────────────────
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
      // Execute as a strict atomic database transaction
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

        // 2. Insert stock_count_locations records
        for (const loc of input.countedLocations) {
          const locId = "scl-" + Math.random().toString(36).slice(2, 9);
          await tx.insert(schema.stockCountLocations).values({
            id: locId,
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
            createdAt: now,
            updatedAt: now,
          });
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

// ────────────────────────────────────────────────────────
// 2. STOCK ADJUSTMENT (ADMIN ONLY PER REQUIREMENT 8)
// ────────────────────────────────────────────────────────
export async function adjustStockAction(input: AdjustStockInput) {
  // Server-side authorization check
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
        // Fetch current product
        const [prod] = await tx
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, input.productId));

        const oldQty = prod ? prod.currentQuantity : 0;
        const diff = input.newQuantity - oldQty;

        // Record adjustment
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

        // Update product stock
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
    return { success: true, adjustmentId: adjId };
  } catch (error) {
    console.error("adjustStockAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to adjust stock",
    };
  }
}

// ────────────────────────────────────────────────────────
// 3. PRODUCT MANAGEMENT (ADMIN ONLY)
// ────────────────────────────────────────────────────────
export async function saveProductAction(input: SaveProductInput) {
  if (input.adminRole !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  try {
    const now = new Date();
    const prodId = input.id || "prod-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

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

          // Create default storage location if lock/row specified
          if (input.defaultLock) {
            const locId = "loc-" + Math.random().toString(36).slice(2, 9);
            await tx.insert(schema.storageLocations).values({
              id: locId,
              plantId: input.plantId,
              zone: input.defaultZone || "Yard-1",
              lockCode: input.defaultLock,
              rowCode: input.defaultRow || "1",
              description: `ตำแหน่งเริ่มต้นของ ${input.sku}`,
              active: true,
              createdAt: now,
              updatedAt: now,
            });

            await tx.insert(schema.productLocations).values({
              id: "ploc-" + Math.random().toString(36).slice(2, 9),
              productId: prodId,
              storageLocationId: locId,
              expectedQuantity: input.currentQuantity || 0,
              isPrimary: true,
              active: true,
              createdAt: now,
              updatedAt: now,
            });
          }
        });
      } else {
        await db
          .update(schema.products)
          .set({
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

// ────────────────────────────────────────────────────────
// 4. GET SYSTEM STATUS ACTION
// ────────────────────────────────────────────────────────
export async function getSystemStatusAction() {
  return {
    database: "Neon PostgreSQL",
    configured: isDatabaseConfigured,
    orm: "Drizzle ORM",
    auth: "Better Auth",
    hosting: "Vercel",
    timestamp: new Date().toISOString(),
  };
}
