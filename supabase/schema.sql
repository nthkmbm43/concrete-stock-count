-- ====================================================================
-- SCHEMA: MOBILE STOCK COUNT APP FOR CONCRETE FACTORY
-- Target: Supabase (PostgreSQL 15+)
-- ====================================================================

-- 1. PROFILES TABLE (linked to auth.users if Supabase Auth is used)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('STAFF', 'ADMIN')) DEFAULT 'STAFF',
  plant_id INTEGER,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PLANTS (4 Core Plants)
CREATE TABLE IF NOT EXISTS public.plants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  total_skus INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. INVENTORY ITEMS (Raw materials, Finished goods, etc.)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('raw_material', 'finished_goods')),
  variant TEXT NOT NULL,
  size TEXT NOT NULL,
  unit TEXT NOT NULL,
  plant_id INTEGER NOT NULL REFERENCES public.plants(id) ON DELETE RESTRICT,
  zone TEXT NOT NULL,
  image_url TEXT,
  current_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  last_counted_at TIMESTAMPTZ,
  last_counted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_counted_by_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_plant ON public.inventory_items(plant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON public.inventory_items(sku);

-- 4. COUNT ROUNDS (Monthly, Weekly, Recount)
CREATE TABLE IF NOT EXISTS public.count_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('MONTHLY', 'WEEKLY', 'RECOUNT')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')) DEFAULT 'OPEN',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. COUNT ROUND PLANTS (1 round can span 1 to 4 plants)
CREATE TABLE IF NOT EXISTS public.count_round_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_round_id UUID NOT NULL REFERENCES public.count_rounds(id) ON DELETE CASCADE,
  plant_id INTEGER NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  UNIQUE(count_round_id, plant_id)
);

-- 6. STOCK COUNTS (Historical logs: NO unique constraint on SKU, multiple counts/recounts allowed)
CREATE TABLE IF NOT EXISTS public.stock_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_round_id UUID NOT NULL REFERENCES public.count_rounds(id) ON DELETE CASCADE,
  plant_id INTEGER NOT NULL REFERENCES public.plants(id) ON DELETE RESTRICT,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  previous_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  counted_quantity NUMERIC(12, 2) NOT NULL,
  difference NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED')) DEFAULT 'SUBMITTED',
  notes TEXT,
  counted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_stock_counts_round_item ON public.stock_counts(count_round_id, inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_counts_plant ON public.stock_counts(plant_id);
CREATE INDEX IF NOT EXISTS idx_stock_counts_counted_at ON public.stock_counts(counted_at DESC);

-- 7. STOCK ADJUSTMENTS (Admin modifications with mandatory reason)
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  plant_id INTEGER NOT NULL REFERENCES public.plants(id) ON DELETE RESTRICT,
  adjusted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  adjusted_by_name TEXT NOT NULL,
  previous_quantity NUMERIC(12, 2) NOT NULL,
  new_quantity NUMERIC(12, 2) NOT NULL,
  difference NUMERIC(12, 2) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- AUTOMATIC TRIGGERS: UPDATE CURRENT STOCK ON SUBMIT / ADJUSTMENT
-- ====================================================================

CREATE OR REPLACE FUNCTION public.fn_sync_stock_from_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'SUBMITTED' THEN
    UPDATE public.inventory_items
    SET 
      current_quantity = NEW.counted_quantity,
      last_counted_at = NEW.counted_at,
      last_counted_by = NEW.user_id,
      last_counted_by_name = NEW.user_name,
      updated_at = timezone('utc'::text, now())
    WHERE id = NEW.inventory_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_stock_from_count ON public.stock_counts;
CREATE TRIGGER trg_sync_stock_from_count
AFTER INSERT OR UPDATE ON public.stock_counts
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_stock_from_count();

CREATE OR REPLACE FUNCTION public.fn_sync_stock_from_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.inventory_items
  SET 
    current_quantity = NEW.new_quantity,
    last_counted_at = NEW.created_at,
    last_counted_by = NEW.adjusted_by,
    last_counted_by_name = NEW.adjusted_by_name,
    updated_at = timezone('utc'::text, now())
  WHERE id = NEW.inventory_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_stock_from_adjustment ON public.stock_adjustments;
CREATE TRIGGER trg_sync_stock_from_adjustment
AFTER INSERT ON public.stock_adjustments
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_stock_from_adjustment();

-- ====================================================================
-- REALTIME PUBLICATION ENABLEMENT
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_counts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.count_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_adjustments;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.count_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.count_round_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Read policies for authenticated users
CREATE POLICY "Allow read for all users" ON public.plants FOR SELECT USING (true);
CREATE POLICY "Allow read for all users" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Allow read for all users" ON public.count_rounds FOR SELECT USING (true);
CREATE POLICY "Allow read for all users" ON public.count_round_plants FOR SELECT USING (true);
CREATE POLICY "Allow read for all users" ON public.stock_counts FOR SELECT USING (true);
CREATE POLICY "Allow read for all users" ON public.stock_adjustments FOR SELECT USING (true);
CREATE POLICY "Allow read for all users" ON public.profiles FOR SELECT USING (true);

-- Insert/Update policies for staff/admin
CREATE POLICY "Allow insert stock counts" ON public.stock_counts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update draft counts" ON public.stock_counts FOR UPDATE USING (status = 'DRAFT');
CREATE POLICY "Allow insert adjustments" ON public.stock_adjustments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin manage items" ON public.inventory_items FOR ALL USING (true);
