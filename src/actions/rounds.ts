"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/permissions";

export interface SaveRoundInput {
  id?: string;
  name: string;
  type: "MONTHLY" | "WEEKLY" | "RECOUNT" | "SPECIAL";
  startDate: string;
  endDate: string;
  plantIds: number[];
  status?: "OPEN" | "CLOSED";
}

/**
 * Admin Count Round Management Action
 * Identity & ADMIN authorization strictly verified on server via Better Auth + DB.
 */
export async function saveCountRoundAction(input: SaveRoundInput) {
  try {
    // 1. Authenticate & Authorize strictly on server
    const admin = await requireAdmin();

    // 2. Validate input
    if (!input.name?.trim()) {
      return { success: false, error: "กรุณาระบุชื่อรอบการตรวจนับ" };
    }
    if (!input.startDate || !input.endDate) {
      return { success: false, error: "กรุณาระบุวันที่เริ่มต้นและสิ้นสุดรอบนับ" };
    }

    const roundId = input.id || `round-${crypto.randomUUID()}`;
    const now = new Date();

    if (isDatabaseConfigured && db) {
      const isNew = !input.id;

      await db.transaction(async (tx) => {
        if (isNew) {
          await tx.insert(schema.countRounds).values({
            id: roundId,
            name: input.name.trim(),
            type: input.type,
            startDate: input.startDate,
            endDate: input.endDate,
            status: input.status || "OPEN",
            createdBy: admin.id,
            createdAt: now,
            updatedAt: now,
          });
        } else {
          await tx
            .update(schema.countRounds)
            .set({
              name: input.name.trim(),
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

        if (input.plantIds && input.plantIds.length > 0) {
          await tx.insert(schema.countRoundPlants).values(
            input.plantIds.map((pId) => ({
              id: `crp-${roundId}-${pId}`,
              roundId,
              plantId: pId,
            }))
          );
        }
      });
    }

    revalidatePath("/");
    revalidatePath("/admin/rounds");
    revalidatePath("/reports/print");

    return {
      success: true,
      roundId,
      savedBy: admin.fullName,
    };
  } catch (error: any) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    console.error("saveCountRoundAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกรอบนับ",
    };
  }
}
