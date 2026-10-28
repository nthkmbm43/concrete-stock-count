import { cache } from "react";
import { db, schema, isDatabaseConfigured } from "@/db";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import { InventoryItem, ItemCategory } from "@/lib/types";
import { DataProvider } from "@/lib/data-provider";

export interface GetProductsOptions {
  plantId?: number | null;
  search?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}

/**
 * 20. SELECT ONLY WHAT IS USED & NO N+1
 * Centralized, performant query for product list with request-level deduplication.
 */
export const getProductList = cache(
  async (options: GetProductsOptions = {}): Promise<InventoryItem[]> => {
    if (!isDatabaseConfigured || !db) {
      const items = await DataProvider.getItems();
      return items.filter((i) => {
        if (options.plantId && i.plant_id !== options.plantId) return false;
        if (options.categoryId && i.category !== options.categoryId) return false;
        if (options.search) {
          const q = options.search.toLowerCase();
          const match =
            i.sku.toLowerCase().includes(q) ||
            i.name.toLowerCase().includes(q) ||
            i.size.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });
    }

    try {
      const conditions = [];

      if (options.plantId) {
        conditions.push(eq(schema.products.plantId, options.plantId));
      }

      if (options.categoryId) {
        conditions.push(eq(schema.products.categoryId, options.categoryId));
      }

      if (options.search && options.search.trim()) {
        const q = `%${options.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.products.sku, q),
            ilike(schema.products.name, q)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const productRows = await db.query.products.findMany({
        where: whereClause,
        orderBy: [desc(schema.products.updatedAt)],
        limit: options.limit || 200,
        offset: options.offset || 0,
        with: {
          locations: {
            with: {
              storageLocation: true,
            },
          },
        },
      });

      return productRows.map((p) => {
        const formattedLocations = (p.locations || []).map((pl) => ({
          id: pl.id,
          inventory_item_id: p.id,
          storage_location_id: pl.storageLocationId,
          lock_code: pl.storageLocation?.lockCode || "A1",
          row_code: pl.storageLocation?.rowCode || "1",
          expected_quantity: pl.expectedQuantity,
          source_type: "SYSTEM" as const,
        }));

        const sizeStr = [
          p.heightValue ? `สูง ${p.heightValue} ${p.heightUnit || "ม."}` : "",
          p.widthValue ? `กว้าง ${p.widthValue} ${p.widthUnit || "นิ้ว"}` : "",
          p.lengthValue ? `ยาว ${p.lengthValue} ${p.lengthUnit || "ม."}` : "",
        ]
          .filter(Boolean)
          .join(" ") || "-";

        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: (p.categoryId as ItemCategory) || "finished_goods",
          plant_id: p.plantId || 1,
          size: sizeStr,
          unit: p.stockUnitId || "ต้น",
          current_quantity: p.currentQuantity,
          locations: formattedLocations,
          image_url: p.imageUrl || undefined,
          variant: p.variant || "-",
          height: p.heightValue ? `${p.heightValue} ${p.heightUnit || "ม."}` : undefined,
          width: p.widthValue ? `${p.widthValue} ${p.widthUnit || "นิ้ว"}` : undefined,
          length: p.lengthValue ? `${p.lengthValue} ${p.lengthUnit || "ม."}` : undefined,
          last_counted_at: p.lastCountedAt ? p.lastCountedAt.toISOString() : undefined,
          last_counted_by: p.lastCountedBy || undefined,
          status: p.isActive ? "ACTIVE" : "INACTIVE",
          is_active: p.isActive,
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
        };
      });
    } catch (err) {
      console.warn("db.query.products.findMany fallback to DataProvider:", err);
      return DataProvider.getItems();
    }
  }
);

export const getProductDetail = cache(
  async (productId: string): Promise<InventoryItem | null> => {
    if (!isDatabaseConfigured || !db) {
      return DataProvider.getItemById(productId);
    }

    try {
      const prod = await db.query.products.findFirst({
        where: eq(schema.products.id, productId),
        with: {
          locations: {
            with: {
              storageLocation: true,
            },
          },
        },
      });

      if (!prod) return null;

      const formattedLocations = (prod.locations || []).map((pl) => ({
        id: pl.id,
        inventory_item_id: prod.id,
        storage_location_id: pl.storageLocationId,
        lock_code: pl.storageLocation?.lockCode || "A1",
        row_code: pl.storageLocation?.rowCode || "1",
        expected_quantity: pl.expectedQuantity,
        source_type: "SYSTEM" as const,
      }));

      const sizeStr = [
        prod.heightValue ? `สูง ${prod.heightValue} ${prod.heightUnit || "ม."}` : "",
        prod.widthValue ? `กว้าง ${prod.widthValue} ${prod.widthUnit || "นิ้ว"}` : "",
        prod.lengthValue ? `ยาว ${prod.lengthValue} ${prod.lengthUnit || "ม."}` : "",
      ]
        .filter(Boolean)
        .join(" ") || "-";

      return {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        category: (prod.categoryId as ItemCategory) || "finished_goods",
        plant_id: prod.plantId || 1,
        size: sizeStr,
        unit: prod.stockUnitId || "ต้น",
        current_quantity: prod.currentQuantity,
        locations: formattedLocations,
        image_url: prod.imageUrl || undefined,
        variant: prod.variant || "-",
        height: prod.heightValue ? `${prod.heightValue} ${prod.heightUnit || "ม."}` : undefined,
        width: prod.widthValue ? `${prod.widthValue} ${prod.widthUnit || "นิ้ว"}` : undefined,
        length: prod.lengthValue ? `${prod.lengthValue} ${prod.lengthUnit || "ม."}` : undefined,
        last_counted_at: prod.lastCountedAt ? prod.lastCountedAt.toISOString() : undefined,
        last_counted_by: prod.lastCountedBy || undefined,
        status: prod.isActive ? "ACTIVE" : "INACTIVE",
        is_active: prod.isActive,
        created_at: prod.createdAt.toISOString(),
        updated_at: prod.updatedAt.toISOString(),
      };
    } catch (err) {
      console.warn("getProductDetail query fallback:", err);
      return DataProvider.getItemById(productId);
    }
  }
);

export const getProductBySku = cache(
  async (sku: string): Promise<InventoryItem | null> => {
    if (!sku) return null;
    const cleanSku = decodeURIComponent(sku).trim();

    if (!isDatabaseConfigured || !db) {
      const items = await DataProvider.getItems();
      return (
        items.find((i) => i.sku.toUpperCase() === cleanSku.toUpperCase()) || null
      );
    }

    try {
      const prod = await db.query.products.findFirst({
        where: ilike(schema.products.sku, cleanSku),
        with: {
          locations: {
            with: {
              storageLocation: true,
            },
          },
        },
      });

      if (!prod) {
        const items = await DataProvider.getItems();
        return (
          items.find((i) => i.sku.toUpperCase() === cleanSku.toUpperCase()) || null
        );
      }

      const formattedLocations = (prod.locations || []).map((pl) => ({
        id: pl.id,
        inventory_item_id: prod.id,
        storage_location_id: pl.storageLocationId,
        lock_code: pl.storageLocation?.lockCode || "A1",
        row_code: pl.storageLocation?.rowCode || "1",
        expected_quantity: pl.expectedQuantity,
        source_type: "SYSTEM" as const,
      }));

      const sizeStr = [
        prod.heightValue ? `สูง ${prod.heightValue} ${prod.heightUnit || "ม."}` : "",
        prod.widthValue ? `กว้าง ${prod.widthValue} ${prod.widthUnit || "นิ้ว"}` : "",
        prod.lengthValue ? `ยาว ${prod.lengthValue} ${prod.lengthUnit || "ม."}` : "",
      ]
        .filter(Boolean)
        .join(" ") || "-";

      return {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        category: (prod.categoryId as ItemCategory) || "finished_goods",
        plant_id: prod.plantId || 1,
        size: sizeStr,
        unit: prod.stockUnitId || "ต้น",
        current_quantity: prod.currentQuantity,
        locations: formattedLocations,
        image_url: prod.imageUrl || undefined,
        variant: prod.variant || "-",
        height: prod.heightValue ? `${prod.heightValue} ${prod.heightUnit || "ม."}` : undefined,
        width: prod.widthValue ? `${prod.widthValue} ${prod.widthUnit || "นิ้ว"}` : undefined,
        length: prod.lengthValue ? `${prod.lengthValue} ${prod.lengthUnit || "ม."}` : undefined,
        last_counted_at: prod.lastCountedAt ? prod.lastCountedAt.toISOString() : undefined,
        last_counted_by: prod.lastCountedBy || undefined,
        status: prod.isActive ? "ACTIVE" : "INACTIVE",
        is_active: prod.isActive,
        created_at: prod.createdAt.toISOString(),
        updated_at: prod.updatedAt.toISOString(),
      };
    } catch (err) {
      console.warn("getProductBySku query fallback:", err);
      const items = await DataProvider.getItems();
      return (
        items.find((i) => i.sku.toUpperCase() === cleanSku.toUpperCase()) || null
      );
    }
  }
);

export const getProductCurrentStock = cache(
  async (productId: string) => {
    if (!isDatabaseConfigured || !db) {
      const item = await DataProvider.getItemById(productId);
      return {
        id: productId,
        current_quantity: item?.current_quantity || 0,
        last_counted_at: item?.last_counted_at,
        last_counted_by: item?.last_counted_by,
      };
    }

    const [row] = await db
      .select({
        id: schema.products.id,
        currentQuantity: schema.products.currentQuantity,
        lastCountedAt: schema.products.lastCountedAt,
        lastCountedBy: schema.products.lastCountedBy,
      })
      .from(schema.products)
      .where(eq(schema.products.id, productId));

    return {
      id: row ? row.id : productId,
      current_quantity: row ? row.currentQuantity : 0,
      last_counted_at: row?.lastCountedAt?.toISOString(),
      last_counted_by: row?.lastCountedBy || undefined,
    };
  }
);
