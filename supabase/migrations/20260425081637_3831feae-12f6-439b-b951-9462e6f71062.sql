-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Seed existing categories
INSERT INTO public.categories (name, sort_order) VALUES
  ('Power', 10),
  ('Security', 20),
  ('Solar', 30),
  ('Appliances', 40)
ON CONFLICT (name) DO NOTHING;

-- 3. Drop dependent RPCs so we can change column type
DROP FUNCTION IF EXISTS public.get_visible_products();
DROP FUNCTION IF EXISTS public.get_admin_products();

-- 4. Convert products.category from enum to TEXT
ALTER TABLE public.products
  ALTER COLUMN category TYPE TEXT USING category::TEXT;

-- 5. Recreate RPCs returning text category
CREATE OR REPLACE FUNCTION public.get_admin_products()
 RETURNS TABLE(id text, sku text, name text, brand text, category text, price numeric, mrp numeric, bulk_price numeric, bulk_min_qty integer, stock integer, low_stock_threshold integer, rating numeric, reviews integer, image_url text, heavy boolean, installation boolean, bulk_available boolean, fast_delivery boolean, cross_sell_ids text[], active boolean, retail_price numeric, dealer_price numeric)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.sku, p.name, p.brand, p.category::text,
    COALESCE(p.retail_price, p.price) AS price,
    p.mrp, p.bulk_price, p.bulk_min_qty, p.stock, p.low_stock_threshold,
    p.rating, p.reviews, p.image_url, p.heavy, p.installation, p.bulk_available,
    p.fast_delivery, p.cross_sell_ids, p.active,
    COALESCE(p.retail_price, p.price) AS retail_price,
    p.dealer_price
  FROM public.products p
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY p.name;
$function$;

CREATE OR REPLACE FUNCTION public.get_visible_products()
 RETURNS TABLE(id text, sku text, name text, brand text, category text, price numeric, mrp numeric, bulk_price numeric, bulk_min_qty integer, stock integer, low_stock_threshold integer, rating numeric, reviews integer, image_url text, heavy boolean, installation boolean, bulk_available boolean, fast_delivery boolean, cross_sell_ids text[], active boolean, retail_price numeric, dealer_price numeric)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.sku, p.name, p.brand, p.category::text,
    COALESCE(p.retail_price, p.price) AS price,
    p.mrp,
    CASE WHEN public.is_approved_dealer(auth.uid()) THEN p.dealer_price ELSE p.bulk_price END AS bulk_price,
    p.bulk_min_qty,
    p.stock, p.low_stock_threshold, p.rating, p.reviews, p.image_url,
    p.heavy, p.installation, p.bulk_available, p.fast_delivery, p.cross_sell_ids, p.active,
    COALESCE(p.retail_price, p.price) AS retail_price,
    CASE WHEN public.is_approved_dealer(auth.uid()) OR public.has_role(auth.uid(), 'admin') THEN p.dealer_price ELSE NULL END AS dealer_price
  FROM public.products p
  WHERE p.active = true OR public.has_role(auth.uid(), 'admin')
  ORDER BY p.name;
$function$;

-- 6. Drop now-unused enum
DROP TYPE IF EXISTS public.product_category;