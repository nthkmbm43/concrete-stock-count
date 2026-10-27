import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import QRCode from "qrcode";
import { db, schema } from "../src/db";

async function runQrBarcodeTests() {
  console.log("==================================================");
  console.log("STARTING QR CODE & BARCODE SCANNER AUTOMATED TESTS");
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
  // 1. Testing QR Code Generation Engine
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 1. Testing High-Res QR Code DataURL Generation ---");
  const testSkus = [
    "SLAB-SP-100",
    "SLAB-HC-06-200",
    "PILE-I-18-040",
    "POLE-PEA-060",
    "PIPE-RC-040-2",
    "WALL-L-100",
  ];

  for (const sku of testSkus) {
    const dataUrl = await QRCode.toDataURL(sku, {
      width: 300,
      margin: 2,
    });

    assert(Boolean(dataUrl), `QR code generated for ${sku}`);
    assert(dataUrl.startsWith("data:image/png;base64,"), `DataURL format is PNG base64 for ${sku}`);
    assert(dataUrl.length > 500, `DataURL payload has sufficient image resolution (${dataUrl.length} chars)`);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Testing Scanned Text & Barcode Payload Parser
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Testing Scanned Code Extraction & Normalization ---");

  function parseScannedCode(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.sku) return String(parsed.sku).trim();
        if (parsed.id) return String(parsed.id).trim();
      } catch {}
    }
    if (trimmed.includes("sku=")) {
      try {
        const url = new URL(trimmed);
        const sku = url.searchParams.get("sku");
        if (sku) return sku.trim();
      } catch {}
    }
    if (trimmed.includes("/")) {
      const parts = trimmed.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last) return last.trim();
    }
    return trimmed;
  }

  assert(parseScannedCode("SLAB-SP-100") === "SLAB-SP-100", "Parse raw plain SKU");
  assert(parseScannedCode("  SLAB-SP-100  \n") === "SLAB-SP-100", "Trim whitespace and newlines");
  assert(parseScannedCode('{"sku":"SLAB-SP-100"}') === "SLAB-SP-100", "Parse JSON payload with sku");
  assert(parseScannedCode('{"id":"prod-kcon-sp-100"}') === "prod-kcon-sp-100", "Parse JSON payload with id");
  assert(
    parseScannedCode("https://store-app2.vercel.app/?sku=SLAB-SP-100") === "SLAB-SP-100",
    "Parse URL query parameter ?sku="
  );
  assert(
    parseScannedCode("https://store-app2.vercel.app/products/SLAB-SP-100") === "SLAB-SP-100",
    "Parse URL path /products/:sku"
  );

  // ─────────────────────────────────────────────────────────────
  // 3. Testing Product Matching Against Real Database Catalog
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. Testing Product Catalog Matching & Lookup ---");
  if (!db) {
    throw new Error("DATABASE_URL is required to run tests");
  }

  const allProducts = await db.query.products.findMany({
    with: { locations: { with: { storageLocation: true } } },
  });

  assert(allProducts.length === 64, `Database contains exactly 64 KCON products (found: ${allProducts.length})`);

  function findItemByCode(code: string) {
    const parsed = parseScannedCode(code).toLowerCase();
    const exactSku = allProducts.find((i) => i.sku.toLowerCase() === parsed);
    if (exactSku) return exactSku;
    const exactId = allProducts.find((i) => i.id.toLowerCase() === parsed);
    if (exactId) return exactId;
    const partial = allProducts.find(
      (i) =>
        i.sku.toLowerCase().includes(parsed) ||
        i.name.toLowerCase().includes(parsed)
    );
    return partial || null;
  }

  const match1 = findItemByCode("SLAB-SP-100");
  assert(match1 !== null && match1.sku === "SLAB-SP-100", "Found exact match for SLAB-SP-100");
  assert(match1?.plantId === 3, "SLAB-SP-100 belongs to Plant 3");

  const matchCaseInsensitive = findItemByCode("slab-sp-100");
  assert(matchCaseInsensitive !== null && matchCaseInsensitive.sku === "SLAB-SP-100", "Case-insensitive SKU match");

  const matchPipe = findItemByCode("PIPE-040-C3");
  assert(matchPipe !== null && matchPipe.sku === "PIPE-040-C3", "Found match for Drain Pipe 0.40m");
  assert(matchPipe?.plantId === 1, "Drain Pipe belongs to Plant 1");

  const matchPole = findItemByCode("POLE-12M");
  assert(matchPole !== null && matchPole.sku === "POLE-12M", "Found match for Electric Pole 12m");
  assert(matchPole?.plantId === 2, "Electric Pole belongs to Plant 2");

  // ─────────────────────────────────────────────────────────────
  // 4. Testing Instant Keyword Search Engine
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 4. Testing Instant Search Filtering ---");

  function searchProducts(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return allProducts.filter(
      (i) =>
        i.sku.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        (i.variant && i.variant.toLowerCase().includes(q))
    );
  }

  const searchPipes = searchProducts("ท่อ");
  assert(searchPipes.length >= 8, `Search 'ท่อ' finds multiple pipe SKUs (found: ${searchPipes.length})`);

  const searchPlank = searchProducts("Solid Plank");
  assert(searchPlank.length >= 8, `Search 'Solid Plank' finds all 8 lengths (found: ${searchPlank.length})`);

  const searchHollowCore = searchProducts("Hollow Core");
  assert(searchHollowCore.length >= 6, `Search 'Hollow Core' finds all thicknesses (found: ${searchHollowCore.length})`);

  const searchPiles = searchProducts("เสาเข็ม");
  assert(searchPiles.length >= 10, `Search 'เสาเข็ม' finds I-Piles & Square Piles (found: ${searchPiles.length})`);

  const searchByExactSkuPrefix = searchProducts("L-WALL");
  assert(searchByExactSkuPrefix.length >= 4, `Search 'L-WALL' finds all L-Wall heights (found: ${searchByExactSkuPrefix.length})`);

  console.log("\n==================================================");
  console.log(`ALL QR & BARCODE TESTS PASSED: ${passed}/${total} (100%)`);
  console.log("==================================================");
}

runQrBarcodeTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  });
