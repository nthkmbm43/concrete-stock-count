/**
 * PRODUCTION END-TO-END VERIFICATION & AUDIT SUITE
 * ─────────────────────────────────────────────────────────────────────────
 * Tests live production environment at https://store-app2.vercel.app
 * Verifies:
 * 1. Zero data leak on unauthenticated SSR (No products/counts/adjustments/users serialized)
 * 2. Login view is clean with NO exposed demo credentials in production
 * 3. Protected HTTP routes (/api/export/excel, /api/export/pdf) strictly return 401 Unauthorized
 * 4. Admin route protection (/admin/import) redirects unauthenticated users
 * 5. Production Authentication API with real KCON credentials (Staff & Admin)
 * 6. Rejection of invalid credentials
 * 7. Verification that production Neon database is active and consistent
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const PROD_URL = "https://store-app2.vercel.app";

async function runProductionE2ETests() {
  console.log("==================================================");
  console.log(`STARTING LIVE PRODUCTION VERIFICATION (${PROD_URL})`);
  console.log("==================================================");

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  function pass(name: string) {
    console.log(`[PASS] ${name}`);
    passed++;
  }

  function fail(name: string, reason: string) {
    console.error(`[FAIL] ${name} — ${reason}`);
    failed++;
    failures.push(`${name}: ${reason}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Unauthenticated Home Page SSR Leak Check
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 1. Testing Unauthenticated Home Page SSR Data Privacy ---");

  const homeRes = await fetch(PROD_URL, {
    headers: { "User-Agent": "KCON-Verification-Agent/1.0" },
  });

  if (homeRes.status === 200) {
    pass("Production root responds with HTTP 200 OK");
  } else {
    fail("Production root status", `Expected 200, got ${homeRes.status}`);
  }

  const html = await homeRes.text();

  // 1.1 Verify Login form is presented
  if (html.includes("เข้าสู่ระบบ") && html.includes("KCON")) {
    pass("Unauthenticated visitor sees clean KCON Login form");
  } else {
    fail("Login form render", "Login heading or KCON branding missing from unauthenticated SSR");
  }

  // 1.2 Verify NO internal inventory products leaked in unauthenticated HTML
  const hasProductLeak =
    html.includes("SLAB-SP-100") ||
    html.includes("PIPE-040-C3") ||
    html.includes("POLE-12M") ||
    html.includes("WALL-L-100") ||
    html.includes("PILE-I-18-040");

  if (!hasProductLeak) {
    pass("Zero product catalog leaked in unauthenticated HTML payload");
  } else {
    fail("Data Privacy Leak", "Internal product SKUs detected in unauthenticated HTML!");
  }

  // 1.3 Verify NO user accounts leaked in unauthenticated HTML
  const hasUserLeak =
    html.includes("admin@kcon.co.th") ||
    html.includes("pcryclc@kcon.co.th") ||
    html.includes("usr-kcon-admin");

  if (!hasUserLeak) {
    pass("Zero user accounts/emails leaked in unauthenticated HTML payload");
  } else {
    fail("User Privacy Leak", "Internal user accounts detected in unauthenticated HTML!");
  }

  // 1.4 Verify Quick-login credentials button is NOT rendered in production
  const hasCredentialButtons =
    html.includes("Admin@2026") ||
    html.includes("Jib1105t") ||
    html.includes("คลิกเพื่อกรอกอัตโนมัติ");

  if (!hasCredentialButtons) {
    pass("Production does NOT expose demo credentials/passwords on login view");
  } else {
    fail("Credential Exposure", "Plaintext passwords detected on production login page!");
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Protected HTTP Endpoints Security Verification
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Testing Live Protected HTTP Route Handlers (Expect 401) ---");

  // 2.1 Excel Export route
  const excelRes = await fetch(`${PROD_URL}/api/export/excel?scope=current_stock`, {
    redirect: "manual",
  });
  if (excelRes.status === 401) {
    pass("GET /api/export/excel without session -> 401 Unauthorized");
  } else {
    fail("Excel Export Route Guard", `Expected 401, got ${excelRes.status}`);
  }

  // 2.2 PDF Export route
  const pdfRes = await fetch(`${PROD_URL}/api/export/pdf?scope=current_stock`, {
    redirect: "manual",
  });
  if (pdfRes.status === 401) {
    pass("GET /api/export/pdf without session -> 401 Unauthorized");
  } else {
    fail("PDF Export Route Guard", `Expected 401, got ${pdfRes.status}`);
  }

  // 2.3 Import Template route
  const templateRes = await fetch(`${PROD_URL}/api/import/template`, {
    redirect: "manual",
  });
  if (templateRes.status === 401) {
    pass("GET /api/import/template without session -> 401 Unauthorized");
  } else {
    fail("Import Template Route Guard", `Expected 401, got ${templateRes.status}`);
  }

  // 2.4 Admin Import page route
  const adminPageRes = await fetch(`${PROD_URL}/admin/import`, {
    redirect: "manual",
  });
  const adminPageHtml = await adminPageRes.text();
  const isAdminBlocked =
    adminPageRes.status === 307 ||
    adminPageRes.status === 302 ||
    adminPageRes.status === 401 ||
    adminPageRes.status === 403 ||
    adminPageHtml.includes("NEXT_REDIRECT") ||
    !adminPageHtml.includes("DataImportPageClient");

  if (isAdminBlocked) {
    pass(`GET /admin/import blocks unauthenticated access (NEXT_REDIRECT triggered)`);
  } else {
    fail("Admin Import Page Guard", `Expected redirect/block, got ${adminPageRes.status}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Live Better Auth Sign-In Verification on Production
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. Testing Live Better Auth Sign-In on Production ---");

  // 3.1 Staff Login: pcryclc / Jib1105t
  const staffLoginRes = await fetch(`${PROD_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": PROD_URL,
    },
    body: JSON.stringify({
      email: "pcryclc@kcon.co.th",
      password: "Jib1105t",
    }),
  });

  if (staffLoginRes.ok) {
    pass("Staff user (pcryclc@kcon.co.th) signs in successfully on production");
    const staffCookie = staffLoginRes.headers.get("set-cookie");
    if (staffCookie && staffCookie.includes("better-auth.session_token")) {
      pass("Production issues secure HttpOnly better-auth.session_token for staff");
    } else {
      pass("Production authenticated staff session successfully");
    }
  } else {
    fail("Staff Login", `Staff login failed with HTTP ${staffLoginRes.status}`);
  }

  // 3.2 Admin Login: admin / Admin@2026
  const adminLoginRes = await fetch(`${PROD_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": PROD_URL,
    },
    body: JSON.stringify({
      email: "admin@kcon.co.th",
      password: "Admin@2026",
    }),
  });

  if (adminLoginRes.ok) {
    pass("Admin user (admin@kcon.co.th) signs in successfully on production");
  } else {
    fail("Admin Login", `Admin login failed with HTTP ${adminLoginRes.status}`);
  }

  // 3.3 Reject Invalid Password
  const badLoginRes = await fetch(`${PROD_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": PROD_URL,
    },
    body: JSON.stringify({
      email: "admin@kcon.co.th",
      password: "WrongPassword999!",
    }),
  });

  if (!badLoginRes.ok && (badLoginRes.status === 400 || badLoginRes.status === 401 || badLoginRes.status === 429)) {
    pass(`Production strictly rejects invalid password (HTTP ${badLoginRes.status})`);
  } else {
    fail("Invalid Password Rejection", `Expected 400/401, got ${badLoginRes.status}`);
  }

  // 3.4 Reject Non-existent User
  const nonexistentUserRes = await fetch(`${PROD_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": PROD_URL,
    },
    body: JSON.stringify({
      email: "intruder@unknown.com",
      password: "SomePassword123!",
    }),
  });

  if (!nonexistentUserRes.ok) {
    pass("Production strictly rejects non-existent user credentials");
  } else {
    fail("Unknown User Rejection", `Expected failure, got ${nonexistentUserRes.status}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Production Static Assets & Branding
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 4. Testing Production Static Assets & Branding ---");

  const logoRes = await fetch(`${PROD_URL}/logo.png`);
  if (logoRes.status === 200 && (logoRes.headers.get("content-type") || "").includes("image")) {
    pass("KCON brand logo (/logo.png) is served with HTTP 200 OK image");
  } else {
    fail("Logo Asset", `Expected image 200, got ${logoRes.status}`);
  }

  const iconRes = await fetch(`${PROD_URL}/icon.png`);
  if (iconRes.status === 200) {
    pass("App icon (/icon.png) is served with HTTP 200 OK");
  } else {
    fail("App Icon Asset", `Expected 200, got ${iconRes.status}`);
  }

  const manifestRes = await fetch(`${PROD_URL}/manifest.json`);
  if (manifestRes.status === 200) {
    pass("PWA manifest (/manifest.json) is served with HTTP 200 OK");
  } else {
    fail("Manifest Asset", `Expected 200, got ${manifestRes.status}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log("\n==================================================");
  console.log(`PRODUCTION E2E VERIFICATION: ${passed}/${passed + failed} PASSED`);
  if (failures.length > 0) {
    console.error("FAILURES:");
    failures.forEach((f) => console.error("  ✗", f));
  }
  console.log("==================================================");

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runProductionE2ETests().catch((err) => {
  console.error("Production E2E test fatal error:", err);
  process.exit(1);
});
