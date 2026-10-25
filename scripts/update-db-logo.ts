import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db, schema } from "../src/db";
import { eq } from "drizzle-orm";

async function updateLogoUrl() {
  if (!db) {
    console.error("Database connection not configured.");
    return;
  }

  console.log("Updating companySettings logoUrl to /logo.png in Neon DB...");
  const result = await db
    .update(schema.companySettings)
    .set({
      logoUrl: "/logo.png",
      updatedAt: new Date(),
    })
    .where(eq(schema.companySettings.id, "default"))
    .returning();

  console.log("Updated companySettings:", result);
}

updateLogoUrl()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Update failed:", err.message);
    process.exit(1);
  });
