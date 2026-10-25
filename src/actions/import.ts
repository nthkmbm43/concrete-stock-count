"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { eq, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import {
  parseImportBuffer,
  validateAndAggregateRows,
  RawRowData,
  ValidatedImportItem,
  RowErrorItem,
} from "@/lib/import/engine";
import { CanonicalFieldKey } from "@/lib/import/aliases";
import { escapeFormulaInjection } from "@/lib/import/normalizer";
import { requireAdmin, requireStaffOrAdmin } from "@/lib/auth/server";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/permissions";

/**
 * 1. Parse uploaded Excel / CSV file
 * Only authenticated administrators may parse import files.
 */
export async function parseImportFileAction(formData: FormData) {
  try {
    // Enforce admin permission
    await requireAdmin();

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "ไม่พบไฟล์ที่อัปโหลด" };
    }

    const fileName = file.name;
    const fileSize = file.size;

    // Check size (Max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      return { success: false, error: "ขนาดไฟล์เกินกำหนด (สูงสุด 10MB)" };
    }

    const lowerName = fileName.toLowerCase();
    if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls") && !lowerName.endsWith(".csv")) {
      return { success: false, error: "รองรับเฉพาะไฟล์ .xlsx, .xls หรือ .csv เท่านั้น" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await parseImportBuffer(arrayBuffer, fileName);

    return {
      success: true,
      fileName,
      fileSize,
      sheetNames: result.sheetNames,
      selectedSheet: result.selectedSheet,
      headers: result.headers,
      rawRows: result.rawRows,
      initialMapping: result.initialMapping,
      previewRows: result.previewRows,
    };
  } catch (err: any) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return { success: false, error: err.message, statusCode: err.statusCode };
    }
    console.error("parseImportFileAction error:", err);
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการอ่านไฟล์" };
  }
}

/**
 * 2. Validate import data and aggregate multi-location SKUs
 */
export async function validateImportDataAction(params: {
  rawRows: RawRowData[];
  mapping: Record<string, CanonicalFieldKey | "ignore">;
  duplicatePolicy: "skip" | "update" | "create_only";
}) {
  try {
    await requireAdmin();

    const { rawRows, mapping, duplicatePolicy } = params;

    // Extract all SKUs present in rawRows
    const skuCol = Object.entries(mapping).find(([_, f]) => f === "sku")?.[0];
    const candidateSkus: string[] = [];

    if (skuCol) {
      for (const r of rawRows) {
        const val = r.values[skuCol];
        if (val) {
          candidateSkus.push(String(val).trim().toUpperCase());
        }
      }
    }

    const uniqueSkus = Array.from(new Set(candidateSkus));
    const existingSkusSet = new Set<string>();

    if (uniqueSkus.length > 0 && isDatabaseConfigured && db) {
      const chunkSize = 500;
      for (let i = 0; i < uniqueSkus.length; i += chunkSize) {
        const chunk = uniqueSkus.slice(i, i + chunkSize);
        const found = await db
          .select({ sku: schema.products.sku })
          .from(schema.products)
          .where(inArray(schema.products.sku, chunk));
        for (const item of found) {
          existingSkusSet.add(item.sku);
        }
      }
    }

    const validationResult = validateAndAggregateRows(
      rawRows,
      mapping,
      existingSkusSet,
      duplicatePolicy
    );

    return {
      success: true,
      ...validationResult,
    };
  } catch (err: any) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return { success: false, error: err.message, statusCode: err.statusCode };
    }
    console.error("validateImportDataAction error:", err);
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล" };
  }
}

/**
 * 3. Execute batch database import within a transaction
 * Identity & ADMIN authorization strictly verified on server via Better Auth + DB.
 * Audit logs record the authentic administrator identity from session.
 */
export async function executeBatchImportAction(params: {
  fileName: string;
  fileSize: number;
  sheetName: string;
  duplicatePolicy: "skip" | "update" | "create_only";
  items: ValidatedImportItem[];
  errors: RowErrorItem[];
  // Optional client parameters are intentionally ignored; server uses authenticated admin
  userId?: string;
  userName?: string;
}) {
  try {
    // 1. Authenticate & Authorize strictly on server
    const admin = await requireAdmin();

    const { fileName, fileSize, sheetName, duplicatePolicy, items, errors } = params;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = crypto.randomUUID().slice(0, 8).toUpperCase();
    const batchId = `IMP-${dateStr}-${randomSuffix}`;
    const now = new Date();

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = errors.filter((e) => e.severity === "error").length;

    if (isDatabaseConfigured && db) {
      await db.transaction(async (tx) => {
        const existingCats = await tx.select().from(schema.productCategories);
        const catMap = new Map(existingCats.map((c) => [c.id.toLowerCase(), c.id]));

        const existingUnits = await tx.select().from(schema.units);
        const unitMap = new Map(existingUnits.map((u) => [u.id.toLowerCase(), u.id]));

        for (const item of items) {
          if (item.action === "skip") {
            skippedCount++;
            continue;
          }

          let resolvedCatId = catMap.get(item.categoryId.toLowerCase()) || "fences";
          let resolvedUnitId = unitMap.get(item.stockUnitId.toLowerCase());
          if (!resolvedUnitId) {
            resolvedUnitId = item.stockUnitId;
            await tx
              .insert(schema.units)
              .values({
                id: resolvedUnitId,
                code: resolvedUnitId.slice(0, 5).toUpperCase(),
                name: resolvedUnitId,
                symbol: resolvedUnitId,
                active: true,
              })
              .onConflictDoNothing();
            unitMap.set(resolvedUnitId.toLowerCase(), resolvedUnitId);
          }

          if (item.action === "create") {
            const prodId = `prod-${crypto.randomUUID()}`;

            await tx.insert(schema.products).values({
              id: prodId,
              sku: item.sku,
              name: item.name,
              categoryId: resolvedCatId,
              plantId: item.plantId,
              variant: item.variant || "-",
              heightValue: item.heightValue || null,
              heightUnit: "เมตร",
              widthValue: item.widthValue || null,
              widthUnit: "เมตร",
              lengthValue: item.lengthValue || null,
              lengthUnit: "เมตร",
              stockUnitId: resolvedUnitId,
              currentQuantity: item.currentQuantity,
              isActive: true,
              createdAt: now,
              updatedAt: now,
            });

            // Handle multi-locations
            for (let idx = 0; idx < item.locations.length; idx++) {
              const loc = item.locations[idx];
              const locId = `loc-${item.plantId}-${loc.lockCode.toLowerCase().replace(/[^a-z0-9]/g, "")}-${loc.rowCode}`;

              await tx
                .insert(schema.storageLocations)
                .values({
                  id: locId,
                  plantId: item.plantId,
                  zone: loc.zone || "Yard-1",
                  lockCode: loc.lockCode,
                  rowCode: loc.rowCode || "1",
                  description: `${loc.zone || "Yard-1"} จุดวาง ${loc.lockCode}/${loc.rowCode}`,
                  active: true,
                  createdAt: now,
                  updatedAt: now,
                })
                .onConflictDoNothing();

              const plId = `pl-${prodId}-${idx}`;
              await tx
                .insert(schema.productLocations)
                .values({
                  id: plId,
                  productId: prodId,
                  storageLocationId: locId,
                  expectedQuantity: loc.quantity,
                  isPrimary: idx === 0,
                  active: true,
                  createdAt: now,
                  updatedAt: now,
                })
                .onConflictDoNothing();
            }

            // Record initial stock adjustment audit using trusted admin.id
            if (item.currentQuantity > 0) {
              const adjId = `adj-${crypto.randomUUID()}`;
              await tx.insert(schema.stockAdjustments).values({
                id: adjId,
                productId: prodId,
                adminUserId: admin.id,
                oldQuantity: 0,
                newQuantity: item.currentQuantity,
                difference: item.currentQuantity,
                reason: `นำเข้าสต๊อกเริ่มต้นจากไฟล์ [${batchId}]: ${fileName}`,
                createdAt: now,
              });
            }

            successCount++;
          } else if (item.action === "update") {
            const [existing] = await tx
              .select()
              .from(schema.products)
              .where(eq(schema.products.sku, item.sku));

            if (existing) {
              const oldQty = existing.currentQuantity;
              const newQty = item.currentQuantity;

              await tx
                .update(schema.products)
                .set({
                  name: item.name,
                  plantId: item.plantId,
                  categoryId: resolvedCatId,
                  stockUnitId: resolvedUnitId,
                  variant: item.variant || existing.variant,
                  currentQuantity: newQty,
                  updatedAt: now,
                })
                .where(eq(schema.products.id, existing.id));

              // Record stock adjustment with trusted admin.id
              if (oldQty !== newQty) {
                const adjId = `adj-${crypto.randomUUID()}`;
                await tx.insert(schema.stockAdjustments).values({
                  id: adjId,
                  productId: existing.id,
                  adminUserId: admin.id,
                  oldQuantity: oldQty,
                  newQuantity: newQty,
                  difference: newQty - oldQty,
                  reason: `อัปเดตสต๊อกจากไฟล์นำเข้า [${batchId}]: ${fileName}`,
                  createdAt: now,
                });
              }

              for (let idx = 0; idx < item.locations.length; idx++) {
                const loc = item.locations[idx];
                const locId = `loc-${item.plantId}-${loc.lockCode.toLowerCase().replace(/[^a-z0-9]/g, "")}-${loc.rowCode}`;

                await tx
                  .insert(schema.storageLocations)
                  .values({
                    id: locId,
                    plantId: item.plantId,
                    zone: loc.zone || "Yard-1",
                    lockCode: loc.lockCode,
                    rowCode: loc.rowCode || "1",
                    description: `${loc.zone || "Yard-1"} จุดวาง ${loc.lockCode}/${loc.rowCode}`,
                    active: true,
                    createdAt: now,
                    updatedAt: now,
                  })
                  .onConflictDoNothing();

                const plId = `pl-${existing.id}-${idx}`;
                await tx
                  .insert(schema.productLocations)
                  .values({
                    id: plId,
                    productId: existing.id,
                    storageLocationId: locId,
                    expectedQuantity: loc.quantity,
                    isPrimary: idx === 0,
                    active: true,
                    createdAt: now,
                    updatedAt: now,
                  })
                  .onConflictDoUpdate({
                    target: schema.productLocations.id,
                    set: {
                      expectedQuantity: loc.quantity,
                      updatedAt: now,
                    },
                  });
              }

              successCount++;
            }
          }
        }

        // Insert audit log in importBatches with trusted admin identity
        await tx.insert(schema.importBatches).values({
          id: batchId,
          fileName,
          fileSize,
          importType: "product_master",
          sheetName,
          userId: admin.id,
          userName: admin.fullName,
          totalRows: items.length,
          successCount,
          skippedCount,
          errorCount,
          policy: duplicatePolicy,
          status: errorCount > 0 ? (successCount > 0 ? "PARTIAL" : "FAILED") : "SUCCESS",
          errorLog: errors.length > 0 ? JSON.stringify(errors.slice(0, 50)) : null,
          createdAt: now,
        });
      });
    }

    revalidatePath("/admin/products");
    revalidatePath("/stock-count");
    revalidatePath("/history");

    return {
      success: true,
      batchId,
      successCount,
      skippedCount,
      errorCount,
      executedBy: admin.fullName,
    };
  } catch (err: any) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return { success: false, error: err.message, statusCode: err.statusCode };
    }
    console.error("executeBatchImportAction error:", err);
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลนำเข้า" };
  }
}

/**
 * 4. Fetch import history batches
 */
export async function getImportHistoryAction() {
  try {
    await requireStaffOrAdmin();

    if (!isDatabaseConfigured || !db) {
      return { success: true, batches: [] };
    }

    const batches = await db
      .select()
      .from(schema.importBatches)
      .orderBy(desc(schema.importBatches.createdAt))
      .limit(30);

    return { success: true, batches };
  } catch (err: any) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return { success: false, error: err.message, batches: [] };
    }
    console.error("getImportHistoryAction error:", err);
    return { success: false, error: err.message || "ไม่สามารถดึงประวัติการนำเข้าได้", batches: [] };
  }
}

/**
 * 5. Generate Excel Error Report for download
 */
export async function exportErrorReportAction(errors: RowErrorItem[], originalFileName: string) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "KCON Concrete Stock System";
    const sheet = workbook.addWorksheet("รายงานข้อผิดพลาด (Errors)");

    sheet.columns = [
      { header: "ลำดับแถว (Row)", key: "rowNumber", width: 14 },
      { header: "รหัสสินค้า (SKU)", key: "sku", width: 18 },
      { header: "คอลัมน์ (Column)", key: "column", width: 20 },
      { header: "ระดับ (Severity)", key: "severity", width: 14 },
      { header: "รายละเอียดปัญหา (Issue)", key: "message", width: 45 },
      { header: "คำแนะนำแก้ไข (Suggested Fix)", key: "suggestedFix", width: 40 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF991B1B" }, // Crimson Red
      };
      cell.font = { name: "Segoe UI", bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    errors.forEach((err) => {
      const row = sheet.addRow({
        rowNumber: err.rowNumber,
        sku: escapeFormulaInjection(err.sku || "-"),
        column: escapeFormulaInjection(err.column || "-"),
        severity: err.severity === "error" ? "ข้อผิดพลาด (Error)" : "คำเตือน (Warning)",
        message: escapeFormulaInjection(err.message),
        suggestedFix: escapeFormulaInjection(err.suggestedFix || "-"),
      });
      row.height = 22;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Segoe UI", size: 10 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        if (colNumber === 1 || colNumber === 4) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      success: true,
      base64,
      fileName: `error-report-${originalFileName.replace(/\.[^/.]+$/, "")}.xlsx`,
    };
  } catch (err: any) {
    console.error("exportErrorReportAction error:", err);
    return { success: false, error: err.message || "ไม่สามารถสร้างรายงานข้อผิดพลาดได้" };
  }
}
