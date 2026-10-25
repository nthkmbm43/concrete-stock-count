import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

// Optional: for environments using WebSocket or local development
export const isDatabaseConfigured = Boolean(
  connectionString &&
    connectionString.startsWith("postgres") &&
    !connectionString.includes("placeholder")
);

export const pool = isDatabaseConfigured
  ? new Pool({ connectionString })
  : null;

export const db = pool ? drizzle(pool, { schema }) : null;

export { schema };
