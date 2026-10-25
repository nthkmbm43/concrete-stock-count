# Mobile Stock Count App — ระบบนับสต๊อกโรงงานคอนกรีต

แอปพลิเคชันตรวจนับสต๊อกสินค้าและวัตถุดิบสำหรับพนักงานคลังและแอดมินโรงงานคอนกรีต ออกแบบเป็น **Mobile Application เต็มรูปแบบ (UX/UI)** ใช้งานง่ายด้วยมือเดียวกลางโรงงาน รองรับการนับพร้อมกันหลายคนและอัปเดตแบบ Realtime

---

## 🏗️ 1. โครงสร้างโรงงาน (4 Plants)

- **โรง 1 (คลังวัตถุดิบ):** ปูนซีเมนต์, หินเกล็ด, ทรายหยาบ, เหล็กเส้น, ลวดอัดแรง PC-Wire, น้ำยาผสมคอนกรีต
- **โรง 2 (คลังสินค้า 2):** โรงผลิตและจัดเก็บเสารั้วคอนกรีตอัดแรง (เช่น FP-250 ขนาด 2.50 ม.), เสาไอ, เสาเข็มหกเหลี่ยม
- **โรง 3 (ผลิตภัณฑ์สำเร็จรูป):** โรงผลิตและจัดเก็บแผ่นพื้นสำเร็จรูป Plank (เช่น SL-300 ขนาด 3.00 ม.), แผ่นพื้น Hollow Core
- **โรง 4 (สินค้าภายนอก):** โรงผลิตและจัดเก็บแผ่นผนังกันดิน L-Wall (เช่น LW-200 ขนาด 2.00 ม.), ท่อระบายน้ำ คสล., บ่อพัก, ขอบคันหิน Kerb

---

## ⚡ 2. ฟีเจอร์หลัก (Key Features)

1. **Mobile App Shell (Mobile First UX):**
   - หน้าตาและสัมผัสเป็น Mobile App เต็มรูปแบบ (Top Bar, 5 Bottom Navs, Bottom Sheet, Number Stepper ขนาดใหญ่, Touch-friendly)
   - เปิดบน Desktop แสดงผลเป็น centered mobile frame ที่ดูสวยงาม ไม่แปลงเป็น admin website ทั่วไป
2. **ระบบรอบนับ (Count Round):**
   - แทนแนวคิด Daily Task ที่ยุ่งยาก เป็นระบบรอบนับ เช่น *รอบนับประจำเดือน ตุลาคม 2569* หรือ *ตรวจสต๊อกเพิ่มเติม โรง 2*
   - 1 รอบนับสามารถเลือกนับได้ 1 โรง, 2 โรง, 3 โรง หรือทั้ง 4 โรง
3. **Multi-Staff Collaboration & No Lock:**
   - พนักงานหลายคนช่วยกันนับได้พร้อมกัน ไม่มีการ Lock SKU
   - นับ SKU เดียวกันซ้ำเพื่อทวนสอบความถูกต้องได้ (Recount Allowed)
4. **เก็บบันทึกประวัติทุกครั้ง (Count History):**
   - ไม่มีการเขียนทับจนข้อมูลสูญหาย ทุกการ Submit และการแก้ยอดของ Admin จะถูกบันทึกเป็น Record ถาวร
   - ยอดปัจจุบันแสดงยอดนับล่าสุดที่ถูก Submit
5. **Staff Draft & Fast Next Item Flow:**
   - Staff สามารถกดบันทึก Draft ได้ก่อนยืนยันยอด
   - หลังกดยืนยันยอด แสดง Success Modal พร้อมปุ่มใหญ่ **[ นับรายการถัดไป ]** เดินนับต่อเนื่องได้ทันที
6. **Admin Adjust & Product Management:**
   - Admin สามารถปรับยอดสต๊อกได้พร้อมระบุเหตุผล (บังคับบันทึกประวัติการปรับยอด)
   - จัดการ SKU เพิ่มสินค้าใหม่ หรือเปิด/ปิดรอบนับ
7. **Supabase Realtime & Offline/Local Mode:**
   - รองรับ Supabase Auth, PostgreSQL, Storage, และ Supabase Realtime
   - มีระบบ Reactive Fallback + BroadcastChannel ในตัว เปิด 2 หน้าต่าง/แท็บเพื่อทดสอบ Realtime ได้ทันทีโดยไม่ต้องตั้งค่าล่วงหน้า

---

## 📱 3. เมนู Bottom Navigation (Lucide Icons)

1. **Home (`House`):** ยินดีต้อนรับ, ยอดสต๊อกรวม, การ์ดรอบนับปัจจุบัน (Progress 71%), การ์ดโรงงาน 4 โรง
2. **นับสต๊อก (`ClipboardCheck`):** เลือกรอบนับและโรงงาน, ค้นหาสินค้า, ตัวกรอง (ทั้งหมด, ยังไม่ได้นับ, นับแล้ว, นับซ้ำ)
3. **Stock (`Boxes`):** หน้ารวมยอดสต๊อกคงเหลือจริง ดูยอดประจำวัน ค้นหาตามโรง/หมวดหมู่
4. **ประวัติ (`History`):** ไทม์ไลน์บันทึกการนับและการปรับยอดทั้งหมดในโรงงาน
5. **Profile (`User`):** ข้อมูลผู้ใช้, สลับพนักงานทดสอบ, แผงควบคุม Admin Dashboard (สถิติ 4 ใบ: Progress, ยังไม่ได้นับ, นับซ้ำ, มีผลต่าง)

---

## 🚀 4. การติดตั้งและรันในเครื่อง (Getting Started)

```bash
# 1. ติดตั้ง Dependencies
npm install --legacy-peer-deps

# 2. เริ่มต้น Dev Server
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

---

## 🗄️ 5. การตั้งค่า Supabase (Optional for Production Deploy)

1. สร้างโปรเจกต์ใหม่ใน [Supabase](https://supabase.com)
2. นำไฟล์ `supabase/schema.sql` และ `supabase/seed.sql` ไปรันใน **SQL Editor** ของ Supabase
3. คัดลอกค่าจาก Supabase Settings มาใส่ใน `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
4. Deploy ขึ้น Vercel และเพิ่ม Environment Variables ทั้ง 2 ตัวนี้
