import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db } from "./index";
import * as schema from "./schema";
import { sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

export async function runSeed() {
  if (!db) {
    console.log("No DATABASE_URL configured, skipping database seed.");
    return;
  }

  console.log("Starting Concrete Stock Count Database Seed...");

  // 0. Seed Company Profile (KCON Public Verifiable Data)
  console.log("Seeding KCON Company Settings...");
  await db
    .insert(schema.companySettings)
    .values({
      id: "default",
      companyNameTh: "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด",
      companyNameEn: "KHON KAEN CONCRETE PRODUCT CO., LTD.",
      brandName: "KCON",
      addressTh:
        "154 หมู่ 9 ถนนมะลิวัลย์ ตำบลบ้านทุ่ม อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000",
      phone: "043-255-111",
      email: "kcon.eng@gmail.com",
      website: "www.kcon-concrete.com",
      logoUrl: null,
      reportFooter:
        "เอกสารรายงานผลการตรวจนับคลังสินค้าคอนกรีต • ระบบ Concrete Mobile Stock Counting",
      dataSourceNotice:
        "ข้อมูลเริ่มต้นจากแหล่งข้อมูลสาธารณะของบริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด (www.kcon-concrete.com)",
    })
    .onConflictDoUpdate({
      target: schema.companySettings.id,
      set: {
        companyNameTh: "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด",
        companyNameEn: "KHON KAEN CONCRETE PRODUCT CO., LTD.",
        brandName: "KCON",
        addressTh:
          "154 หมู่ 9 ถนนมะลิวัลย์ ตำบลบ้านทุ่ม อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000",
        phone: "043-255-111",
        email: "kcon.eng@gmail.com",
        website: "www.kcon-concrete.com",
      },
    });

  // 1. Seed Plants
  console.log("Seeding Plants...");
  const plantsData = [
    {
      id: 1,
      code: "PLANT-1",
      name: "โรง 1 คลังวัตถุดิบ",
      description: "ปูน, หิน, ทราย, เหล็กเส้น, ลวดอัดแรง, น้ำยาผสม",
      active: true,
    },
    {
      id: 2,
      code: "PLANT-2",
      name: "โรง 2 คลังสินค้า (เสารั้ว/เสาไอ)",
      description: "โรงผลิตและเก็บเสารั้ว, เสาไอ, เสาเข็มคอนกรีตอัดแรง",
      active: true,
    },
    {
      id: 3,
      code: "PLANT-3",
      name: "โรง 3 ผลิตภัณฑ์สำเร็จรูป",
      description: "โรงผลิตและเก็บแผ่นพื้นสำเร็จรูป Hollowcore / ท้องเรียบ",
      active: true,
    },
    {
      id: 4,
      code: "PLANT-4",
      name: "โรง 4 ผลิตภัณฑ์คอนกรีตภายนอก",
      description: "โรงผลิตและเก็บผนังคอนกรีต L-Wall, ท่อระบายน้ำ",
      active: true,
    },
  ];

  for (const p of plantsData) {
    await db
      .insert(schema.plants)
      .values(p)
      .onConflictDoUpdate({ target: schema.plants.id, set: p });
  }

  // 2. Seed Categories (KCON Public Product Families)
  console.log("Seeding Categories...");
  const categoriesData = [
    { id: "finished_goods", code: "FG", name: "สินค้าสำเร็จรูปทั่วไป", active: true },
    { id: "piles", code: "PIL", name: "เสาเข็มคอนกรีตอัดแรง", active: true },
    { id: "solid_slabs", code: "SLB", name: "แผ่นพื้นตัน / ท้องเรียบ", active: true },
    { id: "hollowcore", code: "HC", name: "แผ่นพื้นกลวง Hollow Core", active: true },
    { id: "post_tension", code: "PT", name: "คอนกรีต Post-Tension", active: true },
    { id: "bridge_girders", code: "BG", name: "คานสะพาน", active: true },
    { id: "precast_beams", code: "BM", name: "คานสำเร็จรูป", active: true },
    { id: "retaining_wall", code: "RW", name: "กำแพงกันดิน / L-Wall", active: true },
    { id: "fence_posts", code: "FP", name: "เสารั้วคอนกรีต", active: true },
    { id: "curbstones", code: "CB", name: "ขอบคันหิน", active: true },
    { id: "concrete_blocks", code: "BLK", name: "คอนกรีตบล็อก / อิฐบล็อก", active: true },
    { id: "pipes", code: "PIP", name: "ท่อระบายน้ำคอนกรีต", active: true },
    { id: "precast_walls", code: "PW", name: "ผนังสำเร็จรูป Precast", active: true },
    { id: "made_to_order", code: "MTO", name: "คอนกรีตสั่งทำพิเศษ (Made to Order)", active: true },
    { id: "raw_material", code: "RM", name: "วัตถุดิบและวัสดุการผลิต", active: true },
    { id: "consumables", code: "CON", name: "วัสดุสิ้นเปลือง", active: true },
    { id: "others", code: "OTH", name: "อื่น ๆ", active: true },
  ];

  for (const c of categoriesData) {
    await db
      .insert(schema.productCategories)
      .values(c)
      .onConflictDoUpdate({ target: schema.productCategories.id, set: c });
  }

  // 3. Seed Units
  console.log("Seeding Units...");
  const unitsData = [
    { id: "ต้น", code: "TON", name: "ต้น", symbol: "ต้น", active: true },
    { id: "แผ่น", code: "PAN", name: "แผ่น", symbol: "แผ่น", active: true },
    { id: "ท่อน", code: "THN", name: "ท่อน", symbol: "ท่อน", active: true },
    { id: "ชิ้น", code: "PCS", name: "ชิ้น", symbol: "ชิ้น", active: true },
    { id: "อัน", code: "UN", name: "อัน", symbol: "อัน", active: true },
    { id: "ก้อน", code: "BLK", name: "ก้อน", symbol: "ก้อน", active: true },
    { id: "ถุง", code: "BAG", name: "ถุง", symbol: "ถุง", active: true },
    { id: "กิโลกรัม", code: "KG", name: "กิโลกรัม", symbol: "กก.", active: true },
    { id: "กก.", code: "KG2", name: "กก.", symbol: "กก.", active: true },
    { id: "ตัน", code: "TONNE", name: "ตัน", symbol: "ตัน", active: true },
    { id: "เมตร", code: "M", name: "เมตร", symbol: "ม.", active: true },
    { id: "คิว", code: "M3", name: "คิว", symbol: "คิว", active: true },
    { id: "ม้วน", code: "ROL", name: "ม้วน", symbol: "ม้วน", active: true },
    { id: "เส้น", code: "BAR", name: "เส้น", symbol: "เส้น", active: true },
    { id: "ลิตร", code: "LTR", name: "ลิตร", symbol: "ลิตร", active: true },
    { id: "ชุด", code: "SET", name: "ชุด", symbol: "ชุด", active: true },
    { id: "พาเลท", code: "PLT", name: "พาเลท", symbol: "พาเลท", active: true },
  ];

  for (const u of unitsData) {
    await db
      .insert(schema.units)
      .values(u)
      .onConflictDoUpdate({ target: schema.units.id, set: u });
  }

  // 4. Seed Storage Locations
  console.log("Seeding Storage Locations...");
  const locationsData = [
    // Plant 2 Locations
    { id: "loc-p2-a3-6", plantId: 2, zone: "Yard-1", lockCode: "A3", rowCode: "6", description: "ลานเสารั้ว ฝั่งทิศเหนือ", active: true },
    { id: "loc-p2-b3-2", plantId: 2, zone: "Yard-1", lockCode: "B3", rowCode: "2", description: "ลานเสารั้ว ฝั่งกลาง", active: true },
    { id: "loc-p2-b5-1", plantId: 2, zone: "Yard-1", lockCode: "B5", rowCode: "1", description: "ลานเสารั้ว จุดตรวจรับ", active: true },
    { id: "loc-p2-yard1-1", plantId: 2, zone: "Yard-1", lockCode: "Yard-1", rowCode: "1", description: "ลานรวม 1", active: true },
    // Plant 1 Locations
    { id: "loc-p1-sila-1", plantId: 1, zone: "ไซโลปูน", lockCode: "Sil-A", rowCode: "1", description: "ไซโลปูน A", active: true },
    { id: "loc-p1-silb-1", plantId: 1, zone: "ไซโลปูน", lockCode: "Sil-B", rowCode: "1", description: "ไซโลปูน B", active: true },
    { id: "loc-p1-rma-1", plantId: 1, zone: "คลังวัตถุดิบ 1", lockCode: "RM-A", rowCode: "1", description: "กองเหล็กเส้น", active: true },
    // Plant 3 Locations
    { id: "loc-p3-hc-1", plantId: 3, zone: "Yard แผ่นพื้น", lockCode: "HC-A", rowCode: "1", description: "ลานแผ่นพื้น A", active: true },
    // Plant 4 Locations
    { id: "loc-p4-lw-1", plantId: 4, zone: "Yard L-Wall", lockCode: "LW-1", rowCode: "1", description: "ลาน L-Wall", active: true },
  ];

  for (const loc of locationsData) {
    await db
      .insert(schema.storageLocations)
      .values(loc)
      .onConflictDoUpdate({ target: schema.storageLocations.id, set: loc });
  }

  // 5. Seed Users & Profiles (Better Auth) - Only in DEMO_MODE
  if (process.env.DEMO_MODE === "true") {
    console.log("Seeding Demo Users & Profiles (DEMO_MODE=true)...");
    const usersData = [
      {
        id: "user-admin",
        name: "Admin Demo",
        email: "admin@concretefactory.co.th",
        role: "ADMIN",
        fullName: "ชัยวัฒน์ (หัวหน้าคลัง)",
        employeeCode: "ADM-001",
        plantId: 1,
        phone: "089-999-8888",
      },
      {
        id: "user-1",
        name: "สมชาย ใจมั่นคง",
        email: "somchai@concretefactory.co.th",
        role: "STAFF",
        fullName: "สมชาย ใจมั่นคง",
        employeeCode: "STF-001",
        plantId: 1,
        phone: "081-234-5678",
      },
      {
        id: "user-2",
        name: "วิชัย สุวรรณโชติ",
        email: "wichai@concretefactory.co.th",
        role: "STAFF",
        fullName: "วิชัย สุวรรณโชติ",
        employeeCode: "STF-002",
        plantId: 2,
        phone: "082-345-6789",
      },
      {
        id: "user-3",
        name: "นิตยา รักษ์พงษ์",
        email: "nittaya@concretefactory.co.th",
        role: "STAFF",
        fullName: "นิตยา รักษ์พงษ์",
        employeeCode: "STF-003",
        plantId: 3,
        phone: "083-456-7890",
      },
      {
        id: "user-4",
        name: "สมพร ทรัพย์ประเสริฐ",
        email: "somporn@concretefactory.co.th",
        role: "STAFF",
        fullName: "สมพร ทรัพย์ประเสริฐ",
        employeeCode: "STF-004",
        plantId: 4,
        phone: "084-567-8901",
      },
    ];

    for (const u of usersData) {
      // Upsert User
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

      // Upsert Profile
      await db
        .insert(schema.profiles)
        .values({
          id: `prof-${u.id}`,
          userId: u.id,
          fullName: u.fullName,
          employeeCode: u.employeeCode,
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

      // Upsert Better Auth Credential Account
      const defaultPasswordHash = await hashPassword("Demo1234!");
      await db
        .insert(schema.account)
        .values({
          id: `acc-${u.id}`,
          accountId: u.id,
          providerId: "credential",
          userId: u.id,
          password: defaultPasswordHash,
        })
        .onConflictDoUpdate({
          target: schema.account.id,
          set: {
            password: defaultPasswordHash,
          },
        });
    }
  } else {
    console.log("Skipping demo users seed (DEMO_MODE is not true).");
  }

  // 6. Seed Featured Products (including FP-250-18)
  console.log("Seeding Products...");
  const productsData = [
    {
      id: "prod-fp-250-18",
      sku: "FP-250-18",
      name: "เสารั้วคอนกรีต",
      categoryId: "finished_goods",
      plantId: 2,
      variant: "ลวด 4 เส้น",
      heightValue: "2.50",
      heightUnit: "เมตร",
      widthValue: "18",
      widthUnit: "นิ้ว",
      lengthValue: "2.50",
      lengthUnit: "เมตร",
      stockUnitId: "ต้น",
      currentQuantity: 118,
      isActive: true,
    },
    {
      id: "prod-pl-300",
      sku: "HC-300-35",
      name: "แผ่นพื้นคอนกรีตสำเร็จรูป Hollowcore",
      categoryId: "finished_goods",
      plantId: 3,
      variant: "หนา 10 ซม.",
      heightValue: "0.10",
      heightUnit: "เมตร",
      widthValue: "35",
      widthUnit: "ซม.",
      lengthValue: "3.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      currentQuantity: 300,
      isActive: true,
    },
    {
      id: "prod-lw-200",
      sku: "LW-200-15",
      name: "ผนังกันดินสำเร็จรูป L-Wall",
      categoryId: "finished_goods",
      plantId: 4,
      variant: "Standard",
      heightValue: "2.00",
      heightUnit: "เมตร",
      widthValue: "1.50",
      widthUnit: "เมตร",
      lengthValue: "2.00",
      lengthUnit: "เมตร",
      stockUnitId: "แผ่น",
      currentQuantity: 85,
      isActive: true,
    },
    {
      id: "prod-cem-01",
      sku: "CEM-TYPE1",
      name: "ปูนซีเมนต์ปอร์ตแลนด์ Type 1",
      categoryId: "raw_material",
      plantId: 1,
      variant: "ผงในไซโล",
      stockUnitId: "ตัน",
      currentQuantity: 25,
      isActive: true,
    },
    {
      id: "prod-steel-rb9",
      sku: "STL-RB9",
      name: "เหล็กเส้นกลม SR24 RB9",
      categoryId: "raw_material",
      plantId: 1,
      variant: "ยาว 10 เมตร [DEMO]",
      stockUnitId: "เส้น",
      currentQuantity: 400,
      isActive: true,
    },
    // KCON Public Verifiable Raw Material Families
    {
      id: "prod-cem-type3",
      sku: "CEM-TYPE3",
      name: "ปูนซีเมนต์ปอร์ตแลนด์ Type 3 (High Early Strength)",
      categoryId: "raw_material",
      plantId: 1,
      variant: "ปูนซีเมนต์ปอร์ตแลนด์ประเภท 3 แข็งตัวเร็ว [DEMO]",
      stockUnitId: "ตัน",
      currentQuantity: 45,
      isActive: true,
    },
    {
      id: "prod-agg-crush",
      sku: "AGG-CRUSH",
      name: "หิน 1 นิ้ว - 3/8 นิ้ว (หินย่อยผสมคอนกรีต)",
      categoryId: "raw_material",
      plantId: 1,
      variant: "หินผสมคอนกรีตอัดแรง [DEMO]",
      stockUnitId: "คิว",
      currentQuantity: 320,
      isActive: true,
    },
    {
      id: "prod-snd-coarse",
      sku: "SND-COARSE",
      name: "ทรายหยาบ (ทรายผสมคอนกรีต)",
      categoryId: "raw_material",
      plantId: 1,
      variant: "ทรายหยาบคัดเกรด [DEMO]",
      stockUnitId: "คิว",
      currentQuantity: 280,
      isActive: true,
    },
    {
      id: "prod-pc-wire",
      sku: "PC-WIRE",
      name: "ลวดเหล็กแรงดึงสูง PC Wire (4 มม.)",
      categoryId: "raw_material",
      plantId: 1,
      variant: "ลวดอัดแรงสำหรับเสารั้วและแผ่นพื้น [DEMO]",
      stockUnitId: "ตัน",
      currentQuantity: 18,
      isActive: true,
    },
    {
      id: "prod-pc-strand",
      sku: "PC-STRAND",
      name: "ลวดตีเกลียวแรงดึงสูง PC Strand (3/8 นิ้ว 7 เส้น)",
      categoryId: "raw_material",
      plantId: 1,
      variant: "ลวดตีเกลียวแรงดึงสูงสำหรับเสาเข็มและคาน [DEMO]",
      stockUnitId: "ตัน",
      currentQuantity: 24,
      isActive: true,
    },
    {
      id: "prod-adm-chem",
      sku: "ADM-CHEM",
      name: "น้ำยาผสมคอนกรีต (Type F Superplasticizer)",
      categoryId: "raw_material",
      plantId: 1,
      variant: "น้ำยาลดน้ำกำลังอัดสูงพิเศษ [DEMO]",
      stockUnitId: "ลิตร",
      currentQuantity: 1500,
      isActive: true,
    },
    // KCON Public Verifiable Product Lines
    {
      id: "prod-pil-i26",
      sku: "PIL-I26",
      name: "เสาเข็มคอนกรีตอัดแรง ไอ-26 (ยาว 12.00 ม.)",
      categoryId: "piles",
      plantId: 2,
      variant: "เสาเข็มคอนกรีตอัดแรง มอก. 396-2549 [DEMO]",
      stockUnitId: "ต้น",
      currentQuantity: 65,
      isActive: true,
    },
    {
      id: "prod-cb-std",
      sku: "CB-STD",
      name: "ขอบคันหินคอนกรีตมาตรฐาน 15x30x100 ซม.",
      categoryId: "curbstones",
      plantId: 4,
      variant: "ขอบคันหินรางน้ำคอนกรีต [DEMO]",
      stockUnitId: "ท่อน",
      currentQuantity: 140,
      isActive: true,
    },
    {
      id: "prod-pipe-100",
      sku: "PIPE-100",
      name: "ท่อระบายน้ำคอนกรีตเสริมเหล็ก คสล. ชั้น 3 ศก. 1.00 ม.",
      categoryId: "pipes",
      plantId: 4,
      variant: "ท่อระบายน้ำ คสล. มอก. 128-2560 [DEMO]",
      stockUnitId: "ท่อน",
      currentQuantity: 92,
      isActive: true,
    },
  ];

  for (const p of productsData) {
    await db
      .insert(schema.products)
      .values(p)
      .onConflictDoUpdate({ target: schema.products.id, set: p });
  }

  // 7. Seed Master Locations for FP-250-18: A3/6 = 40, B3/2 = 20, B5/1 = 58
  console.log("Seeding Product Master Locations for FP-250-18...");
  const prodLocations = [
    {
      id: "ploc-fp-a3-6",
      productId: "prod-fp-250-18",
      storageLocationId: "loc-p2-a3-6",
      expectedQuantity: 40,
      isPrimary: false,
      active: true,
    },
    {
      id: "ploc-fp-b3-2",
      productId: "prod-fp-250-18",
      storageLocationId: "loc-p2-b3-2",
      expectedQuantity: 20,
      isPrimary: false,
      active: true,
    },
    {
      id: "ploc-fp-b5-1",
      productId: "prod-fp-250-18",
      storageLocationId: "loc-p2-b5-1",
      expectedQuantity: 58,
      isPrimary: true,
      active: true,
    },
  ];

  for (const pl of prodLocations) {
    await db
      .insert(schema.productLocations)
      .values(pl)
      .onConflictDoUpdate({ target: schema.productLocations.id, set: pl });
  }

  // 8. Seed Count Round (Active Monthly Round)
  console.log("Seeding Active Count Round...");
  const roundId = "round-2026-10-monthly";
  await db
    .insert(schema.countRounds)
    .values({
      id: roundId,
      name: "รอบนับประจำเดือน ตุลาคม 2569",
      type: "MONTHLY",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      status: "OPEN",
      createdBy: "Admin Demo",
    })
    .onConflictDoUpdate({
      target: schema.countRounds.id,
      set: { status: "OPEN" },
    });

  for (const plantId of [1, 2, 3, 4]) {
    await db
      .insert(schema.countRoundPlants)
      .values({
        id: `crp-${roundId}-${plantId}`,
        roundId: roundId,
        plantId: plantId,
      })
      .onConflictDoNothing();
  }

  console.log("Database Seed completed successfully!");
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed error:", err);
      process.exit(1);
    });
}
