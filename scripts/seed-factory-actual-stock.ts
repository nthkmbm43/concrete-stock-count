import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import * as fs from "fs";
import { db, schema } from "../src/db";
import { hashPassword } from "better-auth/crypto";

export async function seedFactoryActualStock() {
  if (!db) {
    console.error("DATABASE_URL is not configured.");
    return;
  }

  console.log("==================================================");
  console.log("IMPORTING AUTHENTIC KCON FACTORY STOCK (2569)");
  console.log("==================================================");

  // 1. Read pre-processed dataset
  const rawData = fs.readFileSync("data/kcon_actual_stock_dataset.json", "utf-8");
  const dataset = JSON.parse(rawData);
  const { slabProducts, otherProducts } = dataset;

  console.log(`Loaded ${slabProducts.length} slab products and ${otherProducts.length} other products.`);

  // 2. Wipe old data
  console.log("Cleaning up old tables...");
  await db.delete(schema.stockCountLocations);
  await db.delete(schema.stockCounts);
  await db.delete(schema.stockAdjustments);
  await db.delete(schema.session);
  await db.delete(schema.account);
  await db.delete(schema.profiles);
  await db.delete(schema.user);
  await db.delete(schema.productLocations);
  await db.delete(schema.products);
  await db.delete(schema.storageLocations);
  await db.delete(schema.countRounds);

  // 3. Seed Company Profile
  console.log("Seeding KCON Company Profile...");
  await db
    .insert(schema.companySettings)
    .values({
      id: "default",
      companyNameTh: "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด",
      companyNameEn: "KHON KAEN CONCRETE PRODUCT CO., LTD.",
      brandName: "KCON",
      addressTh: "154 หมู่ 9 ถนนมะลิวัลย์ ตำบลบ้านทุ่ม อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000",
      phone: "043-255-111",
      email: "kcon.eng@gmail.com",
      website: "www.kcon-concrete.com",
      logoUrl: "/logo.png",
      reportFooter: "เอกสารรายงานผลการตรวจนับคลังสินค้าคอนกรีต • ระบบ Concrete Mobile Stock Counting",
      dataSourceNotice: "ข้อมูลจริงจากเอกสารสต็อคสินค้า ปี 2569 บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.companySettings.id,
      set: {
        companyNameTh: "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด",
        companyNameEn: "KHON KAEN CONCRETE PRODUCT CO., LTD.",
        brandName: "KCON",
        logoUrl: "/logo.png",
        phone: "043-255-111",
        email: "kcon.eng@gmail.com",
        website: "www.kcon-concrete.com",
        updatedAt: new Date(),
      },
    });

  // 4. Seed Plants (1-4)
  console.log("Seeding Plants...");
  const plantsList = [
    {
      id: 1,
      code: "PLANT-1",
      name: "โรง 1 (ท่อระบายน้ำ คสล. และบ่อพักสำเร็จรูป)",
      description: "โรงงานผลิตและลานจัดเก็บท่อคอนกรีตเสริมเหล็ก คสล. ทุกขนาด บ่อพักน้ำ และฝาบ่อ",
      active: true,
    },
    {
      id: 2,
      code: "PLANT-2",
      name: "โรง 2 (เสาเข็มคอนกรีตอัดแรง เสาไฟฟ้า และเสารั้ว)",
      description: "โรงงานผลิตและลานเก็บเสาเข็มไอ เสาเข็มสี่เหลี่ยม เสาไฟฟ้าแรงสูง/แรงต่ำ และเสารั้วลวดหนาม",
      active: true,
    },
    {
      id: 3,
      code: "PLANT-3",
      name: "โรง 3 (แผ่นพื้นคอนกรีตอัดแรง Solid Plank และ Hollow Core)",
      description: "โรงงานผลิตแผ่นพื้นสำเร็จรูปแบบตัน ท้องเรียบ จัดเก็บแยกตามกอง (กอง 1 - 33, ชายคา, ด้านใน, รถไฟ, แพ 3-4)",
      active: true,
    },
    {
      id: 4,
      code: "PLANT-4",
      name: "โรง 4 (ผนังกันดิน ขอบคันหิน คอนกรีตแบริเออร์ และอิฐบล็อก)",
      description: "โรงงานผลิตกำแพงกันดินตัวแอล ขอบคันหินฟุตบาท คอนกรีตแบริเออร์ อิฐบล็อก มอก. และแผ่นทางเท้า",
      active: true,
    },
  ];

  for (const p of plantsList) {
    await db
      .insert(schema.plants)
      .values(p)
      .onConflictDoUpdate({ target: schema.plants.id, set: p });
  }

  // 5. Seed Product Categories & Units
  console.log("Seeding Categories & Units...");
  const categoriesList = [
    { id: "slabs", code: "SLAB", name: "แผ่นพื้นคอนกรีตอัดแรง (Slabs)", active: true },
    { id: "piles", code: "PILE", name: "เสาเข็มคอนกรีตอัดแรง (Piles)", active: true },
    { id: "poles", code: "POLE", name: "เสาไฟฟ้าคอนกรีตอัดแรง (Electric Poles)", active: true },
    { id: "fences", code: "FENCE", name: "เสารั้วลวดหนาม (Fence Posts)", active: true },
    { id: "pipes", code: "PIPE", name: "ท่อระบายน้ำ คสล. และบ่อพัก (Pipes & Manholes)", active: true },
    { id: "hardscape", code: "HARD", name: "ผนังกันดิน ขอบคันหิน แบริเออร์ บล็อก (Hardscape)", active: true },
  ];

  for (const c of categoriesList) {
    await db
      .insert(schema.productCategories)
      .values(c)
      .onConflictDoUpdate({ target: schema.productCategories.id, set: c });
  }

  const unitsList = [
    { id: "ต้น", code: "TON", name: "ต้น", symbol: "ต้น", active: true },
    { id: "แผ่น", code: "PAN", name: "แผ่น", symbol: "แผ่น", active: true },
    { id: "ท่อน", code: "THN", name: "ท่อน", symbol: "ท่อน", active: true },
    { id: "ก้อน", code: "KON", name: "ก้อน", symbol: "ก้อน", active: true },
    { id: "เลท", code: "PAL", name: "เลท", symbol: "เลท", active: true },
    { id: "ชุด", code: "SET", name: "ชุด", symbol: "ชุด", active: true },
    { id: "ชิ้น", code: "PCS", name: "ชิ้น", symbol: "ชิ้น", active: true },
  ];

  for (const u of unitsList) {
    await db
      .insert(schema.units)
      .values(u)
      .onConflictDoUpdate({ target: schema.units.id, set: u });
  }

  // 6. Seed Real Users (admin & pcryclc)
  console.log("Seeding Users (admin & pcryclc)...");
  const adminPassHash = await hashPassword("Admin@2026");
  const staffPassHash = await hashPassword("Jib1105t");

  const realUsers = [
    {
      id: "usr-kcon-admin",
      username: "admin",
      email: "admin@kcon.co.th",
      name: "admin",
      fullName: "ผู้ดูแลระบบ (admin)",
      role: "ADMIN",
      plantId: 1,
      phone: "043-255-111",
      passwordHash: adminPassHash,
      employeeCode: "KCON-ADM-01",
    },
    {
      id: "usr-kcon-pcryclc",
      username: "pcryclc",
      email: "pcryclc@kcon.co.th",
      name: "pcryclc",
      fullName: "พนักงานคลังสินค้า (pcryclc)",
      role: "STAFF",
      plantId: 1,
      phone: "043-255-111",
      passwordHash: staffPassHash,
      employeeCode: "KCON-STF-01",
    },
  ];

  for (const u of realUsers) {
    await db
      .insert(schema.user)
      .values({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        emailVerified: true,
      })
      .onConflictDoUpdate({
        target: schema.user.id,
        set: { name: u.name, email: u.email, role: u.role },
      });

    await db
      .insert(schema.profiles)
      .values({
        id: `prof-${u.id}`,
        userId: u.id,
        employeeCode: u.employeeCode,
        fullName: u.fullName,
        role: u.role,
        plantId: u.plantId,
        phone: u.phone,
      })
      .onConflictDoUpdate({
        target: schema.profiles.id,
        set: {
          fullName: u.fullName,
          role: u.role,
          plantId: u.plantId,
          phone: u.phone,
        },
      });

    await db
      .insert(schema.account)
      .values({
        id: `acc-${u.id}`,
        accountId: u.id,
        providerId: "credential",
        userId: u.id,
        password: u.passwordHash,
      })
      .onConflictDoUpdate({
        target: schema.account.id,
        set: { password: u.passwordHash },
      });
  }

  // 7. Seed Storage Locations
  console.log("Seeding Storage Locations (Piles & Bays)...");
  // Collect all distinct storage locations needed
  const locMap = new Map<string, { id: string; plantId: number; zone: string; lockCode: string; rowCode: string; desc: string }>();

  // A. Piles in Plant 3
  for (const slab of slabProducts) {
    for (const loc of slab.locations) {
      const lockCode = loc.lockCode;
      const key = `p3-${lockCode}`;
      if (!locMap.has(key)) {
        locMap.set(key, {
          id: `loc-p3-${lockCode.replace(/\s+/g, "-")}`,
          plantId: 3,
          zone: "ลานเก็บแผ่นพื้นตัน",
          lockCode,
          rowCode: "1",
          desc: `จุดวางสต๊อกแผ่นพื้น ${lockCode}`,
        });
      }
    }
  }

  // B. Locations for Other Products
  for (const item of otherProducts) {
    const key = `p${item.plantId}-${item.lock}`;
    if (!locMap.has(key)) {
      locMap.set(key, {
        id: `loc-p${item.plantId}-${item.lock.replace(/\s+/g, "-")}`,
        plantId: item.plantId,
        zone: item.lock,
        lockCode: item.lock,
        rowCode: item.row || "1",
        desc: `พื้นที่จัดเก็บ ${item.lock}`,
      });
    }
  }

  for (const loc of Array.from(locMap.values())) {
    await db
      .insert(schema.storageLocations)
      .values({
        id: loc.id,
        plantId: loc.plantId,
        zone: loc.zone,
        lockCode: loc.lockCode,
        rowCode: loc.rowCode,
        description: loc.desc,
        active: true,
      })
      .onConflictDoNothing();
  }
  console.log(`Seeded ${locMap.size} distinct storage locations.`);

  // 8. Seed Products & Product Locations
  console.log("Seeding Products & Location mappings...");
  let prodIdx = 1;

  // A. Solid Planks (Plant 3)
  for (const slab of slabProducts) {
    const prodId = `prod-slab-${prodIdx++}`;
    const wireStr = slab.wire === "แผ่นตัด" ? "แผ่นตัดพิเศษ" : `ลวด ${slab.wire} เส้น`;

    await db.insert(schema.products).values({
      id: prodId,
      sku: slab.sku,
      name: slab.name,
      categoryId: "slabs",
      plantId: 3,
      variant: wireStr,
      heightValue: "0.05",
      heightUnit: "เมตร",
      widthValue: "0.35",
      widthUnit: "เมตร",
      lengthValue: slab.length.toFixed(2),
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      currentQuantity: slab.totalQty,
      isActive: true,
      lastCountedAt: new Date("2026-10-30T10:00:00Z"),
      lastCountedBy: "usr-kcon-pcryclc",
    });

    // Link each pile location
    for (let lIdx = 0; lIdx < slab.locations.length; lIdx++) {
      const loc = slab.locations[lIdx];
      const storageLocId = `loc-p3-${loc.lockCode.replace(/\s+/g, "-")}`;
      await db.insert(schema.productLocations).values({
        id: `pl-${prodId}-${lIdx}`,
        productId: prodId,
        storageLocationId: storageLocId,
        expectedQuantity: loc.qty,
        isPrimary: lIdx === 0,
        active: true,
      });
    }
  }

  // B. Other Products (Plants 1, 2, 4)
  for (const item of otherProducts) {
    const prodId = `prod-other-${prodIdx++}`;
    const storageLocId = `loc-p${item.plantId}-${item.lock.replace(/\s+/g, "-")}`;

    await db.insert(schema.products).values({
      id: prodId,
      sku: item.sku,
      name: item.name,
      categoryId: item.category,
      plantId: item.plantId,
      variant: item.variant,
      heightValue: item.height,
      heightUnit: "เมตร",
      widthValue: item.width,
      widthUnit: item.width?.includes('"') ? "นิ้ว" : "เมตร",
      lengthValue: item.length,
      lengthUnit: "เมตร",
      stockUnitId: item.unit,
      currentQuantity: item.qty,
      isActive: true,
      lastCountedAt: new Date("2026-10-30T10:00:00Z"),
      lastCountedBy: "usr-kcon-pcryclc",
    });

    await db.insert(schema.productLocations).values({
      id: `pl-${prodId}-0`,
      productId: prodId,
      storageLocationId: storageLocId,
      expectedQuantity: item.qty,
      isPrimary: true,
      active: true,
    });
  }

  // 9. Seed Active Inventory Count Round
  console.log("Seeding Active Count Round...");
  const roundId = "round-kcon-2569";
  await db.insert(schema.countRounds).values({
    id: roundId,
    name: "รอบตรวจนับสต๊อกสินค้า KCON ปี 2569",
    type: "MONTHLY",
    startDate: "2026-10-01",
    endDate: "2026-11-30",
    status: "OPEN",
    createdBy: "usr-kcon-admin",
  });

  for (const pid of [1, 2, 3, 4]) {
    await db.insert(schema.countRoundPlants).values({
      id: `crp-${roundId}-${pid}`,
      roundId,
      plantId: pid,
    }).onConflictDoNothing();
  }

  console.log("==================================================");
  console.log("DATABASE SEEDING SUCCESSFUL!");
  console.log(`Total Products: ${prodIdx - 1}`);
  console.log(`Total Storage Locations: ${locMap.size}`);
  console.log("==================================================");
}

if (process.argv[1]?.includes("seed-factory-actual-stock")) {
  seedFactoryActualStock()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
