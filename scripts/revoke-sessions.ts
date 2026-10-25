import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db, schema } from "../src/db";
import { inArray } from "drizzle-orm";

export async function revokeAllDemoSessions() {
  if (!db) {
    console.error("Database connection not configured.");
    return { success: false, revokedCount: 0 };
  }

  // Identify demo user IDs
  const demoUserIds = ["user-admin", "user-1", "user-2", "user-3", "user-4"];

  // Query existing sessions for these users
  const existingSessions = await db
    .select({ id: schema.session.id, userId: schema.session.userId })
    .from(schema.session)
    .where(inArray(schema.session.userId, demoUserIds));

  const count = existingSessions.length;

  if (count > 0) {
    // Delete session records securely
    await db
      .delete(schema.session)
      .where(inArray(schema.session.userId, demoUserIds));
    console.log(`[REVOKED] Successfully revoked ${count} active demo sessions from database.`);
  } else {
    console.log("[INFO] No active demo sessions found to revoke.");
  }

  return { success: true, revokedCount: count };
}

// Allow direct CLI execution
if (process.argv[1]?.includes("revoke-sessions")) {
  revokeAllDemoSessions()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Failed to revoke sessions:", err.message);
      process.exit(1);
    });
}
