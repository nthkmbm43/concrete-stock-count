import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db, schema } from "../src/db";

async function inspect() {
  if (!db) {
    console.error("No database connection");
    return;
  }
  const users = await db.select().from(schema.user);
  console.log("Users in DB:", users);

  const profiles = await db.select().from(schema.profiles);
  console.log("Profiles in DB:", profiles);

  const rounds = await db.select().from(schema.countRounds);
  console.log("Rounds in DB:", rounds);

  const productsCount = await db.select().from(schema.products);
  console.log(`Products in DB: ${productsCount.length} rows`);

  const countsCount = await db.select().from(schema.stockCounts);
  console.log(`StockCounts in DB: ${countsCount.length} rows`);
}

inspect()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
