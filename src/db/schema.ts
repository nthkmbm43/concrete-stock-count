import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ────────────────────────────────────────────────────────
// 1. BETTER AUTH TABLES
// ────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("STAFF"), // "STAFF" | "ADMIN"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("account_user_idx").on(table.userId)]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ────────────────────────────────────────────────────────
// 2. USER PROFILES
// ────────────────────────────────────────────────────────

export const profiles = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    employeeCode: text("employee_code"),
    fullName: text("full_name").notNull(),
    role: text("role").notNull().default("STAFF"), // "STAFF" | "ADMIN"
    plantId: integer("plant_id"),
    phone: text("phone"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("profile_user_idx").on(table.userId),
    index("profile_role_idx").on(table.role),
  ]
);

// ────────────────────────────────────────────────────────
// 3. MASTER DATA TABLES: Plants, Categories, Units
// ────────────────────────────────────────────────────────

export const plants = pgTable("plants", {
  id: integer("id").primaryKey(), // 1, 2, 3, 4
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
});

export const productCategories = pgTable("product_categories", {
  id: text("id").primaryKey(), // "finished_goods", "raw_material", "consumables", "others"
  code: text("code").notNull(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
});

export const units = pgTable("units", {
  id: text("id").primaryKey(), // "ต้น", "แผ่น", "คิว", "ตัน", etc.
  code: text("code").notNull(),
  name: text("name").notNull(),
  symbol: text("symbol"),
  active: boolean("active").notNull().default(true),
});

// ────────────────────────────────────────────────────────
// 4. STORAGE LOCATIONS
// ────────────────────────────────────────────────────────

export const storageLocations = pgTable(
  "storage_locations",
  {
    id: text("id").primaryKey(),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id),
    zone: text("zone").notNull(),
    lockCode: text("lock_code").notNull(),
    rowCode: text("row_code").notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("storage_loc_plant_idx").on(table.plantId),
    index("storage_loc_lock_idx").on(table.lockCode),
    index("storage_loc_plant_lock_idx").on(table.plantId, table.lockCode),
  ]
);

// ────────────────────────────────────────────────────────
// 5. PRODUCTS & MASTER PRODUCT LOCATIONS
// ────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    categoryId: text("category_id").references(() => productCategories.id),
    plantId: integer("plant_id").references(() => plants.id),
    variant: text("variant").default("-"),
    imageUrl: text("image_url"),
    heightValue: text("height_value"),
    heightUnit: text("height_unit").default("เมตร"),
    widthValue: text("width_value"),
    widthUnit: text("width_unit").default("นิ้ว"),
    lengthValue: text("length_value"),
    lengthUnit: text("length_unit").default("เมตร"),
    stockUnitId: text("stock_unit_id").references(() => units.id),
    currentQuantity: integer("current_quantity").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    lastCountedAt: timestamp("last_counted_at"),
    lastCountedBy: text("last_counted_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("product_sku_idx").on(table.sku),
    index("product_name_idx").on(table.name),
    index("product_plant_idx").on(table.plantId),
    index("product_category_idx").on(table.categoryId),
    index("product_plant_sku_idx").on(table.plantId, table.sku),
  ]
);

export const productLocations = pgTable(
  "product_locations",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    storageLocationId: text("storage_location_id")
      .notNull()
      .references(() => storageLocations.id, { onDelete: "cascade" }),
    expectedQuantity: integer("expected_quantity").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("prod_loc_product_idx").on(table.productId),
    index("prod_loc_storage_idx").on(table.storageLocationId),
  ]
);

// ────────────────────────────────────────────────────────
// 6. COUNT ROUNDS & PLANTS
// ────────────────────────────────────────────────────────

export const countRounds = pgTable(
  "count_rounds",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull().default("MONTHLY"), // "MONTHLY" | "WEEKLY" | "RECOUNT" | "SPECIAL"
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    status: text("status").notNull().default("OPEN"), // "OPEN" | "CLOSED"
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("round_status_idx").on(table.status)]
);

export const countRoundPlants = pgTable(
  "count_round_plants",
  {
    id: text("id").primaryKey(),
    roundId: text("round_id")
      .notNull()
      .references(() => countRounds.id, { onDelete: "cascade" }),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id),
  },
  (table) => [
    uniqueIndex("round_plant_unique_idx").on(table.roundId, table.plantId),
  ]
);

// ────────────────────────────────────────────────────────
// 7. STOCK COUNTS & LOCATION DETAILS
// ────────────────────────────────────────────────────────

export const stockCounts = pgTable(
  "stock_counts",
  {
    id: text("id").primaryKey(),
    roundId: text("round_id")
      .notNull()
      .references(() => countRounds.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    previousQuantity: integer("previous_quantity").notNull().default(0),
    countedQuantity: integer("counted_quantity").notNull().default(0),
    difference: integer("difference").notNull().default(0),
    status: text("status").notNull().default("DRAFT"), // "DRAFT" | "SUBMITTED"
    note: text("note"),
    submittedAt: timestamp("submitted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("stock_count_round_idx").on(table.roundId),
    index("stock_count_prod_idx").on(table.productId),
    index("stock_count_user_idx").on(table.userId),
    index("stock_count_status_idx").on(table.status),
    index("stock_count_submitted_idx").on(table.submittedAt),
    index("stock_count_round_prod_idx").on(table.roundId, table.productId),
  ]
);

export const stockCountLocations = pgTable(
  "stock_count_locations",
  {
    id: text("id").primaryKey(),
    stockCountId: text("stock_count_id")
      .notNull()
      .references(() => stockCounts.id, { onDelete: "cascade" }),
    storageLocationId: text("storage_location_id").references(
      () => storageLocations.id
    ),
    sourceType: text("source_type").notNull().default("MASTER"), // "MASTER" | "OBSERVED_NEW"
    zone: text("zone").notNull().default("Zone A"),
    lockCode: text("lock_code").notNull(),
    rowCode: text("row_code").notNull(),
    previousQuantity: integer("previous_quantity").notNull().default(0),
    countedQuantity: integer("counted_quantity").notNull().default(0),
    difference: integer("difference").notNull().default(0),
    observationStatus: text("observation_status").notNull().default("FOUND"), // "FOUND" | "MOVED" | "NOT_FOUND" | "NEW_LOCATION"
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("sc_loc_count_idx").on(table.stockCountId),
    index("sc_loc_storage_idx").on(table.storageLocationId),
    index("sc_loc_lock_row_idx").on(table.lockCode, table.rowCode),
  ]
);

// ────────────────────────────────────────────────────────
// 8. STOCK ADJUSTMENTS (ADMIN)
// ────────────────────────────────────────────────────────

export const stockAdjustments = pgTable(
  "stock_adjustments",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    stockCountId: text("stock_count_id"),
    adminUserId: text("admin_user_id")
      .notNull()
      .references(() => user.id),
    oldQuantity: integer("old_quantity").notNull(),
    newQuantity: integer("new_quantity").notNull(),
    difference: integer("difference").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("adjustment_product_idx").on(table.productId),
    index("adjustment_admin_idx").on(table.adminUserId),
    index("adjustment_date_idx").on(table.createdAt),
  ]
);

// ────────────────────────────────────────────────────────
// 9. DRIZZLE RELATIONS
// ────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [user.id],
    references: [profiles.userId],
  }),
  sessions: many(session),
  accounts: many(account),
  stockCounts: many(stockCounts),
  adjustments: many(stockAdjustments),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(user, {
    fields: [profiles.userId],
    references: [user.id],
  }),
  plant: one(plants, {
    fields: [profiles.plantId],
    references: [plants.id],
  }),
}));

export const plantsRelations = relations(plants, ({ many }) => ({
  products: many(products),
  storageLocations: many(storageLocations),
  roundPlants: many(countRoundPlants),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  plant: one(plants, {
    fields: [products.plantId],
    references: [plants.id],
  }),
  stockUnit: one(units, {
    fields: [products.stockUnitId],
    references: [units.id],
  }),
  locations: many(productLocations),
  stockCounts: many(stockCounts),
  adjustments: many(stockAdjustments),
}));

export const storageLocationsRelations = relations(storageLocations, ({ one, many }) => ({
  plant: one(plants, {
    fields: [storageLocations.plantId],
    references: [plants.id],
  }),
  productLocations: many(productLocations),
}));

export const productLocationsRelations = relations(productLocations, ({ one }) => ({
  product: one(products, {
    fields: [productLocations.productId],
    references: [products.id],
  }),
  storageLocation: one(storageLocations, {
    fields: [productLocations.storageLocationId],
    references: [storageLocations.id],
  }),
}));

export const countRoundsRelations = relations(countRounds, ({ many }) => ({
  plants: many(countRoundPlants),
  stockCounts: many(stockCounts),
}));

export const countRoundPlantsRelations = relations(countRoundPlants, ({ one }) => ({
  round: one(countRounds, {
    fields: [countRoundPlants.roundId],
    references: [countRounds.id],
  }),
  plant: one(plants, {
    fields: [countRoundPlants.plantId],
    references: [plants.id],
  }),
}));

export const stockCountsRelations = relations(stockCounts, ({ one, many }) => ({
  round: one(countRounds, {
    fields: [stockCounts.roundId],
    references: [countRounds.id],
  }),
  product: one(products, {
    fields: [stockCounts.productId],
    references: [products.id],
  }),
  user: one(user, {
    fields: [stockCounts.userId],
    references: [user.id],
  }),
  locations: many(stockCountLocations),
}));

export const stockCountLocationsRelations = relations(stockCountLocations, ({ one }) => ({
  stockCount: one(stockCounts, {
    fields: [stockCountLocations.stockCountId],
    references: [stockCounts.id],
  }),
  storageLocation: one(storageLocations, {
    fields: [stockCountLocations.storageLocationId],
    references: [storageLocations.id],
  }),
}));

export const stockAdjustmentsRelations = relations(stockAdjustments, ({ one }) => ({
  product: one(products, {
    fields: [stockAdjustments.productId],
    references: [products.id],
  }),
  adminUser: one(user, {
    fields: [stockAdjustments.adminUserId],
    references: [user.id],
  }),
}));
