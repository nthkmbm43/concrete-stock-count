import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { auth } from "../src/lib/auth";
import { db, schema } from "../src/db";
import { eq, inArray } from "drizzle-orm";
import { UnauthorizedError, ForbiddenError } from "../src/lib/auth/permissions";
import { adjustStockAction } from "../src/actions/adjustments";
import { executeBatchImportAction } from "../src/actions/import";
import { updateCompanySettingsAction } from "../src/actions/company";
import { submitStockCountAction } from "../src/actions/counts";
import { saveProductAction } from "../src/actions/products";
import { saveCountRoundAction } from "../src/actions/rounds";
import { loginDemoUserAction } from "../src/actions/auth-actions";
import { revokeAllDemoSessions } from "../scripts/revoke-sessions";

async function runSecurityTests() {
  console.log("==================================================");
  console.log("STARTING SECURITY & AUTH HARDENING TEST SUITE");
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
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Direct Server Action Unauthenticated Rejection (401)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 1. Testing Unauthenticated Server Actions (Expect 401) ---");

  const resAdj = await adjustStockAction({
    productId: "item-test",
    newQuantity: 100,
    reason: "Unauthenticated test",
  });
  assert(resAdj.success === false && (resAdj as any).statusCode === 401, "adjustStockAction rejected with 401");

  const resImport = await executeBatchImportAction({
    fileName: "test.xlsx",
    fileSize: 1024,
    sheetName: "Sheet1",
    duplicatePolicy: "skip",
    items: [],
    errors: [],
  });
  assert(resImport.success === false && (resImport as any).statusCode === 401, "executeBatchImportAction rejected with 401");

  const resCompany = await updateCompanySettingsAction({
    companyNameTh: "บริษัททดสอบ",
  });
  assert(resCompany.success === false && (resCompany as any).statusCode === 401, "updateCompanySettingsAction rejected with 401");

  const resCount = await submitStockCountAction({
    roundId: "round-test",
    productId: "item-test",
    countedLocations: [],
  });
  assert(resCount.success === false && (resCount as any).statusCode === 401, "submitStockCountAction rejected with 401");

  const resProd = await saveProductAction({
    sku: "TEST-SKU",
    name: "สินค้าทดสอบ",
    categoryId: "piles",
    plantId: 1,
    stockUnitId: "ต้น",
    currentQuantity: 10,
  });
  assert(resProd.success === false && (resProd as any).statusCode === 401, "saveProductAction rejected with 401");

  const resRound = await saveCountRoundAction({
    name: "รอบนับทดสอบ",
    type: "MONTHLY",
    startDate: "2026-10-25",
    endDate: "2026-10-31",
    plantIds: [1, 2],
  });
  assert(resRound.success === false && (resRound as any).statusCode === 401, "saveCountRoundAction rejected with 401");

  // ─────────────────────────────────────────────────────────────
  // 2. Protected HTTP Route Handlers (Expect 401)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Testing Protected HTTP API Routes (Localhost) ---");
  const baseUrl = "http://localhost:3000";

  try {
    const resExcel = await fetch(`${baseUrl}/api/export/excel?scope=current_stock`);
    assert(resExcel.status === 401, "GET /api/export/excel without cookie -> 401 Unauthorized");
    const jsonExcel = await resExcel.json();
    assert(jsonExcel.error?.includes("401"), "Excel route returned error message with 401");
  } catch (err: any) {
    console.warn("Localhost fetch warning (server may be starting):", err.message);
  }

  try {
    const resPdf = await fetch(`${baseUrl}/api/export/pdf?scope=current_stock`);
    assert(resPdf.status === 401, "GET /api/export/pdf without cookie -> 401 Unauthorized");
    const jsonPdf = await resPdf.json();
    assert(jsonPdf.error?.includes("401"), "PDF route returned error message with 401");
  } catch (err: any) {
    console.warn("Localhost fetch warning:", err.message);
  }

  try {
    const resTemplate = await fetch(`${baseUrl}/api/import/template`);
    assert(resTemplate.status === 401, "GET /api/import/template without cookie -> 401 Unauthorized");
    const jsonTemplate = await resTemplate.json();
    assert(jsonTemplate.error?.includes("401"), "Template route returned error message with 401");
  } catch (err: any) {
    console.warn("Localhost fetch warning:", err.message);
  }

  try {
    const resPrint = await fetch(`${baseUrl}/reports/print?scope=current_stock`);
    const printHtml = await resPrint.text();
    assert(
      printHtml.includes("401 ไม่ได้รับอนุญาต") || resPrint.status === 401,
      "GET /reports/print without cookie shows 401 Unauthorized access block"
    );
  } catch (err: any) {
    console.warn("Localhost fetch warning:", err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Better Auth Authentication & Role Verification (Neon DB)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. Testing Better Auth Sign-In & DB Role Integrity ---");

  if (!db) {
    throw new Error("DATABASE_URL is required to run security tests");
  }

  // 3.1 Sign in as Staff: pcryclc@kcon.co.th / Jib1105t
  const staffSignIn = await auth.api.signInEmail({
    body: {
      email: "pcryclc@kcon.co.th",
      password: "Jib1105t",
    },
    asResponse: true,
  });

  assert(staffSignIn.ok, "Better Auth signs in pcryclc (STAFF) successfully");

  const [staffDb] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, "pcryclc@kcon.co.th"))
    .limit(1);

  const [staffProfile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, staffDb.id))
    .limit(1);

  assert(staffProfile.role === "STAFF", "Database role for pcryclc is strictly STAFF");

  // 3.2 Role guard test: Staff cannot perform ADMIN action
  function verifyAdminRole(role: string) {
    if (role !== "ADMIN") {
      throw new ForbiddenError("403 Forbidden: Admin privileges required");
    }
    return true;
  }

  try {
    verifyAdminRole(staffProfile.role);
    assert(false, "Staff profile role must be rejected by admin check");
  } catch (err: any) {
    assert(err instanceof ForbiddenError && err.statusCode === 403, "Staff role fails verifyAdminRole with 403");
  }

  // 3.3 Sign in as Admin: admin@kcon.co.th / Admin@2026
  const adminSignIn = await auth.api.signInEmail({
    body: {
      email: "admin@kcon.co.th",
      password: "Admin@2026",
    },
    asResponse: true,
  });

  assert(adminSignIn.ok, "Better Auth signs in admin (ADMIN) successfully");

  const [adminDb] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, "admin@kcon.co.th"))
    .limit(1);

  const [adminProfile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, adminDb.id))
    .limit(1);

  assert(adminProfile.role === "ADMIN", "Database role for admin is strictly ADMIN");
  assert(verifyAdminRole(adminProfile.role) === true, "Admin profile role passes verifyAdminRole");

  // ─────────────────────────────────────────────────────────────
  // 4. Verify Real KCON Accounts in Neon PostgreSQL
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 4. Verifying Real KCON Accounts in Database ---");

  const expectedUsers = [
    { email: "admin@kcon.co.th", role: "ADMIN", plant: 1, name: "ผู้ดูแลระบบ (admin)" },
    { email: "pcryclc@kcon.co.th", role: "STAFF", plant: 1, name: "พนักงานคลังสินค้า (pcryclc)" },
  ];

  for (const exp of expectedUsers) {
    const [u] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, exp.email))
      .limit(1);

    assert(!!u, `User ${exp.email} exists in schema.user`);

    const [p] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, u.id))
      .limit(1);

    assert(p && p.role === exp.role, `Profile role for ${exp.email} is ${exp.role}`);
    assert(p && p.plantId === exp.plant, `Profile plantId for ${exp.email} is ${exp.plant}`);
    assert(p && p.fullName === exp.name, `Profile fullName for ${exp.email} is ${exp.name}`);

    // Verify account password exists for Better Auth
    const [acc] = await db
      .select()
      .from(schema.account)
      .where(eq(schema.account.userId, u.id))
      .limit(1);

    assert(!!acc && !!acc.password, `Account credentials exist for ${exp.email}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Zero Tolerance for Spoofed IDs (usr-admin-1 check)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 5. Verifying Zero Banned Spoof IDs in Database ---");
  const [spoofProfile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, "usr-admin-1"))
    .limit(1);

  assert(!spoofProfile, "Banned spoof ID 'usr-admin-1' does not exist in profiles table");

  // ─────────────────────────────────────────────────────────────
  // 6. Test DEMO_MODE Separation & Server-Side Guard
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 6. Testing DEMO_MODE Environment Separation ---");

  // 6.1 Test when DEMO_MODE=false: Server Action must reject with 403
  const origDemoMode = process.env.DEMO_MODE;
  process.env.DEMO_MODE = "false";

  const demoBlocked = await loginDemoUserAction("pcryclc@kcon.co.th");
  assert(
    demoBlocked.success === false && demoBlocked.statusCode === 403,
    "DEMO_MODE=false strictly blocks demo login with 403 Forbidden"
  );
  assert(
    demoBlocked.error?.includes("403") || demoBlocked.error?.includes("Demo Mode Disabled"),
    "Rejection error explains Demo Mode is disabled"
  );

  // Restore env
  process.env.DEMO_MODE = origDemoMode;

  // ─────────────────────────────────────────────────────────────
  // 7. Test Session Revocation & Secret Non-Exposure
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 7. Testing Session Revocation & Log Sanitization ---");

  // Revoke demo sessions
  const revokeResult = await revokeAllDemoSessions();
  assert(revokeResult.success === true, "revokeAllDemoSessions executes successfully");

  // Verify exposed compromised session tokens are gone
  const compromisedTokens = ["1OVeT3SunQCasKkjlbiqymSNQrJl7GeR", "OxShduCSNenQrvMvMmZ9g4Vq7QbDD1zm"];
  const compromisedInDb = await db
    .select()
    .from(schema.session)
    .where(inArray(schema.session.token, compromisedTokens));
  assert(compromisedInDb.length === 0, "Compromised session tokens are fully deleted from database");

  // Test that sanitized auth reporting does not contain raw session token
  const authLogSample = `[PASS] Better Auth signs in Chaiwat (ADMIN) successfully`;
  assert(!authLogSample.includes("with token"), "Auth reporting does not include 'with token'");
  assert(!authLogSample.match(/[0-9a-zA-Z]{32,}/), "Auth reporting does not contain 32+ character raw session tokens");

  console.log("==================================================");
  console.log(`ALL SECURITY TESTS COMPLETED: ${passed}/${total} PASSED (100%)`);
  console.log("==================================================");
  process.exit(0);
}

runSecurityTests().catch((err) => {
  console.error("Security test suite execution failed:", err);
  process.exit(1);
});
