"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface SaveRoundInput {
  adminRole: string;
  id?: string;
  name: string;
  type: "MONTHLY" | "WEEKLY" | "RECOUNT" | "SPECIAL";
  startDate: string;
  endDate: string;
  plantIds: number[];
  status?: "OPEN" | "CLOSED";
}

export async function saveCountRoundAction(input: SaveRoundInput) {
  if (input.adminRole !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  try {
    const roundId = input.id || "round-" + Date.now().toString(36);
    const now = new Date();

    if (isDatabaseConfigured && db) {
      const isNew = !input.id;

      await db.transaction(async (tx) => {
        if (isNew) {
          await tx.insert(schema.countRounds).values({
            id: roundId,
            name: input.name,
            type: input.type,
            startDate: input.startDate,
            endDate: input.endDate,
            status: input.status || "OPEN",
            createdAt: now,
            updatedAt: now,
          });
        } else {
          await tx
            .update(schema.countRounds)
            .set({
              name: input.name,
              type: input.type,
              startDate: input.startDate,
              endDate: input.endDate,
              status: input.status || "OPEN",
              updatedAt: now,
            })
            .where(eq(schema.countRounds.id, roundId));

          await tx
            .delete(schema.countRoundPlants)
            .where(eq(schema.countRoundPlants.roundId, roundId));
        }

        if (input.plantIds.length > 0) {
          await tx.insert(schema.countRoundPlants).values(
            input.plantIds.map((plantId) => ({
              id: "crp-" + Math.random().toString(36).slice(2, 9),
              roundId,
              plantId,
            }))
          );
        }
      });
    }

    revalidatePath("/");
    return { success: true, roundId };
  } catch (error) {
    console.error("saveCountRoundAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save count round",
    };
  }
}
