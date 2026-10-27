import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db, schema } from "../src/db";
import { count, eq } from "drizzle-orm";

const PROD_URL = "https://store-app2.vercel.app";

async function verifyLiveProduction() {
  console.log("==================================================");
  console.log(`VERIFYING LIVE PRODUCTION: ${PROD_URL}`);
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      throw new Error(`Verification failed: ${testName}`);
    }
  }

  // 1. Fetch Root Page (Unauthenticated Visitor)
  console.log("\n--- 1. Testing Unauthenticated Visitor Landing Page ---");
  const resRoot = await fetch(PROD_URL, {
    headers: {
      "User-Agent": "ProductionVerifier/1.0",
    },
  });

  assert(resRoot.status === 200, "Root page returns HTTP 200");
  const html = await resRoot.text();

  assert(html.includes("เข้าสู่ระบบ"), "Page renders Login Screen ('เข้าสู่ระบบ')");
  assert(html.includes("KCON") || html.includes("ขอนแก่นผลิตภัณฑ์คอนกรีต"), "Page displays KCON branding");
  assert(!html.includes("วิชัย สุวรรณโชติ"), "ZERO mock user 'วิชัย สุวรรณโชติ' on initial load");
  assert(!html.includes("สมชาย ใจมั่นคง"), "ZERO mock user 'สมชาย ใจมั่นคง' on initial load");
  assert(!html.includes("นิตยา รักษ์พงษ์"), "ZERO mock user 'นิตยา รักษ์พงษ์' on initial load");
  assert(!html.includes("สมพร ทรัพย์ประเสริฐ"), "ZERO mock user 'สมพร ทรัพย์ประเสริฐ' on initial load");
  assert(!html.includes("ชัยวัฒน์ (หัวหน้าคลัง)"), "ZERO mock user 'ชัยวัฒน์' on initial load");

  // 2. Test Staff Authentication (pcryclc / Jib1105t)
  console.log("\n--- 2. Testing Staff Authentication (pcryclc / Jib1105t) ---");
  const staffRes = await fetch(`${PROD_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: PROD_URL,
    },
    body: JSON.stringify({
      email: "pcryclc@kcon.co.th",
      password: "Jib1105t",
    }),
  });

  assert(staffRes.status === 200, "Staff sign-in returns HTTP 200 OK");
  const staffData = await staffRes.json();
  assert(staffData?.user?.email === "pcryclc@kcon.co.th", "Staff email verified as pcryclc@kcon.co.th");
  assert(staffData?.user?.role === "STAFF", "Staff role verified as STAFF");
  assert(Boolean(staffData?.token || staffRes.headers.get("set-cookie")), "Staff session cookie issued");

  // 3. Test Admin Authentication (admin / Admin@2026)
  console.log("\n--- 3. Testing Admin Authentication (admin / Admin@2026) ---");
  const adminRes = await fetch(`${PROD_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: PROD_URL,
    },
    body: JSON.stringify({
      email: "admin@kcon.co.th",
      password: "Admin@2026",
    }),
  });

  assert(adminRes.status === 200, "Admin sign-in returns HTTP 200 OK");
  const adminData = await adminRes.json();
  assert(adminData?.user?.email === "admin@kcon.co.th", "Admin email verified as admin@kcon.co.th");
  assert(adminData?.user?.role === "ADMIN", "Admin role verified as ADMIN");
  assert(Boolean(adminData?.token || adminRes.headers.get("set-cookie")), "Admin session cookie issued");

  // 4. Test Invalid Credentials Rejection
  console.log("\n--- 4. Testing Invalid Password Security ---");
  const failRes = await fetch(`${PROD_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: PROD_URL,
    },
    body: JSON.stringify({
      email: "admin@kcon.co.th",
      password: "WrongPassword999!",
    }),
  });

  assert(!failRes.ok, "Invalid password rejected with non-200 HTTP code");

  // 5. Database State Verification (Neon PostgreSQL)
  console.log("\n--- 5. Verifying Neon PostgreSQL Production Database State ---");
  if (!db) {
    throw new Error("DATABASE_URL not configured for DB check");
  }

  // Count users
  const [userCountRes] = await db.select({ count: count() }).from(schema.user);
  assert(Number(userCountRes.count) === 2, `Exactly 2 users exist in DB (found: ${userCountRes.count})`);

  // Count products
  const [productCountRes] = await db.select({ count: count() }).from(schema.products);
  assert(Number(productCountRes.count) === 64, `All 64 real KCON product SKUs exist in DB (found: ${productCountRes.count})`);

  // Count test records (Must be 0!)
  const [countRecordsRes] = await db.select({ count: count() }).from(schema.stockCounts);
  assert(Number(countRecordsRes.count) === 0, `ZERO test count records in DB (found: ${countRecordsRes.count})`);

  const [adjRecordsRes] = await db.select({ count: count() }).from(schema.stockAdjustments);
  assert(Number(adjRecordsRes.count) === 0, `ZERO test adjustment records in DB (found: ${adjRecordsRes.count})`);

  // Active round
  const [openRound] = await db
    .select()
    .from(schema.countRounds)
    .where(eq(schema.countRounds.status, "OPEN"))
    .limit(1);

  assert(Boolean(openRound), "Fresh active round is OPEN");
  assert(openRound.name.includes("KCON"), `Round name includes KCON ('${openRound.name}')`);

  console.log("\n==================================================");
  console.log(`PRODUCTION VERIFICATION COMPLETE: ${passed}/${total} PASSED (100%)`);
  console.log("==================================================");
}

verifyLiveProduction()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  });
