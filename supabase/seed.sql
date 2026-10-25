-- ====================================================================
-- SEED DATA FOR CONCRETE FACTORY
-- ====================================================================

INSERT INTO public.plants (id, name, code, description, total_skus) VALUES
(1, 'โรง 1 คลังวัตถุดิบ', 'PLANT-1', 'ปูน, หิน, ทราย, เหล็กเส้น, ลวดอัดแรง, น้ำยาผสม', 125),
(2, 'โรง 2 คลังสินค้า', 'PLANT-2', 'โรงผลิต + เก็บเสารั้ว, เสาไอ, เสาเข็มคอนกรีตอัดแรง', 75),
(3, 'โรง 3 ผลิตภัณฑ์สำเร็จรูป', 'PLANT-3', 'โรงผลิต + แผ่นพื้นสำเร็จรูป Plank, Hollow core', 96),
(4, 'โรง 4 สินค้าภายนอก', 'PLANT-4', 'โรงผลิต + แผ่นผนังกันดิน L-Wall, ท่อ คสล., บ่อพัก', 110)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Active Count Round: ตุลาคม 2569
INSERT INTO public.count_rounds (id, title, type, start_date, end_date, status, notes) VALUES
('b27d424b-3b36-4d57-b08e-8a1e2f89b001', 'รอบนับประจำเดือน ตุลาคม 2569', 'MONTHLY', '2026-10-01', '2026-10-31', 'OPEN', 'รอบตรวจนับสต๊อกสิ้นเดือนหลัก ครอบคลุมคลังวัตถุดิบและโรงผลิต 1-4')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.count_round_plants (count_round_id, plant_id) VALUES
('b27d424b-3b36-4d57-b08e-8a1e2f89b001', 1),
('b27d424b-3b36-4d57-b08e-8a1e2f89b001', 2),
('b27d424b-3b36-4d57-b08e-8a1e2f89b001', 3),
('b27d424b-3b36-4d57-b08e-8a1e2f89b001', 4)
ON CONFLICT DO NOTHING;

-- Featured items
INSERT INTO public.inventory_items (id, sku, name, category, variant, size, unit, plant_id, zone, current_quantity, last_counted_at, last_counted_by_name, status) VALUES
('a0000000-0000-0000-0000-000000000001', 'FP-250', 'เสารั้วคอนกรีตอัดแรง', 'finished_goods', 'หน้ากว้าง 3 นิ้ว ลวด 4 เส้น', '2.50 เมตร', 'ต้น', 2, 'Zone A', 118, '2026-10-26 09:15:00+07', 'วิชัย สุวรรณโชติ', 'ACTIVE'),
('a0000000-0000-0000-0000-000000000002', 'SL-300', 'แผ่นพื้นคอนกรีตสำเร็จรูป Plank', 'finished_goods', 'หนา 5 ซม. ลวด 6 เส้น', '3.00 เมตร', 'แผ่น', 3, 'Zone B', 56, '2026-10-26 08:30:00+07', 'นิตยา รักษ์พงษ์', 'ACTIVE'),
('a0000000-0000-0000-0000-000000000003', 'LW-200', 'แผ่นผนังกันดินสำเร็จรูป L-Wall', 'finished_goods', 'ฐาน 1.20 ม. หหนา 15 ซม.', '2.00 เมตร', 'แผ่น', 4, 'Yard-A', 42, '2026-10-26 07:45:00+07', 'สมพร ทรัพย์ประเสริฐ', 'ACTIVE'),
('a0000000-0000-0000-0000-000000000004', 'RM-CEM-01', 'ปูนซีเมนต์ปอร์ตแลนด์ Type 1 ตราช้าง', 'raw_material', 'ถุง 50 กก.', '50 kg', 'ถุง', 1, 'Sil-A', 2450, '2026-10-25 11:30:00+07', 'สมชาย ใจมั่นคง', 'ACTIVE')
ON CONFLICT (sku) DO NOTHING;
