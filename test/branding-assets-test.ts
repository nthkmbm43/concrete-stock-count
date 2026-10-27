import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import fs from "fs";
import path from "path";
import { getCompanySettings, DEFAULT_KCON_COMPANY_SETTINGS } from "../src/db/queries/company";

async function runBrandingAssetsTests() {
  console.log("==================================================");
  console.log("STARTING BRANDING & ASSETS INTEGRITY UNIT TESTS");
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
  // 1. Verifiable Company Profile & Defaults
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 1. Testing Company Settings & Defaults ---");

  const company = await getCompanySettings();

  assert(company.brandName === "KCON", "Brand name is 'KCON'");
  assert(company.companyNameTh === "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด", "Company Thai name matches KCON verifiable data");
  assert(company.companyNameEn === "KHON KAEN CONCRETE PRODUCT CO., LTD.", "Company English name matches KCON verifiable data");
  assert(company.phone === "043-255-111", "Phone matches KCON office telephone");
  assert(company.email === "kcon.eng@gmail.com", "Email matches KCON public contact");
  assert(company.website === "www.kcon-concrete.com", "Website matches KCON official portal");
  assert(company.logoUrl === "/logo.png", "Default logoUrl points to '/logo.png'");
  assert(DEFAULT_KCON_COMPANY_SETTINGS.logoUrl === "/logo.png", "DEFAULT_KCON_COMPANY_SETTINGS specifies '/logo.png'");

  // ─────────────────────────────────────────────────────────────
  // 2. Physical File Presence & Binary Signature Validation
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Testing Logo, Favicon & App Icon Files ---");

  const cwd = process.cwd();

  // Helper function to check PNG signature
  function isPng(filePath: string): boolean {
    if (!fs.existsSync(filePath)) return false;
    const buf = fs.readFileSync(filePath);
    return (
      buf.length > 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    );
  }

  // Helper function to check ICO signature
  function isIco(filePath: string): boolean {
    if (!fs.existsSync(filePath)) return false;
    const buf = fs.readFileSync(filePath);
    return (
      buf.length > 6 &&
      buf[0] === 0x00 &&
      buf[1] === 0x00 &&
      buf[2] === 0x01 &&
      buf[3] === 0x00
    );
  }

  // 1. Logo
  const logoPath = path.join(cwd, "public", "logo.png");
  assert(fs.existsSync(logoPath), "public/logo.png exists");
  assert(isPng(logoPath), "public/logo.png is a valid PNG file");
  assert(fs.statSync(logoPath).size > 50000, "public/logo.png has substantial resolution (> 50KB)");

  // 2. Original Logo Backup
  const logoOriginalPath = path.join(cwd, "public", "logo-original.png");
  assert(fs.existsSync(logoOriginalPath), "public/logo-original.png exists as raw backup");

  // 3. Multi-resolution Favicons
  const pubIcoPath = path.join(cwd, "public", "favicon.ico");
  assert(fs.existsSync(pubIcoPath), "public/favicon.ico exists");
  assert(isIco(pubIcoPath), "public/favicon.ico has valid ICO signature");

  const appIcoPath = path.join(cwd, "src", "app", "favicon.ico");
  assert(fs.existsSync(appIcoPath), "src/app/favicon.ico exists");
  assert(isIco(appIcoPath), "src/app/favicon.ico has valid ICO signature");

  // 4. Next.js App Router Metadata Icons
  const appIconPath = path.join(cwd, "src", "app", "icon.png");
  assert(fs.existsSync(appIconPath), "src/app/icon.png exists");
  assert(isPng(appIconPath), "src/app/icon.png is a valid PNG file");

  const appAppleIconPath = path.join(cwd, "src", "app", "apple-icon.png");
  assert(fs.existsSync(appAppleIconPath), "src/app/apple-icon.png exists");
  assert(isPng(appAppleIconPath), "src/app/apple-icon.png is a valid PNG file");

  // 5. PWA Icons
  const pwa192Path = path.join(cwd, "public", "icon-192.png");
  assert(fs.existsSync(pwa192Path), "public/icon-192.png exists");
  assert(isPng(pwa192Path), "public/icon-192.png is a valid PNG file");

  const pwa512Path = path.join(cwd, "public", "icon-512.png");
  assert(fs.existsSync(pwa512Path), "public/icon-512.png exists");
  assert(isPng(pwa512Path), "public/icon-512.png is a valid PNG file");

  const appleTouchPath = path.join(cwd, "public", "apple-touch-icon.png");
  assert(fs.existsSync(appleTouchPath), "public/apple-touch-icon.png exists");
  assert(isPng(appleTouchPath), "public/apple-touch-icon.png is a valid PNG file");

  // ─────────────────────────────────────────────────────────────
  // 3. Manifest & Root Layout Metadata Integrity
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. Testing PWA Manifest & Layout Metadata ---");

  const manifestPath = path.join(cwd, "public", "manifest.json");
  assert(fs.existsSync(manifestPath), "public/manifest.json exists");

  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  assert(manifestContent.short_name === "ConcreteStock", "Manifest short_name is 'ConcreteStock'");
  assert(Array.isArray(manifestContent.icons), "Manifest icons is an array");
  assert(
    manifestContent.icons.some((i: any) => i.src === "/icon-192.png" && i.sizes === "192x192"),
    "Manifest references /icon-192.png"
  );
  assert(
    manifestContent.icons.some((i: any) => i.src === "/icon-512.png" && i.sizes === "512x512"),
    "Manifest references /icon-512.png"
  );

  const layoutPath = path.join(cwd, "src", "app", "layout.tsx");
  const layoutCode = fs.readFileSync(layoutPath, "utf-8");
  assert(layoutCode.includes("/favicon.ico"), "src/app/layout.tsx references /favicon.ico");
  assert(layoutCode.includes("/logo.png"), "src/app/layout.tsx references /logo.png");
  assert(layoutCode.includes("/icon-192.png"), "src/app/layout.tsx references /icon-192.png");
  assert(layoutCode.includes("/apple-icon.png"), "src/app/layout.tsx references /apple-icon.png");

  console.log("\n==================================================");
  console.log(`ALL BRANDING & ASSETS TESTS COMPLETED: ${passed}/${total} PASSED (100%)`);
  console.log("==================================================");
}

runBrandingAssetsTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
