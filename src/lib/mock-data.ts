import { Plant, InventoryItem, CountRound, StockCount, StockAdjustment, UserProfile } from "./types";

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

export const MOCK_ROUNDS: CountRound[] = [
  {
    id: "round-oct-2569",
    title: "รอบนับประจำเดือน ตุลาคม 2569",
    type: "MONTHLY",
    start_date: "2026-10-01",
    end_date: "2026-10-31",
    status: "OPEN",
    plant_ids: [1, 2, 3, 4],
    notes: "รอบตรวจนับสต๊อกสิ้นเดือนหลัก ครอบคลุมคลังวัตถุดิบและโรงผลิต 1-4",
    created_at: "2026-10-01T08:00:00Z",
  },
  {
    id: "round-recount-p2",
    title: "ตรวจสต๊อกเพิ่มเติม โรง 2 (เสารั้ว)",
    type: "WEEKLY",
    start_date: "2026-10-24",
    end_date: "2026-10-28",
    status: "OPEN",
    plant_ids: [2],
    notes: "สุ่มตรวจความถูกต้องเสารั้วคอนกรีตอัดแรงรุ่นขายดี",
    created_at: "2026-10-24T08:00:00Z",
  },
  {
    id: "round-sep-2569",
    title: "รอบนับประจำเดือน กันยายน 2569",
    type: "MONTHLY",
    start_date: "2026-09-01",
    end_date: "2026-09-30",
    status: "CLOSED",
    plant_ids: [1, 2, 3, 4],
    notes: "ปิดรอบแล้ว ยอดกระทบเข้าสมุดบัญชีเรียบร้อย",
    created_at: "2026-09-01T08:00:00Z",
  },
];

// Generate concrete factory items
function generateItems(): InventoryItem[] {
  const items: InventoryItem[] = [];

  // Plant 1: Raw Materials (125 items simulated, key ones detailed)
  const rawMaterials = [
    { sku: "RM-CEM-01", name: "ปูนซีเมนต์ปอร์ตแลนด์ Type 1 ตราช้าง", variant: "ถุง 50 กก.", size: "50 kg", unit: "ถุง", qty: 2450, zone: "Sil-A" },
    { sku: "RM-CEM-02", name: "ปูนซีเมนต์ปอร์ตแลนด์ Type 3 (แข็งตัวเร็ว)", variant: "Bulk ไซโล", size: "1 ตัน", unit: "ตัน", qty: 45, zone: "Sil-B" },
    { sku: "RM-SND-01", name: "ทรายหยาบคัดเกรดล้างสะอาด", variant: "กองลานทราย", size: "1 คิว", unit: "คิว (ลบ.ม.)", qty: 380, zone: "Yard-1" },
    { sku: "RM-RCK-01", name: "หินปูนเบอร์ 1 (3/8 นิ้ว)", variant: "กองลานหิน", size: "1 คิว", unit: "คิว (ลบ.ม.)", qty: 420, zone: "Yard-2" },
    { sku: "RM-RCK-02", name: "หินปูนเบอร์ 2 (3/4 นิ้ว)", variant: "กองลานหิน", size: "1 คิว", unit: "คิว (ลบ.ม.)", qty: 510, zone: "Yard-3" },
    { sku: "RM-STL-09", name: "เหล็กเส้นกลม SR24 ขนาด 9 มม.", variant: "มัดละ 100 เส้น", size: "ยาว 10 ม.", unit: "เส้น", qty: 850, zone: "Steel-A" },
    { sku: "RM-STL-12", name: "เหล็กข้ออ้อย SD40 ขนาด 12 มม.", variant: "มัดละ 50 เส้น", size: "ยาว 10 ม.", unit: "เส้น", qty: 1200, zone: "Steel-B" },
    { sku: "RM-PCW-04", name: "ลวดอัดแรง PC Wire ชนิดหยัก 4 มม.", variant: "ขด Coil ใหญ่", size: "ขด 1,000 กก.", unit: "ขด", qty: 18, zone: "Wire-1" },
    { sku: "RM-PCW-05", name: "ลวดอัดแรง PC Wire ชนิดเรียบ 5 มม.", variant: "ขด Coil ใหญ่", size: "ขด 1,000 กก.", unit: "ขด", qty: 24, zone: "Wire-2" },
    { sku: "RM-PCS-09", name: "ลวดตีเกลียว PC Strand 9.3 มม. (3/8 นิ้ว)", variant: "ขด Coil", size: "ขด 2,000 กก.", unit: "ขด", qty: 12, zone: "Wire-3" },
    { sku: "RM-AD-01", name: "น้ำยาผสมคอนกรีตลดน้ำและหน่วงการก่อตัว", variant: "ถัง IBC 1,000 ลิตร", size: "1,000 L", unit: "ถัง", qty: 8, zone: "Chem-A" },
    { sku: "RM-AD-02", name: "น้ำยาเร่งกำลังคอนกรีตต้นเช้า", variant: "ถัง 200 ลิตร", size: "200 L", unit: "ถัง", qty: 15, zone: "Chem-B" },
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
      zone: item.zone,
      current_quantity: item.qty,
      last_counted_at: "2026-10-25T11:30:00Z",
      last_counted_by: "user-1",
      last_counted_by_name: "สมชาย ใจมั่นคง",
      status: "ACTIVE",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-25T11:30:00Z",
    });
  });

  // Fill up to 125 for Plant 1
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
      zone: `Zone-${String.fromCharCode(65 + (i % 6))}`,
      current_quantity: 50 + (i * 3) % 150,
      last_counted_at: "2026-10-25T14:00:00Z",
      last_counted_by: "user-1",
      last_counted_by_name: "สมชาย ใจมั่นคง",
      status: "ACTIVE",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-25T14:00:00Z",
    });
  }

  // Plant 2: Finished Goods (Fence posts, I-beams, Concrete piles) (75 items)
  // Featured item FP-250 from requirements!
  const p2Featured = [
    { sku: "FP-200", name: "เสารั้วคอนกรีตอัดแรง", variant: "หน้ากว้าง 3 นิ้ว ลวด 4 เส้น", size: "2.00 เมตร", unit: "ต้น", qty: 95, zone: "Zone A" },
    { sku: "FP-250", name: "เสารั้วคอนกรีตอัดแรง", variant: "หน้ากว้าง 3 นิ้ว ลวด 4 เส้น", size: "2.50 เมตร", unit: "ต้น", qty: 118, zone: "Zone A", counted_by: "user-2", counted_by_name: "วิชัย สุวรรณโชติ", counted_at: "2026-10-26T09:15:00Z" },
    { sku: "FP-300", name: "เสารั้วคอนกรีตอัดแรง", variant: "หน้ากว้าง 3 นิ้ว ลวด 4 เส้น", size: "3.00 เมตร", unit: "ต้น", qty: 84, zone: "Zone A" },
    { sku: "FP-350", name: "เสารั้วคอนกรีตอัดแรง", variant: "หน้ากว้าง 3.5 นิ้ว ลวด 6 เส้น", size: "3.50 เมตร", unit: "ต้น", qty: 60, zone: "Zone A" },
    { sku: "IB-150", name: "เสาไอคอนกรีตอัดแรง (I-Beam)", variant: "ไอ 15 ซม.", size: "4.00 เมตร", unit: "ต้น", qty: 45, zone: "Zone B" },
    { sku: "IB-180", name: "เสาไอคอนกรีตอัดแรง (I-Beam)", variant: "ไอ 18 ซม.", size: "5.00 เมตร", unit: "ต้น", qty: 32, zone: "Zone B" },
    { sku: "IB-220", name: "เสาไอคอนกรีตอัดแรง (I-Beam)", variant: "ไอ 22 ซม.", size: "6.00 เมตร", unit: "ต้น", qty: 28, zone: "Zone B" },
    { sku: "PL-018", name: "เสาเข็มหกเหลี่ยมกลวง คอร. มอก.", variant: "เส้นผ่านศูนย์กลาง 15 ซม.", size: "4.00 เมตร", unit: "ท่อน", qty: 150, zone: "Zone C" },
    { sku: "PL-020", name: "เสาเข็มหกเหลี่ยมกลวง คอร. มอก.", variant: "เส้นผ่านศูนย์กลาง 15 ซม.", size: "6.00 เมตร", unit: "ท่อน", qty: 110, zone: "Zone C" },
    { sku: "PL-I26", name: "เสาเข็มไอ คอร. ไอ-26", variant: "ลวด PC Strand 7 เส้น", size: "8.00 เมตร", unit: "ท่อน", qty: 42, zone: "Zone C" },
  ];

  p2Featured.forEach((item, idx) => {
    items.push({
      id: `p2-item-${idx + 1}`,
      sku: item.sku,
      name: item.name,
      category: "finished_goods",
      variant: item.variant,
      size: item.size,
      unit: item.unit,
      plant_id: 2,
      zone: item.zone,
      current_quantity: item.qty,
      last_counted_at: item.counted_at || "2026-10-25T10:00:00Z",
      last_counted_by: item.counted_by || "user-2",
      last_counted_by_name: item.counted_by_name || "วิชัย สุวรรณโชติ",
      status: "ACTIVE",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: item.counted_at || "2026-10-25T10:00:00Z",
    });
  });

  // Fill up to 75 for Plant 2
  // We want 65 counted, 10 uncounted (matching prompt specs: 65/75 counted!)
  for (let i = p2Featured.length + 1; i <= 75; i++) {
    const isUncounted = i > 65; // items 66..75 are uncounted
    items.push({
      id: `p2-item-${i}`,
      sku: `CP-P2-${i.toString().padStart(3, "0")}`,
      name: `เสาคอนกรีตโครงสร้างพิเศษ รุ่น P2-${i}`,
      category: "finished_goods",
      variant: `มาตรฐาน มอก. ลวด ${(i % 3 + 4)} เส้น`,
      size: `${(2.0 + (i % 8) * 0.5).toFixed(2)} เมตร`,
      unit: "ต้น",
      plant_id: 2,
      zone: `Zone ${String.fromCharCode(65 + (i % 4))}`,
      current_quantity: isUncounted ? 40 : 25 + (i * 2) % 80,
      last_counted_at: isUncounted ? undefined : "2026-10-25T15:30:00Z",
      last_counted_by: isUncounted ? undefined : "user-2",
      last_counted_by_name: isUncounted ? undefined : "วิชัย สุวรรณโชติ",
      status: "ACTIVE",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-25T15:30:00Z",
    });
  }

  // Plant 3: Solid Plank & Hollow Core (96 items, 52 counted, 44 uncounted)
  const p3Featured = [
    { sku: "SL-200", name: "แผ่นพื้นคอนกรีตสำเร็จรูป Plank", variant: "หนา 5 ซม. ลวด 4 เส้น", size: "2.00 เมตร", unit: "แผ่น", qty: 65, zone: "Zone A" },
    { sku: "SL-250", name: "แผ่นพื้นคอนกรีตสำเร็จรูป Plank", variant: "หนา 5 ซม. ลวด 5 เส้น", size: "2.50 เมตร", unit: "แผ่น", qty: 72, zone: "Zone A" },
    { sku: "SL-300", name: "แผ่นพื้นคอนกรีตสำเร็จรูป Plank", variant: "หนา 5 ซม. ลวด 6 เส้น", size: "3.00 เมตร", unit: "แผ่น", qty: 56, zone: "Zone B", counted_by: "user-3", counted_by_name: "นิตยา รักษ์พงษ์", counted_at: "2026-10-26T08:30:00Z" },
    { sku: "SL-350", name: "แผ่นพื้นคอนกรีตสำเร็จรูป Plank", variant: "หนา 5 ซม. ลวด 7 เส้น", size: "3.50 เมตร", unit: "แผ่น", qty: 48, zone: "Zone B" },
    { sku: "SL-400", name: "แผ่นพื้นคอนกรีตสำเร็จรูป Plank", variant: "หนา 5 ซม. ลวด 7 เส้น", size: "4.00 เมตร", unit: "แผ่น", qty: 35, zone: "Zone B" },
    { sku: "HC-06-25", name: "แผ่นพื้นฮอลโลว์คอร์ (Hollow Core)", variant: "หนา 6 ซม. กว้าง 60 ซม.", size: "2.50 เมตร", unit: "แผ่น", qty: 40, zone: "Zone C" },
    { sku: "HC-08-30", name: "แผ่นพื้นฮอลโลว์คอร์ (Hollow Core)", variant: "หนา 8 ซม. กว้าง 60 ซม.", size: "3.00 เมตร", unit: "แผ่น", qty: 28, zone: "Zone C" },
    { sku: "HC-10-40", name: "แผ่นพื้นฮอลโลว์คอร์ (Hollow Core)", variant: "หนา 10 ซม. กว้าง 60 ซม.", size: "4.00 เมตร", unit: "แผ่น", qty: 22, zone: "Zone C" },
  ];

  p3Featured.forEach((item, idx) => {
    items.push({
      id: `p3-item-${idx + 1}`,
      sku: item.sku,
      name: item.name,
      category: "finished_goods",
      variant: item.variant,
      size: item.size,
      unit: item.unit,
      plant_id: 3,
      zone: item.zone,
      current_quantity: item.qty,
      last_counted_at: item.counted_at || "2026-10-25T11:00:00Z",
      last_counted_by: item.counted_by || "user-3",
      last_counted_by_name: item.counted_by_name || "นิตยา รักษ์พงษ์",
      status: "ACTIVE",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: item.counted_at || "2026-10-25T11:00:00Z",
    });
  });

  // Fill up to 96 for Plant 3 (52 counted, 44 uncounted)
  for (let i = p3Featured.length + 1; i <= 96; i++) {
    const isUncounted = i > 52;
    items.push({
      id: `p3-item-${i}`,
      sku: `SL-EXT-${i.toString().padStart(3, "0")}`,
      name: `แผ่นพื้นสั่งทำพิเศษ P3-${i}`,
      category: "finished_goods",
      variant: `หนา 5-10 ซม. ลวด ${(i % 4 + 4)} เส้น`,
      size: `${(2.2 + (i % 6) * 0.4).toFixed(2)} เมตร`,
      unit: "แผ่น",
      plant_id: 3,
      zone: `Zone ${String.fromCharCode(65 + (i % 3))}`,
      current_quantity: isUncounted ? 30 : 15 + (i * 3) % 60,
      last_counted_at: isUncounted ? undefined : "2026-10-25T14:15:00Z",
      last_counted_by: isUncounted ? undefined : "user-3",
      last_counted_by_name: isUncounted ? undefined : "นิตยา รักษ์พงษ์",
      status: "ACTIVE",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-25T14:15:00Z",
    });
  }

  // Plant 4: Outdoor / Heavy Infrastructure Products (110 items, 45 counted, 65 uncounted)
  const p4Featured = [
    { sku: "LW-150", name: "แผ่นผนังกันดินสำเร็จรูป L-Wall", variant: "ฐาน 1.00 ม. หนา 12 ซม.", size: "1.50 เมตร", unit: "แผ่น", qty: 38, zone: "Yard-A" },
    { sku: "LW-200", name: "แผ่นผนังกันดินสำเร็จรูป L-Wall", variant: "ฐาน 1.20 ม. หนา 15 ซม.", size: "2.00 เมตร", unit: "แผ่น", qty: 42, zone: "Yard-A", counted_by: "user-4", counted_by_name: "สมพร ทรัพย์ประเสริฐ", counted_at: "2026-10-26T07:45:00Z" },
    { sku: "LW-250", name: "แผ่นผนังกันดินสำเร็จรูป L-Wall", variant: "ฐาน 1.50 ม. หนา 15 ซม.", size: "2.50 เมตร", unit: "แผ่น", qty: 26, zone: "Yard-A" },
    { sku: "RCP-040", name: "ท่อคอนกรีตเสริมเหล็ก คสล. ชั้น 3", variant: "ท่อปากลิ้นราง มอก.", size: "Ø 0.40 x 1.00 ม.", unit: "ท่อน", qty: 85, zone: "Pipe-Yard" },
    { sku: "RCP-060", name: "ท่อคอนกรีตเสริมเหล็ก คสล. ชั้น 3", variant: "ท่อปากลิ้นราง มอก.", size: "Ø 0.60 x 1.00 ม.", unit: "ท่อน", qty: 62, zone: "Pipe-Yard" },
    { sku: "RCP-080", name: "ท่อคอนกรีตเสริมเหล็ก คสล. ชั้น 3", variant: "ท่อปากลิ้นราง มอก.", size: "Ø 0.80 x 1.00 ม.", unit: "ท่อน", qty: 44, zone: "Pipe-Yard" },
    { sku: "RCP-100", name: "ท่อคอนกรีตเสริมเหล็ก คสล. ชั้น 3", variant: "ท่อปากลิ้นราง มอก.", size: "Ø 1.00 x 1.00 ม.", unit: "ท่อน", qty: 30, zone: "Pipe-Yard" },
    { sku: "BX-120", name: "บ่อพักคอนกรีตสำเร็จรูป สำหรับท่อ 40-60 ซม.", variant: "ผนังหนา 10 ซม. พร้อมฝา", size: "1.00 x 1.20 ม.", unit: "บ่อ", qty: 20, zone: "Yard-B" },
    { sku: "KB-01", name: "ขอบคันหินคอนกรีตสำเร็จรูป (Concrete Kerb)", variant: "ผิวเรียบ หน้าเอียง", size: "0.15 x 0.30 x 1.00 ม.", unit: "ท่อน", qty: 320, zone: "Yard-C" },
  ];

  p4Featured.forEach((item, idx) => {
    items.push({
      id: `p4-item-${idx + 1}`,
      sku: item.sku,
      name: item.name,
      category: "finished_goods",
      variant: item.variant,
      size: item.size,
      unit: item.unit,
      plant_id: 4,
      zone: item.zone,
      current_quantity: item.qty,
      last_counted_at: item.counted_at || "2026-10-25T09:20:00Z",
      last_counted_by: item.counted_by || "user-4",
      last_counted_by_name: item.counted_by_name || "สมพร ทรัพย์ประเสริฐ",
      status: "ACTIVE",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: item.counted_at || "2026-10-25T09:20:00Z",
    });
  });

  // Fill up to 110 for Plant 4 (45 counted, 65 uncounted)
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
      zone: `Yard-${String.fromCharCode(65 + (i % 4))}`,
      current_quantity: isUncounted ? 25 : 10 + (i * 2) % 50,
      last_counted_at: isUncounted ? undefined : "2026-10-25T16:00:00Z",
      last_counted_by: isUncounted ? undefined : "user-4",
      last_counted_by_name: isUncounted ? undefined : "สมพร ทรัพย์ประเสริฐ",
      status: "ACTIVE",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-25T16:00:00Z",
    });
  }

  return items;
}

export const MOCK_ITEMS: InventoryItem[] = generateItems();

// Historical Count Records matching the user prompt's exact scenario!
// Example from prompt:
// FP-250 เสารั้ว 2.50 ม.
// 25 ต.ค. 14:20 สมชาย 120 ต้น
// 26 ต.ค. 09:15 วิชัย 118 ต้น
// 26 ต.ค. 10:30 สมชาย 120 ต้น (or recount)
export const MOCK_STOCK_COUNTS: StockCount[] = [
  {
    id: "count-1",
    count_round_id: "round-oct-2569",
    plant_id: 2,
    inventory_item_id: "p2-item-2", // FP-250
    user_id: "user-1",
    user_name: "สมชาย ใจมั่นคง",
    previous_quantity: 110,
    counted_quantity: 120,
    difference: 10,
    status: "SUBMITTED",
    notes: "นับรอบแรกประจำโซน A",
    counted_at: "2026-10-25T14:20:00Z",
    created_at: "2026-10-25T14:20:00Z",
  },
  {
    id: "count-2",
    count_round_id: "round-oct-2569",
    plant_id: 2,
    inventory_item_id: "p2-item-2", // FP-250
    user_id: "user-2",
    user_name: "วิชัย สุวรรณโชติ",
    previous_quantity: 120,
    counted_quantity: 118,
    difference: -2,
    status: "SUBMITTED",
    notes: "นับซ้ำเพื่อตรวจความเรียบร้อยรอบเช้า",
    counted_at: "2026-10-26T09:15:00Z",
    created_at: "2026-10-26T09:15:00Z",
  },
  {
    id: "count-3",
    count_round_id: "round-oct-2569",
    plant_id: 3,
    inventory_item_id: "p3-item-3", // SL-300
    user_id: "user-3",
    user_name: "นิตยา รักษ์พงษ์",
    previous_quantity: 50,
    counted_quantity: 56,
    difference: 6,
    status: "SUBMITTED",
    notes: "แผ่นพื้นกองกลาง Zone B",
    counted_at: "2026-10-26T08:30:00Z",
    created_at: "2026-10-26T08:30:00Z",
  },
  {
    id: "count-4",
    count_round_id: "round-oct-2569",
    plant_id: 4,
    inventory_item_id: "p4-item-2", // LW-200
    user_id: "user-4",
    user_name: "สมพร ทรัพย์ประเสริฐ",
    previous_quantity: 40,
    counted_quantity: 42,
    difference: 2,
    status: "SUBMITTED",
    notes: "L-Wall ลานกลางแจ้ง ตรวจนับครบ",
    counted_at: "2026-10-26T07:45:00Z",
    created_at: "2026-10-26T07:45:00Z",
  },
];

export const MOCK_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: "adj-1",
    inventory_item_id: "p2-item-2", // FP-250
    plant_id: 2,
    adjusted_by: "user-admin",
    adjusted_by_name: "ชัยวัฒน์ (หัวหน้าคลัง)",
    previous_quantity: 118,
    new_quantity: 120,
    difference: 2,
    reason: "ตรวจซ้ำ พบตกหล่นอีก 2 ต้น ที่หลังโรงงาน",
    created_at: "2026-10-26T11:12:00Z",
  },
];
