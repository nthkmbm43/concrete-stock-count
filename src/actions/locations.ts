"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { revalidatePath } from "next/cache";

export interface AddLocationInput {
  plantId: number;
  lockCode: string;
  rowCode: string;
  zone?: string;
  description?: string;
}

export async function addStorageLocationAction(input: AddLocationInput) {
  try {
    const locId = "loc-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const now = new Date();

    if (isDatabaseConfigured && db) {
      await db.insert(schema.storageLocations).values({
        id: locId,
        plantId: input.plantId,
        zone: input.zone || "Zone A",
        lockCode: input.lockCode,
        rowCode: input.rowCode,
        description: input.description,
        createdAt: now,
        updatedAt: now,
      });
    }

    revalidatePath("/");
    return { success: true, locationId: locId };
  } catch (error) {
    console.error("addStorageLocationAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add storage location",
    };
  }
}
