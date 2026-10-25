"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { revalidatePath } from "next/cache";
import { requireStaffOrAdmin } from "@/lib/auth/server";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/permissions";

export interface AddLocationInput {
  plantId: number;
  lockCode: string;
  rowCode: string;
  zone?: string;
  description?: string;
}

export async function addStorageLocationAction(input: AddLocationInput) {
  try {
    // 1. Authenticate user
    const user = await requireStaffOrAdmin();

    // 2. Validate input
    if (!input.plantId || input.plantId < 1 || input.plantId > 4) {
      return { success: false, error: "กรุณาระบุโรงงานให้ถูกต้อง (1-4)" };
    }
    if (!input.lockCode?.trim()) {
      return { success: false, error: "กรุณาระบุรหัสล็อค (Lock Code)" };
    }

    const locId = `loc-${input.plantId}-${input.lockCode.toLowerCase().replace(/[^a-z0-9]/g, "")}-${input.rowCode?.trim() || "1"}`;
    const now = new Date();

    if (isDatabaseConfigured && db) {
      await db
        .insert(schema.storageLocations)
        .values({
          id: locId,
          plantId: input.plantId,
          zone: input.zone?.trim() || "Yard-1",
          lockCode: input.lockCode.trim().toUpperCase(),
          rowCode: input.rowCode?.trim() || "1",
          description: input.description?.trim() || `จุดวาง ${input.lockCode}/${input.rowCode}`,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }

    revalidatePath("/");
    return {
      success: true,
      locationId: locId,
      addedBy: user.fullName,
    };
  } catch (error: any) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    console.error("addStorageLocationAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเพิ่มจุดวาง",
    };
  }
}
