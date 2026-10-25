import { cache } from "react";
import { db, schema, isDatabaseConfigured } from "@/db";
import { eq, desc, asc, and, inArray } from "drizzle-orm";
import { DataProvider } from "@/lib/data-provider";
import { Plant, CountRound, InventoryItem, StockCount } from "@/lib/types";
import { getCompanySettings } from "./company";

export interface ReportQueryOptions {
  scope?: "current_stock" | "count_round";
  roundId?: string;
  plantId?: number; // 0 or undefined = all plants
  categoryId?: string;
  differenceOnly?: boolean;
  sortBy?: "sku" | "name" | "diff_desc" | "location";
}

export interface ReportItemRow {
  index: number;
  productId: string;
  sku: string;
  name: string;
  category: string;
  spec: string;
  unit: string;
  plantId: number;
  plantName: string;
  lockCode: string;
  rowCode: string;
  locationSource: "MASTER" | "NEW" | "SYSTEM";
  observationStatus?: string;
  locationNote?: string;
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
  countStatus: "NOT_COUNTED" | "DRAFT" | "SUBMITTED";
  countedBy?: string;
  countedAt?: string;
  generalNote?: string;
}

export interface PlantReportSummary {
  plantId: number;
  plantName: string;
  totalSkus: number;
  countedSkus: number;
  systemQty: number;
  countedQty: number;
  differenceQty: number;
  diffCount: number;
}

export interface ReportSummary {
  title: string;
  scope: "current_stock" | "count_round";
  roundId?: string;
  roundName?: string;
  roundType?: string;
  roundPeriod?: string;
  roundStatus?: string;
  totalSkus: number;
  totalLocations: number;
  countedSkus: number;
  countedPercentage: number;
  totalSystemQty: number;
  totalCountedQty: number;
  totalDifferenceQty: number;
  itemsWithDiffCount: number;
  plantSummaries: PlantReportSummary[];
  generatedAt: string;
  generatedBy?: string;
  companyNameTh?: string;
  companyNameEn?: string;
  brandName?: string;
  addressTh?: string;
  phone?: string | null;
  email?: string;
  website?: string;
  logoUrl?: string | null;
  reportFooter?: string | null;
}

export interface ReportDataResult {
  summary: ReportSummary;
  rows: ReportItemRow[];
  groupedByPlant: Record<number, ReportItemRow[]>;
  differenceRows: ReportItemRow[];
}

const PLANT_NAMES: Record<number, string> = {
  1: "โรง 1 (ท่อคอนกรีต)",
  2: "โรง 2 (เสาเข็ม/แผ่นพื้น)",
  3: "โรง 3 (บ่อพัก/คาน)",
  4: "โรง 4 (คอนกรีตผสมเสร็จ)",
};

export const getReportData = cache(
  async (options: ReportQueryOptions = {}): Promise<ReportDataResult> => {
    const {
      scope = "count_round",
      roundId,
      plantId,
      categoryId,
      differenceOnly = false,
      sortBy = "sku",
    } = options;

    if (!isDatabaseConfigured || !db) {
      return getFallbackReportData(options);
    }

    try {
      // 1. Fetch Round Info if count_round
      let selectedRound: any = null;
      if (scope === "count_round") {
        if (roundId) {
          selectedRound = await db.query.countRounds.findFirst({
            where: eq(schema.countRounds.id, roundId),
          });
        }
        if (!selectedRound) {
          // Find first open or most recent round
          selectedRound = await db.query.countRounds.findFirst({
            orderBy: [desc(schema.countRounds.createdAt)],
          });
        }
      }

      // 2. Fetch Plants
      const allPlants = await db.query.plants.findMany();
      const plantMap = new Map<number, string>();
      allPlants.forEach((p) => plantMap.set(p.id, p.name));

      // 3. Fetch Products
      const productWhere = and(
        plantId && plantId > 0 ? eq(schema.products.plantId, plantId) : undefined,
        categoryId && categoryId !== "all" ? eq(schema.products.categoryId, categoryId) : undefined
      );

      const dbProducts = await db.query.products.findMany({
        where: productWhere,
        orderBy: [asc(schema.products.sku)],
        with: {
          locations: {
            with: {
              storageLocation: true,
            },
          },
        },
      });

      // 4. If count_round, fetch stock counts for this round
      const effectiveRoundId = selectedRound?.id;
      let dbCounts: any[] = [];
      if (scope === "count_round" && effectiveRoundId) {
        dbCounts = await db.query.stockCounts.findMany({
          where: eq(schema.stockCounts.roundId, effectiveRoundId),
          with: {
            locations: true,
            user: true,
          },
        });
      }

      const countMap = new Map<string, any>();
      dbCounts.forEach((c) => countMap.set(c.productId, c));

      // 5. Generate Row Items
      const rawRows: ReportItemRow[] = [];

      for (const prod of dbProducts) {
        const pId = prod.plantId || 1;
        const pName = plantMap.get(pId) || PLANT_NAMES[pId] || `โรง ${pId}`;
        const spec = [prod.widthValue ? `กว้าง ${prod.widthValue}` : "", prod.heightValue ? `สูง ${prod.heightValue}` : "", prod.lengthValue ? `ยาว ${prod.lengthValue}` : ""]
          .filter(Boolean)
          .join(" ") || prod.variant || "-";

        if (scope === "count_round") {
          const count = countMap.get(prod.id);

          if (count) {
            // Counted product
            const countLocations = count.locations || [];
            if (countLocations.length > 0) {
              for (const loc of countLocations) {
                rawRows.push({
                  index: 0,
                  productId: prod.id,
                  sku: prod.sku,
                  name: prod.name,
                  category: prod.categoryId || "finished_goods",
                  spec,
                  unit: prod.stockUnitId || "ต้น",
                  plantId: pId,
                  plantName: pName,
                  lockCode: loc.lockCode || "-",
                  rowCode: loc.rowCode || "-",
                  locationSource: (loc.sourceType as any) || "SYSTEM",
                  observationStatus: loc.observationStatus || "FOUND",
                  locationNote: loc.note || undefined,
                  systemQuantity: loc.previousQuantity ?? 0,
                  countedQuantity: loc.countedQuantity ?? 0,
                  difference: loc.difference ?? 0,
                  countStatus: count.status as any,
                  countedBy: count.user?.name || "พนักงาน",
                  countedAt: count.submittedAt
                    ? new Date(count.submittedAt).toLocaleString("th-TH")
                    : new Date(count.createdAt).toLocaleString("th-TH"),
                  generalNote: count.note || undefined,
                });
              }
            } else {
              // Counted as overall
              rawRows.push({
                index: 0,
                productId: prod.id,
                sku: prod.sku,
                name: prod.name,
                category: prod.categoryId || "finished_goods",
                spec,
                unit: prod.stockUnitId || "ต้น",
                plantId: pId,
                plantName: pName,
                lockCode: "-",
                rowCode: "-",
                locationSource: "SYSTEM",
                systemQuantity: count.previousQuantity ?? prod.currentQuantity,
                countedQuantity: count.countedQuantity ?? 0,
                difference: count.difference ?? 0,
                countStatus: count.status as any,
                countedBy: count.user?.name || "พนักงาน",
                countedAt: count.submittedAt
                  ? new Date(count.submittedAt).toLocaleString("th-TH")
                  : new Date(count.createdAt).toLocaleString("th-TH"),
                generalNote: count.note || undefined,
              });
            }
          } else {
            // Not counted yet
            const prodLocs = prod.locations || [];
            if (prodLocs.length > 0) {
              for (const pl of prodLocs) {
                const sLoc = pl.storageLocation;
                rawRows.push({
                  index: 0,
                  productId: prod.id,
                  sku: prod.sku,
                  name: prod.name,
                  category: prod.categoryId || "finished_goods",
                  spec,
                  unit: prod.stockUnitId || "ต้น",
                  plantId: pId,
                  plantName: pName,
                  lockCode: sLoc?.lockCode || "-",
                  rowCode: sLoc?.rowCode || "-",
                  locationSource: "MASTER",
                  systemQuantity: pl.expectedQuantity ?? 0,
                  countedQuantity: 0,
                  difference: 0 - (pl.expectedQuantity ?? 0),
                  countStatus: "NOT_COUNTED",
                  generalNote: "รอตรวจนับ",
                });
              }
            } else {
              rawRows.push({
                index: 0,
                productId: prod.id,
                sku: prod.sku,
                name: prod.name,
                category: prod.categoryId || "finished_goods",
                spec,
                unit: prod.stockUnitId || "ต้น",
                plantId: pId,
                plantName: pName,
                lockCode: "-",
                rowCode: "-",
                locationSource: "SYSTEM",
                systemQuantity: prod.currentQuantity ?? 0,
                countedQuantity: 0,
                difference: 0 - (prod.currentQuantity ?? 0),
                countStatus: "NOT_COUNTED",
                generalNote: "รอตรวจนับ",
              });
            }
          }
        } else {
          // Current stock scope
          const prodLocs = prod.locations || [];
          if (prodLocs.length > 0) {
            for (const pl of prodLocs) {
              const sLoc = pl.storageLocation;
              rawRows.push({
                index: 0,
                productId: prod.id,
                sku: prod.sku,
                name: prod.name,
                category: prod.categoryId || "finished_goods",
                spec,
                unit: prod.stockUnitId || "ต้น",
                plantId: pId,
                plantName: pName,
                lockCode: sLoc?.lockCode || "-",
                rowCode: sLoc?.rowCode || "-",
                locationSource: "MASTER",
                systemQuantity: pl.expectedQuantity ?? 0,
                countedQuantity: pl.expectedQuantity ?? 0,
                difference: 0,
                countStatus: "SUBMITTED",
                countedBy: prod.lastCountedBy || "ระบบ",
                countedAt: prod.lastCountedAt
                  ? new Date(prod.lastCountedAt).toLocaleString("th-TH")
                  : undefined,
              });
            }
          } else {
            rawRows.push({
              index: 0,
              productId: prod.id,
              sku: prod.sku,
              name: prod.name,
              category: prod.categoryId || "finished_goods",
              spec,
              unit: prod.stockUnitId || "ต้น",
              plantId: pId,
              plantName: pName,
              lockCode: "-",
              rowCode: "-",
              locationSource: "SYSTEM",
              systemQuantity: prod.currentQuantity ?? 0,
              countedQuantity: prod.currentQuantity ?? 0,
              difference: 0,
              countStatus: "SUBMITTED",
              countedBy: prod.lastCountedBy || "ระบบ",
              countedAt: prod.lastCountedAt
                ? new Date(prod.lastCountedAt).toLocaleString("th-TH")
                : undefined,
            });
          }
        }
      }

      // 6. Filter by Difference Only if requested
      let filteredRows = rawRows;
      if (differenceOnly) {
        filteredRows = rawRows.filter((r) => r.difference !== 0);
      }

      // 7. Sort
      filteredRows.sort((a, b) => {
        if (sortBy === "diff_desc") {
          return Math.abs(b.difference) - Math.abs(a.difference);
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name, "th");
        }
        if (sortBy === "location") {
          if (a.plantId !== b.plantId) return a.plantId - b.plantId;
          if (a.lockCode !== b.lockCode) return a.lockCode.localeCompare(b.lockCode);
          return a.rowCode.localeCompare(b.rowCode);
        }
        return a.sku.localeCompare(b.sku);
      });

      // Assign sequential index
      filteredRows.forEach((r, idx) => {
        r.index = idx + 1;
      });

      // 8. Summary Computations
      const uniqueSkus = new Set(filteredRows.map((r) => r.productId));
      const countedSkusSet = new Set(
        filteredRows
          .filter((r) => r.countStatus === "SUBMITTED" || r.countStatus === "DRAFT")
          .map((r) => r.productId)
      );

      const totalSystemQty = filteredRows.reduce((acc, r) => acc + r.systemQuantity, 0);
      const totalCountedQty = filteredRows.reduce((acc, r) => acc + r.countedQuantity, 0);
      const totalDifferenceQty = filteredRows.reduce((acc, r) => acc + r.difference, 0);
      const itemsWithDiffCount = filteredRows.filter((r) => r.difference !== 0).length;

      // Group by plant
      const groupedByPlant: Record<number, ReportItemRow[]> = {};
      const plantSummaryMap = new Map<number, PlantReportSummary>();

      const activePlantIds = plantId && plantId > 0 ? [plantId] : [1, 2, 3, 4];
      for (const pId of activePlantIds) {
        groupedByPlant[pId] = [];
        plantSummaryMap.set(pId, {
          plantId: pId,
          plantName: plantMap.get(pId) || PLANT_NAMES[pId] || `โรง ${pId}`,
          totalSkus: 0,
          countedSkus: 0,
          systemQty: 0,
          countedQty: 0,
          differenceQty: 0,
          diffCount: 0,
        });
      }

      for (const r of filteredRows) {
        if (!groupedByPlant[r.plantId]) {
          groupedByPlant[r.plantId] = [];
        }
        groupedByPlant[r.plantId].push(r);

        const pSum = plantSummaryMap.get(r.plantId);
        if (pSum) {
          pSum.systemQty += r.systemQuantity;
          pSum.countedQty += r.countedQuantity;
          pSum.differenceQty += r.difference;
          if (r.difference !== 0) pSum.diffCount += 1;
        }
      }

      for (const pId of activePlantIds) {
        const pRows = groupedByPlant[pId] || [];
        const pSum = plantSummaryMap.get(pId);
        if (pSum) {
          pSum.totalSkus = new Set(pRows.map((r) => r.productId)).size;
          pSum.countedSkus = new Set(
            pRows
              .filter((r) => r.countStatus === "SUBMITTED" || r.countStatus === "DRAFT")
              .map((r) => r.productId)
          ).size;
        }
      }

      const company = await getCompanySettings();

      const summary: ReportSummary = {
        title:
          scope === "count_round"
            ? `รายงานผลการตรวจนับสต๊อกสินค้า - ${selectedRound?.name || "รอบนับปัจจุบัน"}`
            : "รายงานยอดคงเหลือสต๊อกสินค้าปัจจุบัน (Current Stock)",
        scope,
        roundId: selectedRound?.id,
        roundName: selectedRound?.name,
        roundType: selectedRound?.type,
        roundPeriod: selectedRound
          ? `${selectedRound.startDate} ถึง ${selectedRound.endDate}`
          : undefined,
        roundStatus: selectedRound?.status,
        totalSkus: uniqueSkus.size,
        totalLocations: filteredRows.length,
        countedSkus: countedSkusSet.size,
        countedPercentage:
          uniqueSkus.size > 0
            ? Math.round((countedSkusSet.size / uniqueSkus.size) * 100)
            : 0,
        totalSystemQty,
        totalCountedQty,
        totalDifferenceQty,
        itemsWithDiffCount,
        plantSummaries: Array.from(plantSummaryMap.values()),
        generatedAt: new Date().toLocaleString("th-TH"),
        companyNameTh: company.companyNameTh,
        companyNameEn: company.companyNameEn,
        brandName: company.brandName,
        addressTh: company.addressTh,
        phone: company.phone,
        email: company.email,
        website: company.website,
        logoUrl: company.logoUrl,
        reportFooter: company.reportFooter,
      };

      const differenceRows = filteredRows.filter((r) => r.difference !== 0);

      return {
        summary,
        rows: filteredRows,
        groupedByPlant,
        differenceRows,
      };
    } catch (err) {
      console.warn("getReportData database query failed, falling back to local data:", err);
      return getFallbackReportData(options);
    }
  }
);

async function getFallbackReportData(options: ReportQueryOptions): Promise<ReportDataResult> {
  const {
    scope = "count_round",
    roundId,
    plantId,
    categoryId,
    differenceOnly = false,
    sortBy = "sku",
  } = options;

  const rounds: CountRound[] = await DataProvider.getCountRounds();
  const selectedRound = roundId
    ? rounds.find((r: CountRound) => r.id === roundId)
    : rounds.find((r: CountRound) => r.status === "OPEN") || rounds[0];

  const allItems = await DataProvider.getItems();
  const allCounts = await DataProvider.getStockCounts(selectedRound?.id);

  const filteredItems = allItems.filter((i) => {
    if (plantId && plantId > 0 && i.plant_id !== plantId) return false;
    if (categoryId && categoryId !== "all" && i.category !== categoryId) return false;
    return true;
  });

  const countMap = new Map<string, StockCount>();
  allCounts.forEach((c) => countMap.set(c.inventory_item_id, c));

  const rawRows: ReportItemRow[] = [];

  for (const item of filteredItems) {
    const pId = item.plant_id || 1;
    const pName = PLANT_NAMES[pId] || `โรง ${pId}`;
    const spec = item.size || [item.width, item.height, item.length].filter(Boolean).join(" ") || "-";

    if (scope === "count_round") {
      const count = countMap.get(item.id);
      if (count && count.locations && count.locations.length > 0) {
        for (const loc of count.locations) {
          rawRows.push({
            index: 0,
            productId: item.id,
            sku: item.sku,
            name: item.name,
            category: item.category,
            spec,
            unit: item.unit,
            plantId: pId,
            plantName: pName,
            lockCode: loc.lock_code || "-",
            rowCode: loc.row_code || "-",
            locationSource: loc.source_type || "SYSTEM",
            observationStatus: loc.observation_status || "FOUND",
            locationNote: loc.note,
            systemQuantity: loc.previous_quantity ?? 0,
            countedQuantity: loc.counted_quantity ?? 0,
            difference: loc.difference ?? 0,
            countStatus: count.status,
            countedBy: count.user_name || "พนักงาน",
            countedAt: count.submitted_at || count.counted_at,
            generalNote: count.notes,
          });
        }
      } else if (count) {
        rawRows.push({
          index: 0,
          productId: item.id,
          sku: item.sku,
          name: item.name,
          category: item.category,
          spec,
          unit: item.unit,
          plantId: pId,
          plantName: pName,
          lockCode: "-",
          rowCode: "-",
          locationSource: "SYSTEM",
          systemQuantity: count.previous_quantity ?? item.current_quantity,
          countedQuantity: count.counted_quantity ?? 0,
          difference: count.difference ?? 0,
          countStatus: count.status,
          countedBy: count.user_name || "พนักงาน",
          countedAt: count.submitted_at || count.counted_at,
          generalNote: count.notes,
        });
      } else {
        const itemLocs = item.locations || [];
        if (itemLocs.length > 0) {
          for (const il of itemLocs) {
            rawRows.push({
              index: 0,
              productId: item.id,
              sku: item.sku,
              name: item.name,
              category: item.category,
              spec,
              unit: item.unit,
              plantId: pId,
              plantName: pName,
              lockCode: il.lock_code || "-",
              rowCode: il.row_code || "-",
              locationSource: "MASTER",
              systemQuantity: il.expected_quantity ?? 0,
              countedQuantity: 0,
              difference: -(il.expected_quantity ?? 0),
              countStatus: "NOT_COUNTED",
              generalNote: "รอตรวจนับ",
            });
          }
        } else {
          rawRows.push({
            index: 0,
            productId: item.id,
            sku: item.sku,
            name: item.name,
            category: item.category,
            spec,
            unit: item.unit,
            plantId: pId,
            plantName: pName,
            lockCode: "-",
            rowCode: "-",
            locationSource: "SYSTEM",
            systemQuantity: item.current_quantity ?? 0,
            countedQuantity: 0,
            difference: -(item.current_quantity ?? 0),
            countStatus: "NOT_COUNTED",
            generalNote: "รอตรวจนับ",
          });
        }
      }
    } else {
      // current stock
      const itemLocs = item.locations || [];
      if (itemLocs.length > 0) {
        for (const il of itemLocs) {
          rawRows.push({
            index: 0,
            productId: item.id,
            sku: item.sku,
            name: item.name,
            category: item.category,
            spec,
            unit: item.unit,
            plantId: pId,
            plantName: pName,
            lockCode: il.lock_code || "-",
            rowCode: il.row_code || "-",
            locationSource: "MASTER",
            systemQuantity: il.expected_quantity ?? 0,
            countedQuantity: il.expected_quantity ?? 0,
            difference: 0,
            countStatus: "SUBMITTED",
            countedBy: item.last_counted_by_name || "ระบบ",
            countedAt: item.last_counted_at,
          });
        }
      } else {
        rawRows.push({
          index: 0,
          productId: item.id,
          sku: item.sku,
          name: item.name,
          category: item.category,
          spec,
          unit: item.unit,
          plantId: pId,
          plantName: pName,
          lockCode: "-",
          rowCode: "-",
          locationSource: "SYSTEM",
          systemQuantity: item.current_quantity ?? 0,
          countedQuantity: item.current_quantity ?? 0,
          difference: 0,
          countStatus: "SUBMITTED",
          countedBy: item.last_counted_by_name || "ระบบ",
          countedAt: item.last_counted_at,
        });
      }
    }
  }

  let filteredRows = rawRows;
  if (differenceOnly) {
    filteredRows = rawRows.filter((r) => r.difference !== 0);
  }

  filteredRows.sort((a, b) => {
    if (sortBy === "diff_desc") return Math.abs(b.difference) - Math.abs(a.difference);
    if (sortBy === "name") return a.name.localeCompare(b.name, "th");
    if (sortBy === "location") {
      if (a.plantId !== b.plantId) return a.plantId - b.plantId;
      if (a.lockCode !== b.lockCode) return a.lockCode.localeCompare(b.lockCode);
      return a.rowCode.localeCompare(b.rowCode);
    }
    return a.sku.localeCompare(b.sku);
  });

  filteredRows.forEach((r, idx) => {
    r.index = idx + 1;
  });

  const uniqueSkus = new Set(filteredRows.map((r) => r.productId));
  const countedSkusSet = new Set(
    filteredRows
      .filter((r) => r.countStatus === "SUBMITTED" || r.countStatus === "DRAFT")
      .map((r) => r.productId)
  );

  const totalSystemQty = filteredRows.reduce((acc, r) => acc + r.systemQuantity, 0);
  const totalCountedQty = filteredRows.reduce((acc, r) => acc + r.countedQuantity, 0);
  const totalDifferenceQty = filteredRows.reduce((acc, r) => acc + r.difference, 0);
  const itemsWithDiffCount = filteredRows.filter((r) => r.difference !== 0).length;

  const groupedByPlant: Record<number, ReportItemRow[]> = {};
  const plantSummaryMap = new Map<number, PlantReportSummary>();

  const activePlantIds = plantId && plantId > 0 ? [plantId] : [1, 2, 3, 4];
  for (const pId of activePlantIds) {
    groupedByPlant[pId] = [];
    plantSummaryMap.set(pId, {
      plantId: pId,
      plantName: PLANT_NAMES[pId] || `โรง ${pId}`,
      totalSkus: 0,
      countedSkus: 0,
      systemQty: 0,
      countedQty: 0,
      differenceQty: 0,
      diffCount: 0,
    });
  }

  for (const r of filteredRows) {
    if (!groupedByPlant[r.plantId]) {
      groupedByPlant[r.plantId] = [];
    }
    groupedByPlant[r.plantId].push(r);

    const pSum = plantSummaryMap.get(r.plantId);
    if (pSum) {
      pSum.systemQty += r.systemQuantity;
      pSum.countedQty += r.countedQuantity;
      pSum.differenceQty += r.difference;
      if (r.difference !== 0) pSum.diffCount += 1;
    }
  }

  for (const pId of activePlantIds) {
    const pRows = groupedByPlant[pId] || [];
    const pSum = plantSummaryMap.get(pId);
    if (pSum) {
      pSum.totalSkus = new Set(pRows.map((r) => r.productId)).size;
      pSum.countedSkus = new Set(
        pRows
          .filter((r) => r.countStatus === "SUBMITTED" || r.countStatus === "DRAFT")
          .map((r) => r.productId)
      ).size;
    }
  }

  const company = await getCompanySettings();

  const summary: ReportSummary = {
    title:
      scope === "count_round"
        ? `รายงานผลการตรวจนับสต๊อกสินค้า - ${selectedRound?.name || "รอบนับปัจจุบัน"}`
        : "รายงานยอดคงเหลือสต๊อกสินค้าปัจจุบัน (Current Stock)",
    scope,
    roundId: selectedRound?.id,
    roundName: selectedRound?.name,
    roundType: selectedRound?.type,
    roundPeriod: selectedRound
      ? `${selectedRound.start_date} ถึง ${selectedRound.end_date}`
      : undefined,
    roundStatus: selectedRound?.status,
    totalSkus: uniqueSkus.size,
    totalLocations: filteredRows.length,
    countedSkus: countedSkusSet.size,
    countedPercentage:
      uniqueSkus.size > 0
        ? Math.round((countedSkusSet.size / uniqueSkus.size) * 100)
        : 0,
    totalSystemQty,
    totalCountedQty,
    totalDifferenceQty,
    itemsWithDiffCount,
    plantSummaries: Array.from(plantSummaryMap.values()),
    generatedAt: new Date().toLocaleString("th-TH"),
    companyNameTh: company.companyNameTh,
    companyNameEn: company.companyNameEn,
    brandName: company.brandName,
    addressTh: company.addressTh,
    phone: company.phone,
    email: company.email,
    website: company.website,
    logoUrl: company.logoUrl,
    reportFooter: company.reportFooter,
  };

  const differenceRows = filteredRows.filter((r) => r.difference !== 0);

  return {
    summary,
    rows: filteredRows,
    groupedByPlant,
    differenceRows,
  };
}
