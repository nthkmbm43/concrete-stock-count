-- ====================================================================
-- SCHEMA: MOBILE STOCK COUNT APP FOR CONCRETE FACTORY (MULTI-LOCATION)
-- Target: Supabase (PostgreSQL 15+)
-- ====================================================================

-- 1. PROFILES TABLE
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

-- 3. STORAGE LOCATIONS (Plant, Lock, Row)
CREATE TABLE IF NOT EXISTS public.storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id INTEGER NOT NULL REFERENCES public.plants(id) ON DELETE RESTRICT,
  lock_code TEXT NOT NULL,
  row_code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(plant_id, lock_code, row_code)
);

CREATE INDEX IF NOT EXISTS idx_storage_locations_plant ON public.storage_locations(plant_id);

-- 4. INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('raw_material', 'finished_goods')),
  variant TEXT NOT NULL,
  size TEXT NOT NULL,
  height TEXT,
  width TEXT,
  length TEXT,
  unit TEXT NOT NULL,
  plant_id INTEGER NOT NULL REFERENCES public.plants(id) ON DELETE RESTRICT,
  zone TEXT,
  image_url TEXT,
  current_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  last_counted_at TIMESTAMPTZ,
  last_counted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_counted_by_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_plant ON public.inventory_items(plant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON public.inventory_items(sku);

-- 5. INVENTORY ITEM LOCATIONS (Multiple Storage Positions per SKU)
CREATE TABLE IF NOT EXISTS public.inventory_item_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  storage_location_id UUID REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  lock_code TEXT NOT NULL,
  row_code TEXT NOT NULL,
  expected_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_item_locations_item ON public.inventory_item_locations(inventory_item_id);

-- 6. COUNT ROUNDS (Monthly, Weekly, Recount)
CREATE TABLE IF NOT EXISTS public.count_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  count_type TEXT NOT NULL CHECK (count_type IN ('MONTHLY', 'WEEKLY', 'RECOUNT')),
  type TEXT NOT NULL CHECK (type IN ('MONTHLY', 'WEEKLY', 'RECOUNT')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')) DEFAULT 'OPEN',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. COUNT ROUND PLANTS (1 round can span 1 to 4 plants)
CREATE TABLE IF NOT EXISTS public.count_round_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_round_id UUID NOT NULL REFERENCES public.count_rounds(id) ON DELETE CASCADE,
  plant_id INTEGER NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  UNIQUE(count_round_id, plant_id)
);

-- 8. STOCK COUNTS (Header - NO unique constraint on SKU, multiple counts/recounts allowed)
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
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_stock_counts_round_item ON public.stock_counts(count_round_id, inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_counts_plant ON public.stock_counts(plant_id);
CREATE INDEX IF NOT EXISTS idx_stock_counts_counted_at ON public.stock_counts(counted_at DESC);

-- 9. STOCK COUNT LOCATIONS (Location breakdown for each count submission)
CREATE TABLE IF NOT EXISTS public.stock_count_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_count_id UUID NOT NULL REFERENCES public.stock_counts(id) ON DELETE CASCADE,
  storage_location_id UUID REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  lock_code TEXT NOT NULL,
  row_code TEXT NOT NULL,
  previous_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  counted_quantity NUMERIC(12, 2) NOT NULL,
  difference NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_stock_count_locations_count ON public.stock_count_locations(stock_count_id);

-- 10. STOCK ADJUSTMENTS (Admin modifications with mandatory reason)
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

-- ====================================================================
-- AUTOMATIC TRIGGER: SYNC ITEM QUANTITY ON SUBMISSION
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

-- ====================================================================
-- REALTIME PUBLICATION
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_counts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_count_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.count_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_adjustments;
