import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db, schema } from "../src/db";
import { hashPassword } from "better-auth/crypto";

export async function resetProductionToRealKcon() {
  if (!db) {
    console.error("DATABASE_URL not configured.");
    return;
  }

  console.log("==================================================");
  console.log("STARTING PRODUCTION RESET: REAL KCON FACTORY DATA");
  console.log("==================================================");

  // ─────────────────────────────────────────────────────────────
  // 1. Wipe all test counts, test adjustments, and old dummy data
  // ─────────────────────────────────────────────────────────────
  console.log("Wiping all test counts, sessions, adjustments, and dummy products...");
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
  console.log("Wipe completed successfully.");

  // ─────────────────────────────────────────────────────────────
  // 2. Seed KCON Company Settings
  // ─────────────────────────────────────────────────────────────
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
      dataSourceNotice: "ข้อมูลจริงอย่างเป็นทางการของบริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด (www.kcon-concrete.com)",
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

  // ─────────────────────────────────────────────────────────────
  // 3. Seed Official Production Plants
  // ─────────────────────────────────────────────────────────────
  console.log("Seeding KCON Plants (1-4)...");
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
      description: "โรงงานผลิตแผ่นพื้นสำเร็จรูปแบบตัน ท้องเรียบ และแผ่นพื้นคอนกรีตกลวง Hollow Core ทุกความหนา",
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

  // ─────────────────────────────────────────────────────────────
  // 4. Seed Product Categories & Units
  // ─────────────────────────────────────────────────────────────
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
    { id: "ชุด", code: "SET", name: "ชุด", symbol: "ชุด", active: true },
    { id: "ชิ้น", code: "PCS", name: "ชิ้น", symbol: "ชิ้น", active: true },
    { id: "อัน", code: "UN", name: "อัน", symbol: "อัน", active: true },
  ];

  for (const u of unitsList) {
    await db
      .insert(schema.units)
      .values(u)
      .onConflictDoUpdate({ target: schema.units.id, set: u });
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Seed Real Users (admin & pcryclc)
  // ─────────────────────────────────────────────────────────────
  console.log("Seeding Real Users (admin & pcryclc)...");

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
    // 1. Insert user
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

    // 2. Insert profile
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

    // 3. Insert account with password credentials
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
        set: {
          password: u.passwordHash,
        },
      });
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Seed Complete Real KCON Product Catalog (Every Size / Spec)
  // All current_quantity = 0 (Ready for real counting)
  // ─────────────────────────────────────────────────────────────
  console.log("Seeding Complete KCON Real Product Catalog (all sizes, 0 quantity)...");

  interface ProductSeedItem {
    id: string;
    sku: string;
    name: string;
    categoryId: string;
    plantId: number;
    variant: string;
    heightValue?: string;
    heightUnit?: string;
    widthValue?: string;
    widthUnit?: string;
    lengthValue?: string;
    lengthUnit?: string;
    stockUnitId: string;
    defaultLock: string;
    defaultRow: string;
    defaultZone: string;
  }

  const kconProducts: ProductSeedItem[] = [
    // ────────── โรง 3: แผ่นพื้นสำเร็จรูป (Solid Plank & Hollow Core) ──────────
    {
      id: "prod-kcon-sp-100",
      sku: "SLAB-SP-100",
      name: "แผ่นพื้นสำเร็จรูปแบบตัน ท้องเรียบ (Solid Plank) ลวด 4 เส้น",
      categoryId: "slabs",
      plantId: 3,
      variant: "หนา 5 ซม. หน้ากว้าง 35 ซม.",
      heightValue: "0.05",
      heightUnit: "เมตร",
      widthValue: "0.35",
      widthUnit: "เมตร",
      lengthValue: "1.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "Bay-1",
      defaultRow: "1",
      defaultZone: "ลานแผ่นพื้น 3A",
    },
    {
      id: "prod-kcon-sp-150",
      sku: "SLAB-SP-150",
      name: "แผ่นพื้นสำเร็จรูปแบบตัน ท้องเรียบ (Solid Plank) ลวด 4 เส้น",
      categoryId: "slabs",
      plantId: 3,
      variant: "หนา 5 ซม. หน้ากว้าง 35 ซม.",
      heightValue: "0.05",
      heightUnit: "เมตร",
      widthValue: "0.35",
      widthUnit: "เมตร",
      lengthValue: "1.50",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "Bay-1",
      defaultRow: "2",
      defaultZone: "ลานแผ่นพื้น 3A",
    },
    {
      id: "prod-kcon-sp-200",
      sku: "SLAB-SP-200",
      name: "แผ่นพื้นสำเร็จรูปแบบตัน ท้องเรียบ (Solid Plank) ลวด 4 เส้น",
      categoryId: "slabs",
      plantId: 3,
      variant: "หนา 5 ซม. หน้ากว้าง 35 ซม.",
      heightValue: "0.05",
      heightUnit: "เมตร",
      widthValue: "0.35",
      widthUnit: "เมตร",
      lengthValue: "2.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "Bay-1",
      defaultRow: "3",
      defaultZone: "ลานแผ่นพื้น 3A",
    },
    {
      id: "prod-kcon-sp-250",
      sku: "SLAB-SP-250",
      name: "แผ่นพื้นสำเร็จรูปแบบตัน ท้องเรียบ (Solid Plank) ลวด 5 เส้น",
      categoryId: "slabs",
      plantId: 3,
      variant: "หนา 5 ซม. หน้ากว้าง 35 ซม.",
      heightValue: "0.05",
      heightUnit: "เมตร",
      widthValue: "0.35",
      widthUnit: "เมตร",
      lengthValue: "2.50",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "Bay-1",
      defaultRow: "4",
      defaultZone: "ลานแผ่นพื้น 3A",
    },
    {
      id: "prod-kcon-sp-300",
      sku: "SLAB-SP-300",
      name: "แผ่นพื้นสำเร็จรูปแบบตัน ท้องเรียบ (Solid Plank) ลวด 5 เส้น",
      categoryId: "slabs",
      plantId: 3,
      variant: "หนา 5 ซม. หน้ากว้าง 35 ซม.",
      heightValue: "0.05",
      heightUnit: "เมตร",
      widthValue: "0.35",
      widthUnit: "เมตร",
      lengthValue: "3.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "Bay-2",
      defaultRow: "1",
      defaultZone: "ลานแผ่นพื้น 3A",
    },
    {
      id: "prod-kcon-sp-350",
      sku: "SLAB-SP-350",
      name: "แผ่นพื้นสำเร็จรูปแบบตัน ท้องเรียบ (Solid Plank) ลวด 6 เส้น",
      categoryId: "slabs",
      plantId: 3,
      variant: "หนา 5 ซม. หน้ากว้าง 35 ซม.",
      heightValue: "0.05",
      heightUnit: "เมตร",
      widthValue: "0.35",
      widthUnit: "เมตร",
      lengthValue: "3.50",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "Bay-2",
      defaultRow: "2",
      defaultZone: "ลานแผ่นพื้น 3A",
    },
    {
      id: "prod-kcon-sp-400",
      sku: "SLAB-SP-400",
      name: "แผ่นพื้นสำเร็จรูปแบบตัน ท้องเรียบ (Solid Plank) ลวด 6 เส้น",
      categoryId: "slabs",
      plantId: 3,
      variant: "หนา 5 ซม. หน้ากว้าง 35 ซม.",
      heightValue: "0.05",
      heightUnit: "เมตร",
      widthValue: "0.35",
      widthUnit: "เมตร",
      lengthValue: "4.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "Bay-2",
      defaultRow: "3",
      defaultZone: "ลานแผ่นพื้น 3A",
    },
    {
      id: "prod-kcon-sp-450",
      sku: "SLAB-SP-450",
      name: "แผ่นพื้นสำเร็จรูปแบบตัน ท้องเรียบ (Solid Plank) ลวด 7 เส้น",
      categoryId: "slabs",
      plantId: 3,
      variant: "หนา 5 ซม. หน้ากว้าง 35 ซม.",
      heightValue: "0.05",
      heightUnit: "เมตร",
      widthValue: "0.35",
      widthUnit: "เมตร",
      lengthValue: "4.50",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "Bay-2",
      defaultRow: "4",
      defaultZone: "ลานแผ่นพื้น 3A",
    },
    // แผ่นพื้นกลวง Hollow Core (KCON HC Series)
    {
      id: "prod-kcon-hc-07-35",
      sku: "HC-07-35",
      name: "แผ่นพื้นคอนกรีตกลวง Hollow Core หนา 0.07 ม. กว้าง 0.35 ม.",
      categoryId: "slabs",
      plantId: 3,
      variant: "HC 0.07 x 0.35 ม. มอก.",
      heightValue: "0.07",
      heightUnit: "เมตร",
      widthValue: "0.35",
      widthUnit: "เมตร",
      lengthValue: "4.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "HC-Bay1",
      defaultRow: "1",
      defaultZone: "ลานฮอลโลว์คอร์ 3B",
    },
    {
      id: "prod-kcon-hc-08-60",
      sku: "HC-08-60",
      name: "แผ่นพื้นคอนกรีตกลวง Hollow Core หนา 0.08 ม. กว้าง 0.60 ม.",
      categoryId: "slabs",
      plantId: 3,
      variant: "HC 0.08 x 0.60 ม. มอก.",
      heightValue: "0.08",
      heightUnit: "เมตร",
      widthValue: "0.60",
      widthUnit: "เมตร",
      lengthValue: "4.50",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "HC-Bay1",
      defaultRow: "2",
      defaultZone: "ลานฮอลโลว์คอร์ 3B",
    },
    {
      id: "prod-kcon-hc-10-60",
      sku: "HC-10-60",
      name: "แผ่นพื้นคอนกรีตกลวง Hollow Core หนา 0.10 ม. กว้าง 0.60 ม.",
      categoryId: "slabs",
      plantId: 3,
      variant: "HC 0.10 x 0.60 ม. มอก.",
      heightValue: "0.10",
      heightUnit: "เมตร",
      widthValue: "0.60",
      widthUnit: "เมตร",
      lengthValue: "5.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "HC-Bay2",
      defaultRow: "1",
      defaultZone: "ลานฮอลโลว์คอร์ 3B",
    },
    {
      id: "prod-kcon-hc-12-60",
      sku: "HC-12-60",
      name: "แผ่นพื้นคอนกรีตกลวง Hollow Core หนา 0.12 ม. กว้าง 0.60 ม.",
      categoryId: "slabs",
      plantId: 3,
      variant: "HC 0.12 x 0.60 ม. มอก.",
      heightValue: "0.12",
      heightUnit: "เมตร",
      widthValue: "0.60",
      widthUnit: "เมตร",
      lengthValue: "5.50",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "HC-Bay2",
      defaultRow: "2",
      defaultZone: "ลานฮอลโลว์คอร์ 3B",
    },
    {
      id: "prod-kcon-hc-15-60",
      sku: "HC-15-60",
      name: "แผ่นพื้นคอนกรีตกลวง Hollow Core หนา 0.15 ม. กว้าง 0.60 ม.",
      categoryId: "slabs",
      plantId: 3,
      variant: "HC 0.15 x 0.60 ม. มอก.",
      heightValue: "0.15",
      heightUnit: "เมตร",
      widthValue: "0.60",
      widthUnit: "เมตร",
      lengthValue: "6.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "HC-Bay3",
      defaultRow: "1",
      defaultZone: "ลานฮอลโลว์คอร์ 3B",
    },
    {
      id: "prod-kcon-hc-15-120",
      sku: "HC-15-120",
      name: "แผ่นพื้นคอนกรีตกลวง Hollow Core หนา 0.15 ม. กว้าง 1.20 ม.",
      categoryId: "slabs",
      plantId: 3,
      variant: "HC 0.15 x 1.20 ม. มอก.",
      heightValue: "0.15",
      heightUnit: "เมตร",
      widthValue: "1.20",
      widthUnit: "เมตร",
      lengthValue: "6.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "HC-Bay3",
      defaultRow: "2",
      defaultZone: "ลานฮอลโลว์คอร์ 3B",
    },
    {
      id: "prod-kcon-hc-20-120",
      sku: "HC-20-120",
      name: "แผ่นพื้นคอนกรีตกลวง Hollow Core หนา 0.20 ม. กว้าง 1.20 ม.",
      categoryId: "slabs",
      plantId: 3,
      variant: "HC 0.20 x 1.20 ม. มอก.",
      heightValue: "0.20",
      heightUnit: "เมตร",
      widthValue: "1.20",
      widthUnit: "เมตร",
      lengthValue: "7.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "HC-Bay4",
      defaultRow: "1",
      defaultZone: "ลานฮอลโลว์คอร์ 3B",
    },
    {
      id: "prod-kcon-hc-25-120",
      sku: "HC-25-120",
      name: "แผ่นพื้นคอนกรีตกลวง Hollow Core หนา 0.25 ม. กว้าง 1.20 ม.",
      categoryId: "slabs",
      plantId: 3,
      variant: "HC 0.25 x 1.20 ม. มอก.",
      heightValue: "0.25",
      heightUnit: "เมตร",
      widthValue: "1.20",
      widthUnit: "เมตร",
      lengthValue: "8.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "HC-Bay4",
      defaultRow: "2",
      defaultZone: "ลานฮอลโลว์คอร์ 3B",
    },
    {
      id: "prod-kcon-hc-30-120",
      sku: "HC-30-120",
      name: "แผ่นพื้นคอนกรีตกลวง Hollow Core หนา 0.30 ม. กว้าง 1.20 ม.",
      categoryId: "slabs",
      plantId: 3,
      variant: "HC 0.30 x 1.20 ม. มอก.",
      heightValue: "0.30",
      heightUnit: "เมตร",
      widthValue: "1.20",
      widthUnit: "เมตร",
      lengthValue: "9.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      defaultLock: "HC-Bay5",
      defaultRow: "1",
      defaultZone: "ลานฮอลโลว์คอร์ 3B",
    },

    // ────────── โรง 2: เสาเข็มคอนกรีตอัดแรง เสาไฟฟ้า และเสารั้ว ──────────
    // เสาเข็มไอ (I-Piles)
    {
      id: "prod-kcon-pile-i18-06",
      sku: "PILE-I18-06",
      name: "เสาเข็มคอนกรีตอัดแรง รูปตัวไอ I-18 ยาว 6.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "I-18 ยาว 6.00 ม. มอก.",
      widthValue: "18",
      widthUnit: "ซม.",
      heightValue: "18",
      heightUnit: "ซม.",
      lengthValue: "6.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-PileA",
      defaultRow: "1",
      defaultZone: "ลานเสาเข็ม 2A",
    },
    {
      id: "prod-kcon-pile-i22-06",
      sku: "PILE-I22-06",
      name: "เสาเข็มคอนกรีตอัดแรง รูปตัวไอ I-22 ยาว 6.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "I-22 ยาว 6.00 ม. มอก.",
      widthValue: "22",
      widthUnit: "ซม.",
      heightValue: "22",
      heightUnit: "ซม.",
      lengthValue: "6.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-PileA",
      defaultRow: "2",
      defaultZone: "ลานเสาเข็ม 2A",
    },
    {
      id: "prod-kcon-pile-i22-08",
      sku: "PILE-I22-08",
      name: "เสาเข็มคอนกรีตอัดแรง รูปตัวไอ I-22 ยาว 8.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "I-22 ยาว 8.00 ม. มอก.",
      widthValue: "22",
      widthUnit: "ซม.",
      heightValue: "22",
      heightUnit: "ซม.",
      lengthValue: "8.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-PileA",
      defaultRow: "3",
      defaultZone: "ลานเสาเข็ม 2A",
    },
    {
      id: "prod-kcon-pile-i22-10",
      sku: "PILE-I22-10",
      name: "เสาเข็มคอนกรีตอัดแรง รูปตัวไอ I-22 ยาว 10.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "I-22 ยาว 10.00 ม. มอก.",
      widthValue: "22",
      widthUnit: "ซม.",
      heightValue: "22",
      heightUnit: "ซม.",
      lengthValue: "10.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-PileA",
      defaultRow: "4",
      defaultZone: "ลานเสาเข็ม 2A",
    },
    {
      id: "prod-kcon-pile-i22-12",
      sku: "PILE-I22-12",
      name: "เสาเข็มคอนกรีตอัดแรง รูปตัวไอ I-22 ยาว 12.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "I-22 ยาว 12.00 ม. มอก.",
      widthValue: "22",
      widthUnit: "ซม.",
      heightValue: "22",
      heightUnit: "ซม.",
      lengthValue: "12.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-PileA",
      defaultRow: "5",
      defaultZone: "ลานเสาเข็ม 2A",
    },
    {
      id: "prod-kcon-pile-i26-08",
      sku: "PILE-I26-08",
      name: "เสาเข็มคอนกรีตอัดแรง รูปตัวไอ I-26 ยาว 8.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "I-26 ยาว 8.00 ม. มอก.",
      widthValue: "26",
      widthUnit: "ซม.",
      heightValue: "26",
      heightUnit: "ซม.",
      lengthValue: "8.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-PileB",
      defaultRow: "1",
      defaultZone: "ลานเสาเข็ม 2B",
    },
    {
      id: "prod-kcon-pile-i26-10",
      sku: "PILE-I26-10",
      name: "เสาเข็มคอนกรีตอัดแรง รูปตัวไอ I-26 ยาว 10.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "I-26 ยาว 10.00 ม. มอก.",
      widthValue: "26",
      widthUnit: "ซม.",
      heightValue: "26",
      heightUnit: "ซม.",
      lengthValue: "10.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-PileB",
      defaultRow: "2",
      defaultZone: "ลานเสาเข็ม 2B",
    },
    {
      id: "prod-kcon-pile-i26-12",
      sku: "PILE-I26-12",
      name: "เสาเข็มคอนกรีตอัดแรง รูปตัวไอ I-26 ยาว 12.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "I-26 ยาว 12.00 ม. มอก.",
      widthValue: "26",
      widthUnit: "ซม.",
      heightValue: "26",
      heightUnit: "ซม.",
      lengthValue: "12.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-PileB",
      defaultRow: "3",
      defaultZone: "ลานเสาเข็ม 2B",
    },
    {
      id: "prod-kcon-pile-i30-10",
      sku: "PILE-I30-10",
      name: "เสาเข็มคอนกรีตอัดแรง รูปตัวไอ I-30 ยาว 10.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "I-30 ยาว 10.00 ม. มอก.",
      widthValue: "30",
      widthUnit: "ซม.",
      heightValue: "30",
      heightUnit: "ซม.",
      lengthValue: "10.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-PileC",
      defaultRow: "1",
      defaultZone: "ลานเสาเข็ม 2C",
    },
    {
      id: "prod-kcon-pile-i30-12",
      sku: "PILE-I30-12",
      name: "เสาเข็มคอนกรีตอัดแรง รูปตัวไอ I-30 ยาว 12.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "I-30 ยาว 12.00 ม. มอก.",
      widthValue: "30",
      widthUnit: "ซม.",
      heightValue: "30",
      heightUnit: "ซม.",
      lengthValue: "12.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-PileC",
      defaultRow: "2",
      defaultZone: "ลานเสาเข็ม 2C",
    },
    {
      id: "prod-kcon-pile-i35-12",
      sku: "PILE-I35-12",
      name: "เสาเข็มคอนกรีตอัดแรง รูปตัวไอ I-35 ยาว 12.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "I-35 ยาว 12.00 ม. มอก.",
      widthValue: "35",
      widthUnit: "ซม.",
      heightValue: "35",
      heightUnit: "ซม.",
      lengthValue: "12.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-PileC",
      defaultRow: "3",
      defaultZone: "ลานเสาเข็ม 2C",
    },
    // เสาเข็มสี่เหลี่ยมตัน (Square Piles)
    {
      id: "prod-kcon-pile-s22-08",
      sku: "PILE-S22-08",
      name: "เสาเข็มสี่เหลี่ยมตัน S-22 ยาว 8.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "S-22 ยาว 8.00 ม. มอก.",
      widthValue: "22",
      widthUnit: "ซม.",
      heightValue: "22",
      heightUnit: "ซม.",
      lengthValue: "8.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-SqPile",
      defaultRow: "1",
      defaultZone: "ลานเสาเข็มสี่เหลี่ยม 2D",
    },
    {
      id: "prod-kcon-pile-s26-10",
      sku: "PILE-S26-10",
      name: "เสาเข็มสี่เหลี่ยมตัน S-26 ยาว 10.00 ม.",
      categoryId: "piles",
      plantId: 2,
      variant: "S-26 ยาว 10.00 ม. มอก.",
      widthValue: "26",
      widthUnit: "ซม.",
      heightValue: "26",
      heightUnit: "ซม.",
      lengthValue: "10.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-SqPile",
      defaultRow: "2",
      defaultZone: "ลานเสาเข็มสี่เหลี่ยม 2D",
    },
    // เสาไฟฟ้าคอนกรีตอัดแรง (Prestressed Electric Poles)
    {
      id: "prod-kcon-pole-08m",
      sku: "POLE-08M",
      name: "เสาไฟฟ้าคอนกรีตอัดแรง สูง 8.00 ม. (มาตรฐาน กฟภ.)",
      categoryId: "poles",
      plantId: 2,
      variant: "สูง 8.00 ม. สายส่งแรงต่ำ",
      lengthValue: "8.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-Pole",
      defaultRow: "1",
      defaultZone: "ลานเสาไฟฟ้า 2E",
    },
    {
      id: "prod-kcon-pole-09m",
      sku: "POLE-09M",
      name: "เสาไฟฟ้าคอนกรีตอัดแรง สูง 9.00 ม. (มาตรฐาน กฟภ.)",
      categoryId: "poles",
      plantId: 2,
      variant: "สูง 9.00 ม. สายส่งแรงต่ำ",
      lengthValue: "9.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-Pole",
      defaultRow: "2",
      defaultZone: "ลานเสาไฟฟ้า 2E",
    },
    {
      id: "prod-kcon-pole-12m",
      sku: "POLE-12M",
      name: "เสาไฟฟ้าคอนกรีตอัดแรง สูง 12.00 ม. (มาตรฐาน กฟภ.)",
      categoryId: "poles",
      plantId: 2,
      variant: "สูง 12.00 ม. สายส่งแรงสูง 22-33 kV",
      lengthValue: "12.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-Pole",
      defaultRow: "3",
      defaultZone: "ลานเสาไฟฟ้า 2E",
    },
    {
      id: "prod-kcon-pole-14m",
      sku: "POLE-14M",
      name: "เสาไฟฟ้าคอนกรีตอัดแรง สูง 14.00 ม. (มาตรฐาน กฟภ.)",
      categoryId: "poles",
      plantId: 2,
      variant: "สูง 14.00 ม. ติดตั้งหม้อแปลง/แรงสูง",
      lengthValue: "14.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-Pole",
      defaultRow: "4",
      defaultZone: "ลานเสาไฟฟ้า 2E",
    },
    // เสารั้วลวดหนาม
    {
      id: "prod-kcon-fence-3x3-200",
      sku: "FENCE-3X3-200",
      name: "เสารั้วลวดหนามคอนกรีตอัดแรง 3\" x 3\" ยาว 2.00 ม.",
      categoryId: "fences",
      plantId: 2,
      variant: "หน้า 3 นิ้ว x 3 นิ้ว ยาว 2.00 ม.",
      widthValue: "3",
      widthUnit: "นิ้ว",
      heightValue: "3",
      heightUnit: "นิ้ว",
      lengthValue: "2.00",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-Fence",
      defaultRow: "1",
      defaultZone: "ลานเสารั้ว 2F",
    },
    {
      id: "prod-kcon-fence-3x3-250",
      sku: "FENCE-3X3-250",
      name: "เสารั้วลวดหนามคอนกรีตอัดแรง 3\" x 3\" ยาว 2.50 ม.",
      categoryId: "fences",
      plantId: 2,
      variant: "หน้า 3 นิ้ว x 3 นิ้ว ยาว 2.50 ม.",
      widthValue: "3",
      widthUnit: "นิ้ว",
      heightValue: "3",
      heightUnit: "นิ้ว",
      lengthValue: "2.50",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-Fence",
      defaultRow: "2",
      defaultZone: "ลานเสารั้ว 2F",
    },
    {
      id: "prod-kcon-fence-4x4-250",
      sku: "FENCE-4X4-250",
      name: "เสารั้วลวดหนามคอนกรีตอัดแรง 4\" x 4\" ยาว 2.50 ม.",
      categoryId: "fences",
      plantId: 2,
      variant: "หน้า 4 นิ้ว x 4 นิ้ว ยาว 2.50 ม.",
      widthValue: "4",
      widthUnit: "นิ้ว",
      heightValue: "4",
      heightUnit: "นิ้ว",
      lengthValue: "2.50",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      defaultLock: "Yard-Fence",
      defaultRow: "3",
      defaultZone: "ลานเสารั้ว 2F",
    },

    // ────────── โรง 1: ท่อระบายน้ำ คสล. และบ่อพักสำเร็จรูป ──────────
    // ท่อระบายน้ำ คสล. มอก. ชั้น 3 (ปากลิ้นราง ยาว 1.00 ม.)
    {
      id: "prod-kcon-pipe-030-c3",
      sku: "PIPE-030-C3",
      name: "ท่อคอนกรีตเสริมเหล็ก คสล. มอก. ชั้น 3 ขนาด Dia 0.30 x 1.00 ม.",
      categoryId: "pipes",
      plantId: 1,
      variant: "Dia 0.30 ม. ยาว 1.00 ม. มอก. ชั้น 3",
      widthValue: "0.30",
      widthUnit: "เมตร",
      lengthValue: "1.00",
      lengthUnit: "เมตร",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Pipe1",
      defaultRow: "1",
      defaultZone: "ลานท่อ 1A",
    },
    {
      id: "prod-kcon-pipe-040-c3",
      sku: "PIPE-040-C3",
      name: "ท่อคอนกรีตเสริมเหล็ก คสล. มอก. ชั้น 3 ขนาด Dia 0.40 x 1.00 ม.",
      categoryId: "pipes",
      plantId: 1,
      variant: "Dia 0.40 ม. ยาว 1.00 ม. มอก. ชั้น 3",
      widthValue: "0.40",
      widthUnit: "เมตร",
      lengthValue: "1.00",
      lengthUnit: "เมตร",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Pipe1",
      defaultRow: "2",
      defaultZone: "ลานท่อ 1A",
    },
    {
      id: "prod-kcon-pipe-050-c3",
      sku: "PIPE-050-C3",
      name: "ท่อคอนกรีตเสริมเหล็ก คสล. มอก. ชั้น 3 ขนาด Dia 0.50 x 1.00 ม.",
      categoryId: "pipes",
      plantId: 1,
      variant: "Dia 0.50 ม. ยาว 1.00 ม. มอก. ชั้น 3",
      widthValue: "0.50",
      widthUnit: "เมตร",
      lengthValue: "1.00",
      lengthUnit: "เมตร",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Pipe1",
      defaultRow: "3",
      defaultZone: "ลานท่อ 1A",
    },
    {
      id: "prod-kcon-pipe-060-c3",
      sku: "PIPE-060-C3",
      name: "ท่อคอนกรีตเสริมเหล็ก คสล. มอก. ชั้น 3 ขนาด Dia 0.60 x 1.00 ม.",
      categoryId: "pipes",
      plantId: 1,
      variant: "Dia 0.60 ม. ยาว 1.00 ม. มอก. ชั้น 3",
      widthValue: "0.60",
      widthUnit: "เมตร",
      lengthValue: "1.00",
      lengthUnit: "เมตร",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Pipe1",
      defaultRow: "4",
      defaultZone: "ลานท่อ 1A",
    },
    {
      id: "prod-kcon-pipe-080-c3",
      sku: "PIPE-080-C3",
      name: "ท่อคอนกรีตเสริมเหล็ก คสล. มอก. ชั้น 3 ขนาด Dia 0.80 x 1.00 ม.",
      categoryId: "pipes",
      plantId: 1,
      variant: "Dia 0.80 ม. ยาว 1.00 ม. มอก. ชั้น 3",
      widthValue: "0.80",
      widthUnit: "เมตร",
      lengthValue: "1.00",
      lengthUnit: "เมตร",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Pipe2",
      defaultRow: "1",
      defaultZone: "ลานท่อ 1B",
    },
    {
      id: "prod-kcon-pipe-100-c3",
      sku: "PIPE-100-C3",
      name: "ท่อคอนกรีตเสริมเหล็ก คสล. มอก. ชั้น 3 ขนาด Dia 1.00 x 1.00 ม.",
      categoryId: "pipes",
      plantId: 1,
      variant: "Dia 1.00 ม. ยาว 1.00 ม. มอก. ชั้น 3",
      widthValue: "1.00",
      widthUnit: "เมตร",
      lengthValue: "1.00",
      lengthUnit: "เมตร",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Pipe2",
      defaultRow: "2",
      defaultZone: "ลานท่อ 1B",
    },
    {
      id: "prod-kcon-pipe-120-c3",
      sku: "PIPE-120-C3",
      name: "ท่อคอนกรีตเสริมเหล็ก คสล. มอก. ชั้น 3 ขนาด Dia 1.20 x 1.00 ม.",
      categoryId: "pipes",
      plantId: 1,
      variant: "Dia 1.20 ม. ยาว 1.00 ม. มอก. ชั้น 3",
      widthValue: "1.20",
      widthUnit: "เมตร",
      lengthValue: "1.00",
      lengthUnit: "เมตร",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Pipe2",
      defaultRow: "3",
      defaultZone: "ลานท่อ 1B",
    },
    {
      id: "prod-kcon-pipe-150-c3",
      sku: "PIPE-150-C3",
      name: "ท่อคอนกรีตเสริมเหล็ก คสล. มอก. ชั้น 3 ขนาด Dia 1.50 x 1.00 ม.",
      categoryId: "pipes",
      plantId: 1,
      variant: "Dia 1.50 ม. ยาว 1.00 ม. มอก. ชั้น 3",
      widthValue: "1.50",
      widthUnit: "เมตร",
      lengthValue: "1.00",
      lengthUnit: "เมตร",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Pipe2",
      defaultRow: "4",
      defaultZone: "ลานท่อ 1B",
    },
    // ท่อ คสล. มอก. ชั้น 2 (รับน้ำหนักสูง)
    {
      id: "prod-kcon-pipe-060-c2",
      sku: "PIPE-060-C2",
      name: "ท่อคอนกรีตเสริมเหล็ก คสล. มอก. ชั้น 2 ขนาด Dia 0.60 x 1.00 ม. (รับน้ำหนักสูง)",
      categoryId: "pipes",
      plantId: 1,
      variant: "Dia 0.60 ม. ยาว 1.00 ม. มอก. ชั้น 2",
      widthValue: "0.60",
      widthUnit: "เมตร",
      lengthValue: "1.00",
      lengthUnit: "เมตร",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Pipe3",
      defaultRow: "1",
      defaultZone: "ลานท่อ 1C",
    },
    {
      id: "prod-kcon-pipe-080-c2",
      sku: "PIPE-080-C2",
      name: "ท่อคอนกรีตเสริมเหล็ก คสล. มอก. ชั้น 2 ขนาด Dia 0.80 x 1.00 ม. (รับน้ำหนักสูง)",
      categoryId: "pipes",
      plantId: 1,
      variant: "Dia 0.80 ม. ยาว 1.00 ม. มอก. ชั้น 2",
      widthValue: "0.80",
      widthUnit: "เมตร",
      lengthValue: "1.00",
      lengthUnit: "เมตร",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Pipe3",
      defaultRow: "2",
      defaultZone: "ลานท่อ 1C",
    },
    {
      id: "prod-kcon-pipe-100-c2",
      sku: "PIPE-100-C2",
      name: "ท่อคอนกรีตเสริมเหล็ก คสล. มอก. ชั้น 2 ขนาด Dia 1.00 x 1.00 ม. (รับน้ำหนักสูง)",
      categoryId: "pipes",
      plantId: 1,
      variant: "Dia 1.00 ม. ยาว 1.00 ม. มอก. ชั้น 2",
      widthValue: "1.00",
      widthUnit: "เมตร",
      lengthValue: "1.00",
      lengthUnit: "เมตร",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Pipe3",
      defaultRow: "3",
      defaultZone: "ลานท่อ 1C",
    },
    // บ่อพักสำเร็จรูป คสล.
    {
      id: "prod-kcon-mh-030-040",
      sku: "MH-030-040",
      name: "บ่อพักคอนกรีตสำเร็จรูป สำหรับท่อ Dia 0.30 - 0.40 ม.",
      categoryId: "pipes",
      plantId: 1,
      variant: "สำหรับท่อ 0.30 - 0.40 ม.",
      stockUnitId: "ชุด",
      defaultLock: "Yard-Manhole",
      defaultRow: "1",
      defaultZone: "ลานบ่อพัก 1D",
    },
    {
      id: "prod-kcon-mh-050-060",
      sku: "MH-050-060",
      name: "บ่อพักคอนกรีตสำเร็จรูป สำหรับท่อ Dia 0.50 - 0.60 ม.",
      categoryId: "pipes",
      plantId: 1,
      variant: "สำหรับท่อ 0.50 - 0.60 ม.",
      stockUnitId: "ชุด",
      defaultLock: "Yard-Manhole",
      defaultRow: "2",
      defaultZone: "ลานบ่อพัก 1D",
    },
    {
      id: "prod-kcon-mh-080-100",
      sku: "MH-080-100",
      name: "บ่อพักคอนกรีตสำเร็จรูป สำหรับท่อ Dia 0.80 - 1.00 ม.",
      categoryId: "pipes",
      plantId: 1,
      variant: "สำหรับท่อ 0.80 - 1.00 ม.",
      stockUnitId: "ชุด",
      defaultLock: "Yard-Manhole",
      defaultRow: "3",
      defaultZone: "ลานบ่อพัก 1D",
    },
    {
      id: "prod-kcon-mh-cover-std",
      sku: "MH-COVER-STD",
      name: "ฝาบ่อพักคอนกรีต คสล. แบบทึบ มีหูยก",
      categoryId: "pipes",
      plantId: 1,
      variant: "ฝาทึบ คสล.",
      stockUnitId: "แผ่น",
      defaultLock: "Yard-Manhole",
      defaultRow: "4",
      defaultZone: "ลานบ่อพัก 1D",
    },

    // ────────── โรง 4: ผนังกันดิน ขอบคันหิน คอนกรีตแบริเออร์ และอิฐบล็อก ──────────
    // ผนังกันดินรูปตัวแอล (L-Shape Retaining Wall)
    {
      id: "prod-kcon-lwall-100",
      sku: "L-WALL-100",
      name: "ผนังกันดินรูปตัวแอล (L-Shape Wall) สูง 1.00 ม. กว้าง 1.00 ม.",
      categoryId: "hardscape",
      plantId: 4,
      variant: "สูง 1.00 ม. x กว้าง 1.00 ม.",
      heightValue: "1.00",
      heightUnit: "เมตร",
      widthValue: "1.00",
      widthUnit: "เมตร",
      stockUnitId: "ชิ้น",
      defaultLock: "Yard-LWall",
      defaultRow: "1",
      defaultZone: "ลานผนังกันดิน 4A",
    },
    {
      id: "prod-kcon-lwall-150",
      sku: "L-WALL-150",
      name: "ผนังกันดินรูปตัวแอล (L-Shape Wall) สูง 1.50 ม. กว้าง 1.00 ม.",
      categoryId: "hardscape",
      plantId: 4,
      variant: "สูง 1.50 ม. x กว้าง 1.00 ม.",
      heightValue: "1.50",
      heightUnit: "เมตร",
      widthValue: "1.00",
      widthUnit: "เมตร",
      stockUnitId: "ชิ้น",
      defaultLock: "Yard-LWall",
      defaultRow: "2",
      defaultZone: "ลานผนังกันดิน 4A",
    },
    {
      id: "prod-kcon-lwall-200",
      sku: "L-WALL-200",
      name: "ผนังกันดินรูปตัวแอล (L-Shape Wall) สูง 2.00 ม. กว้าง 1.00 ม.",
      categoryId: "hardscape",
      plantId: 4,
      variant: "สูง 2.00 ม. x กว้าง 1.00 ม.",
      heightValue: "2.00",
      heightUnit: "เมตร",
      widthValue: "1.00",
      widthUnit: "เมตร",
      stockUnitId: "ชิ้น",
      defaultLock: "Yard-LWall",
      defaultRow: "3",
      defaultZone: "ลานผนังกันดิน 4A",
    },
    {
      id: "prod-kcon-lwall-250",
      sku: "L-WALL-250",
      name: "ผนังกันดินรูปตัวแอล (L-Shape Wall) สูง 2.50 ม. กว้าง 1.00 ม.",
      categoryId: "hardscape",
      plantId: 4,
      variant: "สูง 2.50 ม. x กว้าง 1.00 ม.",
      heightValue: "2.50",
      heightUnit: "เมตร",
      widthValue: "1.00",
      widthUnit: "เมตร",
      stockUnitId: "ชิ้น",
      defaultLock: "Yard-LWall",
      defaultRow: "4",
      defaultZone: "ลานผนังกันดิน 4A",
    },
    // ขอบคันหิน ขอบฟุตบาท (Curbstone)
    {
      id: "prod-kcon-curb-15-30-100",
      sku: "CURB-15-30-100",
      name: "ขอบคันหิน คสล. มาตรฐาน ขนาด 15 x 30 x 100 ซม.",
      categoryId: "hardscape",
      plantId: 4,
      variant: "15 x 30 x 100 ซม. ผิวเรียบ",
      widthValue: "15",
      widthUnit: "ซม.",
      heightValue: "30",
      heightUnit: "ซม.",
      lengthValue: "100",
      lengthUnit: "ซม.",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Curb",
      defaultRow: "1",
      defaultZone: "ลานขอบคันหิน 4B",
    },
    {
      id: "prod-kcon-curb-10-20-50",
      sku: "CURB-10-20-50",
      name: "ขอบคันหินมน ขนาด 10 x 20 x 50 ซม.",
      categoryId: "hardscape",
      plantId: 4,
      variant: "10 x 20 x 50 ซม. ขอบมน",
      widthValue: "10",
      widthUnit: "ซม.",
      heightValue: "20",
      heightUnit: "ซม.",
      lengthValue: "50",
      lengthUnit: "ซม.",
      stockUnitId: "ท่อน",
      defaultLock: "Yard-Curb",
      defaultRow: "2",
      defaultZone: "ลานขอบคันหิน 4B",
    },
    // คอนกรีตแบริเออร์
    {
      id: "prod-kcon-barrier-single-2m",
      sku: "BARRIER-SINGLE-2M",
      name: "คอนกรีตแบริเออร์หน้าเดี่ยว สูง 0.81 ม. ยาว 2.00 ม.",
      categoryId: "hardscape",
      plantId: 4,
      variant: "หน้าเดี่ยว สูง 0.81 ม. ยาว 2.00 ม.",
      heightValue: "0.81",
      heightUnit: "เมตร",
      lengthValue: "2.00",
      lengthUnit: "เมตร",
      stockUnitId: "ชิ้น",
      defaultLock: "Yard-Barrier",
      defaultRow: "1",
      defaultZone: "ลานแบริเออร์ 4C",
    },
    {
      id: "prod-kcon-barrier-double-2m",
      sku: "BARRIER-DOUBLE-2M",
      name: "คอนกรีตแบริเออร์หน้าคู่ สูง 0.81 ม. ยาว 2.00 ม.",
      categoryId: "hardscape",
      plantId: 4,
      variant: "หน้าคู่ สูง 0.81 ม. ยาว 2.00 ม.",
      heightValue: "0.81",
      heightUnit: "เมตร",
      lengthValue: "2.00",
      lengthUnit: "เมตร",
      stockUnitId: "ชิ้น",
      defaultLock: "Yard-Barrier",
      defaultRow: "2",
      defaultZone: "ลานแบริเออร์ 4C",
    },
    // อิฐบล็อกคอนกรีต มอก.
    {
      id: "prod-kcon-block-070",
      sku: "BLOCK-070",
      name: "อิฐบล็อกคอนกรีต มอก. หนา 7 ซม. (7 x 19 x 39 ซม.)",
      categoryId: "hardscape",
      plantId: 4,
      variant: "7 x 19 x 39 ซม. ผิวหยาบปานกลาง ฉาบง่าย",
      widthValue: "7",
      widthUnit: "ซม.",
      heightValue: "19",
      heightUnit: "ซม.",
      lengthValue: "39",
      lengthUnit: "ซม.",
      stockUnitId: "ก้อน",
      defaultLock: "Yard-Block",
      defaultRow: "1",
      defaultZone: "ลานอิฐบล็อก 4D",
    },
    {
      id: "prod-kcon-block-090",
      sku: "BLOCK-090",
      name: "อิฐบล็อกคอนกรีต มอก. หนา 9 ซม. (9 x 19 x 39 ซม.)",
      categoryId: "hardscape",
      plantId: 4,
      variant: "9 x 19 x 39 ซม. รับแรงอัดสูง",
      widthValue: "9",
      widthUnit: "ซม.",
      heightValue: "19",
      heightUnit: "ซม.",
      lengthValue: "39",
      lengthUnit: "ซม.",
      stockUnitId: "ก้อน",
      defaultLock: "Yard-Block",
      defaultRow: "2",
      defaultZone: "ลานอิฐบล็อก 4D",
    },
    // แผ่นปูทางเท้า
    {
      id: "prod-kcon-pave-30-30-pln",
      sku: "PAVE-30-30-PLN",
      name: "แผ่นปูทางเท้าคอนกรีต ผิวเรียบ 30 x 30 x 5 ซม.",
      categoryId: "hardscape",
      plantId: 4,
      variant: "30 x 30 x 5 ซม. สีซีเมนต์",
      widthValue: "30",
      widthUnit: "ซม.",
      lengthValue: "30",
      lengthUnit: "ซม.",
      heightValue: "5",
      heightUnit: "ซม.",
      stockUnitId: "แผ่น",
      defaultLock: "Yard-Pave",
      defaultRow: "1",
      defaultZone: "ลานแผ่นทางเท้า 4E",
    },
    {
      id: "prod-kcon-pave-blind-dot",
      sku: "PAVE-BLIND-DOT",
      name: "แผ่นทางเท้าเตือนคนตาบอด แบบปุ่มนูน (Warning Dot) 30 x 30 x 5 ซม.",
      categoryId: "hardscape",
      plantId: 4,
      variant: "30 x 30 x 5 ซม. สีเหลือง/ซีเมนต์",
      widthValue: "30",
      widthUnit: "ซม.",
      lengthValue: "30",
      lengthUnit: "ซม.",
      heightValue: "5",
      heightUnit: "ซม.",
      stockUnitId: "แผ่น",
      defaultLock: "Yard-Pave",
      defaultRow: "2",
      defaultZone: "ลานแผ่นทางเท้า 4E",
    },
  ];

  for (const item of kconProducts) {
    // 1. Insert product
    await db
      .insert(schema.products)
      .values({
        id: item.id,
        sku: item.sku,
        name: item.name,
        categoryId: item.categoryId,
        plantId: item.plantId,
        variant: item.variant,
        heightValue: item.heightValue || null,
        heightUnit: item.heightUnit || "เมตร",
        widthValue: item.widthValue || null,
        widthUnit: item.widthUnit || "ซม.",
        lengthValue: item.lengthValue || null,
        lengthUnit: item.lengthUnit || "เมตร",
        stockUnitId: item.stockUnitId,
        currentQuantity: 0, // Set to 0 so staff can count for real
        isActive: true,
      })
      .onConflictDoUpdate({
        target: schema.products.id,
        set: {
          name: item.name,
          categoryId: item.categoryId,
          plantId: item.plantId,
          variant: item.variant,
          stockUnitId: item.stockUnitId,
          currentQuantity: 0,
          isActive: true,
        },
      });

    // 2. Insert storage location
    const locId = `loc-${item.id}`;
    await db
      .insert(schema.storageLocations)
      .values({
        id: locId,
        plantId: item.plantId,
        zone: item.defaultZone,
        lockCode: item.defaultLock,
        rowCode: item.defaultRow,
        description: `จุดวางมาตรฐาน: ${item.name}`,
        active: true,
      })
      .onConflictDoUpdate({
        target: schema.storageLocations.id,
        set: {
          zone: item.defaultZone,
          lockCode: item.defaultLock,
          rowCode: item.defaultRow,
        },
      });

    // 3. Link product_locations
    await db
      .insert(schema.productLocations)
      .values({
        id: `ploc-${item.id}`,
        productId: item.id,
        storageLocationId: locId,
        expectedQuantity: 0,
      })
      .onConflictDoUpdate({
        target: schema.productLocations.id,
        set: {
          expectedQuantity: 0,
        },
      });
  }

  // ─────────────────────────────────────────────────────────────
  // 7. Seed Fresh Active Open Count Round
  // ─────────────────────────────────────────────────────────────
  console.log("Seeding Fresh Open Count Round (Ready for counting)...");
  const roundId = "round-kcon-2026-10";
  const now = new Date();

  await db
    .insert(schema.countRounds)
    .values({
      id: roundId,
      name: "รอบตรวจนับสินค้า ประจำเดือน ตุลาคม 2569 (KCON)",
      type: "MONTHLY",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      status: "OPEN",
      createdBy: "admin",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.countRounds.id,
      set: {
        name: "รอบตรวจนับสินค้า ประจำเดือน ตุลาคม 2569 (KCON)",
        status: "OPEN",
        updatedAt: now,
      },
    });

  console.log("==================================================");
  console.log(`PRODUCTION RESET COMPLETED SUCCESSFULLY!`);
  console.log(`- 2 Real Users: admin (ADMIN) & pcryclc (STAFF)`);
  console.log(`- Products Inserted: ${kconProducts.length} KCON SKUs across Plants 1-4`);
  console.log(`- Initial Quantities: 0 (All ready for counting)`);
  console.log(`- Active Round: OPEN with 0% progress`);
  console.log("==================================================");
}

if (process.argv[1]?.includes("reset-production-kcon")) {
  resetProductionToRealKcon()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("Reset failed:", e);
      process.exit(1);
    });
}
