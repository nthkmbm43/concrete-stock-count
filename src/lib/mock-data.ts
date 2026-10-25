import {
  Plant,
  InventoryItem,
  CountRound,
  StockCount,
  StockAdjustment,
  UserProfile,
  StorageLocation,
} from "./types";

export const MOCK_USERS: UserProfile[] = [
  {
    id: "user-1",
    email: "somchai@concretefactory.co.th",
    full_name: "สมชาย ใจมั่นคง",
    role: "STAFF",
    plant_id: 1,
    phone: "081-234-5678",
  },
  {
    id: "user-2",
    email: "wichai@concretefactory.co.th",
    full_name: "วิชัย สุวรรณโชติ",
    role: "STAFF",
    plant_id: 2,
    phone: "082-345-6789",
  },
  {
    id: "user-3",
    email: "nittaya@concretefactory.co.th",
    full_name: "นิตยา รักษ์พงษ์",
    role: "STAFF",
    plant_id: 3,
    phone: "083-456-7890",
  },
  {
    id: "user-4",
    email: "somporn@concretefactory.co.th",
    full_name: "สมพร ทรัพย์ประเสริฐ",
    role: "STAFF",
    plant_id: 4,
    phone: "084-567-8901",
  },
  {
    id: "user-admin",
    email: "admin@concretefactory.co.th",
    full_name: "ชัยวัฒน์ (หัวหน้าคลัง)",
    role: "ADMIN",
    plant_id: 1,
    phone: "089-999-8888",
  },
];

export const MOCK_PLANTS: Plant[] = [
  {
    id: 1,
    name: "โรง 1 คลังวัตถุดิบ",
    code: "PLANT-1",
    description: "ปูน, หิน, ทราย, เหล็กเส้น, ลวดอัดแรง, น้ำยาผสม",
    total_skus: 125,
  },
  {
    id: 2,
    name: "โรง 2 คลังสินค้า",
    code: "PLANT-2",
    description: "โรงผลิต + เก็บเสารั้ว, เสาไอ, เสาเข็มคอนกรีตอัดแรง",
    total_skus: 75,
  },
  {
    id: 3,
    name: "โรง 3 ผลิตภัณฑ์สำเร็จรูป",
    code: "PLANT-3",
    description: "โรงผลิต + แผ่นพื้นสำเร็จรูป Plank, Hollow core",
    total_skus: 96,
  },
  {
    id: 4,
    name: "โรง 4 สินค้าภายนอก",
    code: "PLANT-4",
    description: "โรงผลิต + แผ่นผนังกันดิน L-Wall, ท่อ คสล., บ่อพัก",
    total_skus: 110,
  },
];

export const MOCK_STORAGE_LOCATIONS: StorageLocation[] = [
  { id: "loc-a3-6", plant_id: 2, lock_code: "A3", row_code: "6", is_active: true, description: "ลานเสารั้ว โซนทิศเหนือ" },
  { id: "loc-b3-2", plant_id: 2, lock_code: "B3", row_code: "2", is_active: true, description: "ลานเสารั้ว กองสำรองกลาง" },
  { id: "loc-b5-1", plant_id: 2, lock_code: "B5", row_code: "1", is_active: true, description: "ลานเสารั้ว โซนทิศใต้ติดทางออก" },
  { id: "loc-c2-3", plant_id: 2, lock_code: "C2", row_code: "3", is_active: true, description: "ลานจัดส่งชั่วคราว" },
  { id: "loc-a1-1", plant_id: 1, lock_code: "S1", row_code: "1", is_active: true, description: "ไซโลปูนซีเมนต์ A" },
  { id: "loc-a1-2", plant_id: 1, lock_code: "Y1", row_code: "1", is_active: true, description: "ลานทรายหยาบ" },
  { id: "loc-p3-1", plant_id: 3, lock_code: "P1", row_code: "3", is_active: true, description: "ลานแผ่นพื้น โซน 1" },
  { id: "loc-p3-2", plant_id: 3, lock_code: "P2", row_code: "1", is_active: true, description: "ลานแผ่นพื้น โซน 2" },
  { id: "loc-p4-1", plant_id: 4, lock_code: "W1", row_code: "2", is_active: true, description: "ลานผนังกันดิน L-Wall" },
];

export const MOCK_ROUNDS: CountRound[] = [
  {
    id: "round-oct-2569",
    name: "รอบนับประจำเดือน ตุลาคม 2569",
    title: "รอบนับประจำเดือน ตุลาคม 2569",
    type: "MONTHLY",
    count_type: "MONTHLY",
    start_date: "2026-10-01",
    end_date: "2026-10-31",
    status: "OPEN",
    plant_ids: [1, 2, 3, 4],
    notes: "รอบตรวจนับสต๊อกสิ้นเดือนหลัก ครอบคลุมคลังวัตถุดิบและโรงผลิต 1-4",
    created_at: "2026-10-01T08:00:00Z",
  },
  {
    id: "round-recount-p2",
    name: "ตรวจสต๊อกเพิ่มเติม โรง 2 (เสารั้ว)",
    title: "ตรวจสต๊อกเพิ่มเติม โรง 2 (เสารั้ว)",
    type: "WEEKLY",
    count_type: "WEEKLY",
    start_date: "2026-10-24",
    end_date: "2026-10-28",
    status: "OPEN",
    plant_ids: [2],
    notes: "สุ่มตรวจความถูกต้องเสารั้วคอนกรีตอัดแรงรุ่นขายดี",
    created_at: "2026-10-24T08:00:00Z",
  },
  {
    id: "round-sep-2569",
    name: "รอบนับประจำเดือน กันยายน 2569",
    title: "รอบนับประจำเดือน กันยายน 2569",
    type: "MONTHLY",
    count_type: "MONTHLY",
    start_date: "2026-09-01",
    end_date: "2026-09-30",
    status: "CLOSED",
    plant_ids: [1, 2, 3, 4],
    notes: "ปิดรอบแล้ว ยอดกระทบเข้าสมุดบัญชีเรียบร้อย",
    created_at: "2026-09-01T08:00:00Z",
  },
];

function generateItems(): InventoryItem[] {
  const items: InventoryItem[] = [];

  // Plant 2 - Featured Item from mockup and requirements!
  // SKU: FP-250-18, เสารั้วคอนกรีต, สูง 2.50 ม., หน้า 18 นิ้ว, โรง 2
  // Distributed across:
  // - ล็อค A3 • แถว 6: 40 ต้น
  // - ล็อค B3 • แถว 2: 20 ต้น
  // - ล็อค B5 • แถว 1: 58 ต้น (ระบบ 58, นับได้ 60, ผลต่าง +2)
  // รวมในระบบ: 118 ต้น
  const fp250Item: InventoryItem = {
    id: "p2-item-fp250",
    sku: "FP-250-18",
    name: "เสารั้วคอนกรีต",
    category: "finished_goods",
    variant: "หน้า 18 นิ้ว ลวด 4 เส้น",
    size: "2.50 ม. • หน้า 18 นิ้ว",
    height: "2.50 ม.",
    width: "18 นิ้ว",
    length: "2.50 ม.",
    unit: "ต้น",
    plant_id: 2,
    zone: "ล็อค A3, B3, B5",
    current_quantity: 118,
    last_counted_at: "2026-10-26T09:15:00Z",
    last_counted_by: "user-2",
    last_counted_by_name: "วิชัย สุวรรณโชติ",
    status: "ACTIVE",
    is_active: true,
    locations: [
      { id: "loc-map-1", inventory_item_id: "p2-item-fp250", storage_location_id: "loc-a3-6", lock_code: "A3", row_code: "6", expected_quantity: 40 },
      { id: "loc-map-2", inventory_item_id: "p2-item-fp250", storage_location_id: "loc-b3-2", lock_code: "B3", row_code: "2", expected_quantity: 20 },
      { id: "loc-map-3", inventory_item_id: "p2-item-fp250", storage_location_id: "loc-b5-1", lock_code: "B5", row_code: "1", expected_quantity: 58 },
    ],
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-10-26T09:15:00Z",
  };
  items.push(fp250Item);

  const p2OtherFeatured = [
    {
      sku: "FP-200-15",
      name: "เสารั้วคอนกรีต",
      variant: "หน้า 15 นิ้ว ลวด 4 เส้น",
      size: "2.00 ม. • หน้า 15 นิ้ว",
      height: "2.00 ม.",
      width: "15 นิ้ว",
      unit: "ต้น",
      qty: 95,
      locations: [
        { lock_code: "A1", row_code: "4", expected: 50 },
        { lock_code: "A2", row_code: "1", expected: 45 },
      ],
    },
    {
      sku: "FP-300-18",
      name: "เสารั้วคอนกรีต",
      variant: "หน้า 18 นิ้ว ลวด 6 เส้น",
      size: "3.00 ม. • หน้า 18 นิ้ว",
      height: "3.00 ม.",
      width: "18 นิ้ว",
      unit: "ต้น",
      qty: 84,
      locations: [
        { lock_code: "B1", row_code: "5", expected: 44 },
        { lock_code: "B2", row_code: "3", expected: 40 },
      ],
    },
    {
      sku: "IB-150",
      name: "เสาไอคอนกรีตอัดแรง (I-Beam)",
      variant: "ไอ 15 ซม.",
      size: "4.00 ม. • ไอ 15 ซม.",
      height: "4.00 ม.",
      width: "15 ซม.",
      unit: "ต้น",
      qty: 45,
      locations: [
        { lock_code: "C1", row_code: "1", expected: 45 },
      ],
    },
    {
      sku: "PL-018",
      name: "เสาเข็มหกเหลี่ยมกลวง คอร. มอก.",
      variant: "เส้นผ่านศูนย์กลาง 15 ซม.",
      size: "4.00 ม. • Ø 15 ซม.",
      height: "4.00 ม.",
      width: "15 ซม.",
      unit: "ท่อน",
      qty: 150,
      locations: [
        { lock_code: "D1", row_code: "2", expected: 80 },
        { lock_code: "D1", row_code: "3", expected: 70 },
      ],
    },
  ];

  p2OtherFeatured.forEach((item, idx) => {
    items.push({
      id: `p2-item-${idx + 2}`,
      sku: item.sku,
      name: item.name,
      category: "finished_goods",
      variant: item.variant,
      size: item.size,
      height: item.height,
      width: item.width,
      unit: item.unit,
      plant_id: 2,
      zone: item.locations.map((l) => `${l.lock_code}/${l.row_code}`).join(", "),
      current_quantity: item.qty,
      last_counted_at: "2026-10-25T10:00:00Z",
      last_counted_by: "user-2",
      last_counted_by_name: "วิชัย สุวรรณโชติ",
      status: "ACTIVE",
      is_active: true,
      locations: item.locations.map((l, lIdx) => ({
        id: `loc-map-p2-${idx}-${lIdx}`,
        inventory_item_id: `p2-item-${idx + 2}`,
        lock_code: l.lock_code,
        row_code: l.row_code,
        expected_quantity: l.expected,
      })),
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-25T10:00:00Z",
    });
  });

  // Fill Plant 2 up to 75
  for (let i = p2OtherFeatured.length + 2; i <= 75; i++) {
    const isUncounted = i > 65;
    const lA = 20 + (i % 20);
    const lB = 15 + ((i * 2) % 30);
    items.push({
      id: `p2-item-${i}`,
      sku: `CP-P2-${i.toString().padStart(3, "0")}`,
      name: `เสาคอนกรีตโครงสร้างพิเศษ รุ่น P2-${i}`,
      category: "finished_goods",
      variant: `มอก. ลวด ${(i % 3 + 4)} เส้น`,
      size: `${(2.0 + (i % 8) * 0.5).toFixed(2)} ม. • หน้า 15 นิ้ว`,
      height: `${(2.0 + (i % 8) * 0.5).toFixed(2)} ม.`,
      width: "15 นิ้ว",
      unit: "ต้น",
      plant_id: 2,
      zone: `ล็อค A${i % 5 + 1} แถว ${i % 4 + 1}`,
      current_quantity: isUncounted ? 40 : lA + lB,
      last_counted_at: isUncounted ? undefined : "2026-10-25T15:30:00Z",
      last_counted_by: isUncounted ? undefined : "user-2",
      last_counted_by_name: isUncounted ? undefined : "วิชัย สุวรรณโชติ",
      status: "ACTIVE",
      is_active: true,
      locations: [
        {
          id: `loc-map-p2-${i}-1`,
          inventory_item_id: `p2-item-${i}`,
          lock_code: `A${i % 5 + 1}`,
          row_code: `${i % 4 + 1}`,
          expected_quantity: isUncounted ? 40 : lA + lB,
        },
      ],
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-25T15:30:00Z",
    });
  }

  // Plant 1: Raw Materials (125 items)
  const rawMaterials = [
    { sku: "RM-CEM-01", name: "ปูนซีเมนต์ปอร์ตแลนด์ Type 1 ตราช้าง", variant: "ถุง 50 กก.", size: "50 กก.", unit: "ถุง", qty: 2450, lock: "Sil-A", row: "1" },
    { sku: "RM-CEM-02", name: "ปูนซีเมนต์ปอร์ตแลนด์ Type 3 (แข็งตัวเร็ว)", variant: "Bulk ไซโล", size: "1 ตัน", unit: "ตัน", qty: 45, lock: "Sil-B", row: "1" },
    { sku: "RM-SND-01", name: "ทรายหยาบคัดเกรดล้างสะอาด", variant: "กองลานทราย", size: "1 คิว", unit: "คิว", qty: 380, lock: "Yard-1", row: "1" },
    { sku: "RM-RCK-01", name: "หินปูนเบอร์ 1 (3/8 นิ้ว)", variant: "กองลานหิน", size: "1 คิว", unit: "คิว", qty: 420, lock: "Yard-2", row: "1" },
    { sku: "RM-STL-09", name: "เหล็กเส้นกลม SR24 ขนาด 9 มม.", variant: "มัดละ 100 เส้น", size: "ยาว 10 ม.", unit: "เส้น", qty: 850, lock: "Steel-A", row: "2" },
    { sku: "RM-PCW-04", name: "ลวดอัดแรง PC Wire ชนิดหยัก 4 มม.", variant: "ขด Coil ใหญ่", size: "ขด 1,000 กก.", unit: "ขด", qty: 18, lock: "Wire-1", row: "1" },
  ];

  rawMaterials.forEach((item, idx) => {
    items.push({
      id: `p1-item-${idx + 1}`,
      sku: item.sku,
      name: item.name,
      category: "raw_material",
      variant: item.variant,
      size: item.size,
      unit: item.unit,
      plant_id: 1,
      zone: `ล็อค ${item.lock} แถว ${item.row}`,
      current_quantity: item.qty,
      last_counted_at: "2026-10-25T11:30:00Z",
      last_counted_by: "user-1",
      last_counted_by_name: "สมชาย ใจมั่นคง",
      status: "ACTIVE",
      is_active: true,
      locations: [
        {
          id: `loc-map-p1-${idx}`,
          inventory_item_id: `p1-item-${idx + 1}`,
          lock_code: item.lock,
          row_code: item.row,
          expected_quantity: item.qty,
        },
      ],
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-25T11:30:00Z",
    });
  });

  for (let i = rawMaterials.length + 1; i <= 125; i++) {
    items.push({
      id: `p1-item-${i}`,
      sku: `RM-MISC-${i.toString().padStart(3, "0")}`,
      name: `วัสดุสิ้นเปลือง/อะไหล่แบบหล่อ รุ่น RM-${i}`,
      category: "raw_material",
      variant: "มาตรฐานคลัง",
      size: `เบอร์ ${i % 10 + 1}`,
      unit: i % 2 === 0 ? "ชิ้น" : "กล่อง",
      plant_id: 1,
      zone: `ล็อค S${i % 4 + 1} แถว 1`,
      current_quantity: 50 + (i * 3) % 150,
      last_counted_at: "2026-10-25T14:00:00Z",
      last_counted_by: "user-1",
      last_counted_by_name: "สมชาย ใจมั่นคง",
      status: "ACTIVE",
      is_active: true,
      locations: [
        {
          id: `loc-map-p1-${i}`,
          inventory_item_id: `p1-item-${i}`,
          lock_code: `S${i % 4 + 1}`,
          row_code: "1",
          expected_quantity: 50 + (i * 3) % 150,
        },
      ],
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-25T14:00:00Z",
    });
  }

  // Plant 3: Plank & Hollow Core (96 items)
  const p3Featured = [
    { sku: "SL-200", name: "แผ่นพื้นคอนกรีตสำเร็จรูป Plank", variant: "หนา 5 ซม. ลวด 4 เส้น", size: "2.00 ม. • กว้าง 35 ซม.", height: "2.00 ม.", width: "35 ซม.", unit: "แผ่น", qty: 65, lock: "P1", row: "1" },
    { sku: "SL-300", name: "แผ่นพื้นคอนกรีตสำเร็จรูป Plank", variant: "หนา 5 ซม. ลวด 6 เส้น", size: "3.00 ม. • กว้าง 35 ซม.", height: "3.00 ม.", width: "35 ซม.", unit: "แผ่น", qty: 56, lock: "P1", row: "3" },
    { sku: "HC-06-25", name: "แผ่นพื้นฮอลโลว์คอร์ (Hollow Core)", variant: "หนา 6 ซม. กว้าง 60 ซม.", size: "2.50 ม. • กว้าง 60 ซม.", height: "2.50 ม.", width: "60 ซม.", unit: "แผ่น", qty: 40, lock: "HC-A", row: "2" },
  ];

  p3Featured.forEach((item, idx) => {
    items.push({
      id: `p3-item-${idx + 1}`,
      sku: item.sku,
      name: item.name,
      category: "finished_goods",
      variant: item.variant,
      size: item.size,
      height: item.height,
      width: item.width,
      unit: item.unit,
      plant_id: 3,
      zone: `ล็อค ${item.lock} แถว ${item.row}`,
      current_quantity: item.qty,
      last_counted_at: "2026-10-26T08:30:00Z",
      last_counted_by: "user-3",
      last_counted_by_name: "นิตยา รักษ์พงษ์",
      status: "ACTIVE",
      is_active: true,
      locations: [
        {
          id: `loc-map-p3-${idx}`,
          inventory_item_id: `p3-item-${idx + 1}`,
          lock_code: item.lock,
          row_code: item.row,
          expected_quantity: item.qty,
        },
      ],
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-26T08:30:00Z",
    });
  });

  for (let i = p3Featured.length + 1; i <= 96; i++) {
    const isUncounted = i > 52;
    items.push({
      id: `p3-item-${i}`,
      sku: `SL-EXT-${i.toString().padStart(3, "0")}`,
      name: `แผ่นพื้นสั่งทำพิเศษ P3-${i}`,
      category: "finished_goods",
      variant: "มาตรฐาน มอก.",
      size: `${(2.2 + (i % 6) * 0.4).toFixed(2)} ม. • กว้าง 35 ซม.`,
      height: `${(2.2 + (i % 6) * 0.4).toFixed(2)} ม.`,
      unit: "แผ่น",
      plant_id: 3,
      zone: `ล็อค P${i % 3 + 1} แถว ${i % 4 + 1}`,
      current_quantity: isUncounted ? 30 : 15 + (i * 3) % 60,
      last_counted_at: isUncounted ? undefined : "2026-10-25T14:15:00Z",
      last_counted_by: isUncounted ? undefined : "user-3",
      last_counted_by_name: isUncounted ? undefined : "นิตยา รักษ์พงษ์",
      status: "ACTIVE",
      is_active: true,
      locations: [
        {
          id: `loc-map-p3-${i}`,
          inventory_item_id: `p3-item-${i}`,
          lock_code: `P${i % 3 + 1}`,
          row_code: `${i % 4 + 1}`,
          expected_quantity: isUncounted ? 30 : 15 + (i * 3) % 60,
        },
      ],
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-25T14:15:00Z",
    });
  }

  // Plant 4: Infrastructure & L-Wall (110 items)
  const p4Featured = [
    { sku: "LW-200", name: "แผ่นผนังกันดินสำเร็จรูป L-Wall", variant: "ฐาน 1.20 ม. หนา 15 ซม.", size: "2.00 ม. • ฐาน 1.20 ม.", height: "2.00 ม.", unit: "แผ่น", qty: 42, lock: "W1", row: "2" },
    { sku: "RCP-040", name: "ท่อคอนกรีตเสริมเหล็ก คสล. ชั้น 3", variant: "ท่อปากลิ้นราง มอก.", size: "Ø 0.40 x 1.00 ม.", unit: "ท่อน", qty: 85, lock: "Yard-Pipe", row: "1" },
    { sku: "KB-01", name: "ขอบคันหินคอนกรีตสำเร็จรูป", variant: "ผิวเรียบ หน้าเอียง", size: "0.15 x 0.30 x 1.00 ม.", unit: "ท่อน", qty: 320, lock: "Yard-Kerb", row: "1" },
  ];

  p4Featured.forEach((item, idx) => {
    items.push({
      id: `p4-item-${idx + 1}`,
      sku: item.sku,
      name: item.name,
      category: "finished_goods",
      variant: item.variant,
      size: item.size,
      height: item.height,
      unit: item.unit,
      plant_id: 4,
      zone: `ล็อค ${item.lock} แถว ${item.row}`,
      current_quantity: item.qty,
      last_counted_at: "2026-10-26T07:45:00Z",
      last_counted_by: "user-4",
      last_counted_by_name: "สมพร ทรัพย์ประเสริฐ",
      status: "ACTIVE",
      is_active: true,
      locations: [
        {
          id: `loc-map-p4-${idx}`,
          inventory_item_id: `p4-item-${idx + 1}`,
          lock_code: item.lock,
          row_code: item.row,
          expected_quantity: item.qty,
        },
      ],
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-26T07:45:00Z",
    });
  });

  for (let i = p4Featured.length + 1; i <= 110; i++) {
    const isUncounted = i > 45;
    items.push({
      id: `p4-item-${i}`,
      sku: `INF-${i.toString().padStart(3, "0")}`,
      name: `งานโครงสร้างพื้นฐานหล่อสำเร็จ P4-${i}`,
      category: "finished_goods",
      variant: "มาตรฐานงานทาง กรมทางหลวง",
      size: `แบบ ${i % 5 + 1}`,
      unit: i % 2 === 0 ? "ชิ้น" : "ท่อน",
      plant_id: 4,
      zone: `ล็อค Y${i % 3 + 1} แถว ${i % 4 + 1}`,
      current_quantity: isUncounted ? 25 : 10 + (i * 2) % 50,
      last_counted_at: isUncounted ? undefined : "2026-10-25T16:00:00Z",
      last_counted_by: isUncounted ? undefined : "user-4",
      last_counted_by_name: isUncounted ? undefined : "สมพร ทรัพย์ประเสริฐ",
      status: "ACTIVE",
      is_active: true,
      locations: [
        {
          id: `loc-map-p4-${i}`,
          inventory_item_id: `p4-item-${i}`,
          lock_code: `Y${i % 3 + 1}`,
          row_code: `${i % 4 + 1}`,
          expected_quantity: isUncounted ? 25 : 10 + (i * 2) % 50,
        },
      ],
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-25T16:00:00Z",
    });
  }

  return items;
}

export const MOCK_ITEMS: InventoryItem[] = generateItems();

// Past Counts matching multi-location details from requirement
export const MOCK_STOCK_COUNTS: StockCount[] = [
  {
    id: "count-1",
    count_round_id: "round-oct-2569",
    plant_id: 2,
    inventory_item_id: "p2-item-fp250", // FP-250-18
    user_id: "user-1",
    user_name: "สมชาย ใจมั่นคง",
    previous_quantity: 110,
    counted_quantity: 120,
    difference: 10,
    status: "SUBMITTED",
    notes: "นับรอบแรกประจำโซน A แยกตามล็อค A3, B3, B5",
    locations: [
      { lock_code: "A3", row_code: "6", previous_quantity: 40, counted_quantity: 40, difference: 0 },
      { lock_code: "B3", row_code: "2", previous_quantity: 20, counted_quantity: 20, difference: 0 },
      { lock_code: "B5", row_code: "1", previous_quantity: 50, counted_quantity: 60, difference: 10 },
    ],
    counted_at: "2026-10-25T14:20:00Z",
    submitted_at: "2026-10-25T14:20:00Z",
    created_at: "2026-10-25T14:20:00Z",
  },
  {
    id: "count-2",
    count_round_id: "round-oct-2569",
    plant_id: 2,
    inventory_item_id: "p2-item-fp250", // FP-250-18
    user_id: "user-2",
    user_name: "วิชัย สุวรรณโชติ",
    previous_quantity: 120,
    counted_quantity: 118,
    difference: -2,
    status: "SUBMITTED",
    notes: "นับซ้ำเพื่อตรวจความเรียบร้อยรอบเช้า",
    locations: [
      { lock_code: "A3", row_code: "6", previous_quantity: 40, counted_quantity: 40, difference: 0 },
      { lock_code: "B3", row_code: "2", previous_quantity: 20, counted_quantity: 20, difference: 0 },
      { lock_code: "B5", row_code: "1", previous_quantity: 60, counted_quantity: 58, difference: -2 },
    ],
    counted_at: "2026-10-26T09:15:00Z",
    submitted_at: "2026-10-26T09:15:00Z",
    created_at: "2026-10-26T09:15:00Z",
  },
];

export const MOCK_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: "adj-1",
    inventory_item_id: "p2-item-fp250",
    plant_id: 2,
    adjusted_by: "user-admin",
    adjusted_by_name: "ชัยวัฒน์ (หัวหน้าคลัง)",
    previous_quantity: 118,
    new_quantity: 120,
    difference: 2,
    reason: "ตรวจซ้ำ พบตกหล่นอีก 2 ต้น ที่หลังโรงงาน ล็อค B5",
    created_at: "2026-10-26T11:12:00Z",
  },
];
