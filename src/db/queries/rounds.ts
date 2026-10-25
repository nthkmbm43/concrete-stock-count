import { cache } from "react";
import { db, schema, isDatabaseConfigured } from "@/db";
import { eq, and, sql, count, countDistinct } from "drizzle-orm";
import { CountRound, CountRoundType, RoundProgress } from "@/lib/types";
import { DataProvider } from "@/lib/data-provider";

export const getCurrentRound = cache(async (): Promise<CountRound | null> => {
  if (!isDatabaseConfigured || !db) {
    const rounds = await DataProvider.getCountRounds();
    return rounds.find((r) => r.status === "OPEN") || rounds[0] || null;
  }

  try {
    const round = await db.query.countRounds.findFirst({
      where: eq(schema.countRounds.status, "OPEN"),
      with: {
        plants: true,
      },
    });

    if (!round) {
      const latest = await db.query.countRounds.findFirst({
        orderBy: (r, { desc }) => [desc(r.createdAt)],
        with: { plants: true },
      });
      if (!latest) return null;
      return {
        id: latest.id,
        name: latest.name,
        title: latest.name,
        type: (latest.type as CountRoundType) || "MONTHLY",
        count_type: (latest.type as CountRoundType) || "MONTHLY",
        start_date: latest.startDate,
        end_date: latest.endDate,
        status: (latest.status as "OPEN" | "CLOSED") || "OPEN",
        plant_ids: latest.plants.map((p) => p.plantId),
        created_at: latest.createdAt.toISOString(),
      };
    }

    return {
      id: round.id,
      name: round.name,
      title: round.name,
      type: (round.type as CountRoundType) || "MONTHLY",
      count_type: (round.type as CountRoundType) || "MONTHLY",
      start_date: round.startDate,
      end_date: round.endDate,
      status: (round.status as "OPEN" | "CLOSED") || "OPEN",
      plant_ids: round.plants.map((p) => p.plantId),
      created_at: round.createdAt.toISOString(),
    };
  } catch (err) {
    console.warn("getCurrentRound fallback:", err);
    const rounds = await DataProvider.getCountRounds();
    return rounds.find((r) => r.status === "OPEN") || rounds[0] || null;
  }
});

export const getRoundList = cache(async (): Promise<CountRound[]> => {
  if (!isDatabaseConfigured || !db) {
    return DataProvider.getCountRounds();
  }

  try {
    const rounds = await db.query.countRounds.findMany({
      orderBy: (r, { desc }) => [desc(r.createdAt)],
      with: { plants: true },
    });

    return rounds.map((r) => ({
      id: r.id,
      name: r.name,
      title: r.name,
      type: (r.type as CountRoundType) || "MONTHLY",
      count_type: (r.type as CountRoundType) || "MONTHLY",
      start_date: r.startDate,
      end_date: r.endDate,
      status: (r.status as "OPEN" | "CLOSED") || "OPEN",
      plant_ids: r.plants.map((p) => p.plantId),
      created_at: r.createdAt.toISOString(),
    }));
  } catch (err) {
    console.warn("getRoundList fallback:", err);
    return DataProvider.getCountRounds();
  }
});

export const getRoundProgress = cache(
  async (roundId: string): Promise<RoundProgress> => {
    if (!isDatabaseConfigured || !db) {
      return DataProvider.getRoundProgress(roundId);
    }

    const currentDb = db;

    try {
      const roundPlantRows = await currentDb
        .select({ plantId: schema.countRoundPlants.plantId })
        .from(schema.countRoundPlants)
        .where(eq(schema.countRoundPlants.roundId, roundId));

      const plantIds = roundPlantRows.map((rp) => rp.plantId);

      const [totalSkusResult] = await currentDb
        .select({ count: count(schema.products.id) })
        .from(schema.products)
        .where(
          plantIds.length > 0
            ? sql`${schema.products.plantId} IN ${plantIds} AND ${schema.products.isActive} = true`
            : eq(schema.products.isActive, true)
        );

      const totalSkus = Number(totalSkusResult?.count || 0);

      const [countedResult] = await currentDb
        .select({
          distinctCounted: countDistinct(schema.stockCounts.productId),
          matchedCount: sql<number>`COUNT(*) FILTER (WHERE ${schema.stockCounts.difference} = 0 AND ${schema.stockCounts.status} = 'SUBMITTED')`,
          overCount: sql<number>`COUNT(*) FILTER (WHERE ${schema.stockCounts.difference} > 0 AND ${schema.stockCounts.status} = 'SUBMITTED')`,
          underCount: sql<number>`COUNT(*) FILTER (WHERE ${schema.stockCounts.difference} < 0 AND ${schema.stockCounts.status} = 'SUBMITTED')`,
        })
        .from(schema.stockCounts)
        .where(
          and(
            eq(schema.stockCounts.roundId, roundId),
            eq(schema.stockCounts.status, "SUBMITTED")
          )
        );

      const countedSkus = Number(countedResult?.distinctCounted || 0);
      const uncountedSkus = Math.max(0, totalSkus - countedSkus);
      const percentage = totalSkus > 0 ? Math.round((countedSkus / totalSkus) * 100) : 0;
      const matchedCount = Number(countedResult?.matchedCount || 0);
      const overCount = Number(countedResult?.overCount || 0);
      const underCount = Number(countedResult?.underCount || 0);

      const plantsList = plantIds.length > 0 ? plantIds : [1, 2, 3, 4];
      const plantProgress = await Promise.all(
        plantsList.map(async (plantId) => {
          const [pTotalRes] = await currentDb
            .select({ count: count(schema.products.id) })
            .from(schema.products)
            .where(
              and(
                eq(schema.products.plantId, plantId),
                eq(schema.products.isActive, true)
              )
            );
          const pTotal = Number(pTotalRes?.count || 0);

          const [pCountedRes] = await currentDb
            .select({ count: countDistinct(schema.stockCounts.productId) })
            .from(schema.stockCounts)
            .innerJoin(
              schema.products,
              eq(schema.stockCounts.productId, schema.products.id)
            )
            .where(
              and(
                eq(schema.stockCounts.roundId, roundId),
                eq(schema.stockCounts.status, "SUBMITTED"),
                eq(schema.products.plantId, plantId)
              )
            );
          const pCounted = Number(pCountedRes?.count || 0);

          return {
            plant_id: plantId,
            plant_name: `โรง ${plantId}`,
            total_skus: pTotal,
            counted_skus: pCounted,
            percentage: pTotal > 0 ? Math.round((pCounted / pTotal) * 100) : 0,
          };
        })
      );

      return {
        count_round_id: roundId,
        round_id: roundId,
        total_skus: totalSkus,
        counted_skus: countedSkus,
        uncounted_skus: uncountedSkus,
        percentage,
        matched_count: matchedCount,
        over_count: overCount,
        under_count: underCount,
        plants: plantProgress,
      };
    } catch (err) {
      console.warn("getRoundProgress query fallback:", err);
      return DataProvider.getRoundProgress(roundId);
    }
  }
);
