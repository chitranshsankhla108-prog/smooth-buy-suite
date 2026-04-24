ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS gst_number TEXT,
  ADD COLUMN IF NOT EXISTS dealer_status public.dealer_status;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS retail_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dealer_price NUMERIC(10,2);

UPDATE public.products
SET retail_price = COALESCE(retail_price, price),
    dealer_price = COALESCE(dealer_price, bulk_price, ROUND(price * 0.90, 2))
WHERE retail_price IS NULL OR dealer_price IS NULL;

ALTER TABLE public.products
  ALTER COLUMN retail_price SET DEFAULT 0,
  ALTER COLUMN dealer_price SET DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.dealer_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dealer_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dealers view own inquiries" ON public.dealer_inquiries;
CREATE POLICY "Dealers view own inquiries"
ON public.dealer_inquiries
FOR SELECT
TO authenticated
USING (auth.uid() = dealer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Approved dealers create inquiries" ON public.dealer_inquiries;
CREATE POLICY "Approved dealers create inquiries"
ON public.dealer_inquiries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = dealer_id AND public.has_role(auth.uid(), 'dealer'));

DROP POLICY IF EXISTS "Admins manage inquiries" ON public.dealer_inquiries;
CREATE POLICY "Admins manage inquiries"
ON public.dealer_inquiries
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_dealer_inquiries_updated_at ON public.dealer_inquiries;
CREATE TRIGGER update_dealer_inquiries_updated_at
BEFORE UPDATE ON public.dealer_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, business_name, gst_number, dealer_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'gst_number',
    CASE WHEN NEW.raw_user_meta_data ? 'business_name' THEN 'pending'::public.dealer_status ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    business_name = COALESCE(EXCLUDED.business_name, public.profiles.business_name),
    gst_number = COALESCE(EXCLUDED.gst_number, public.profiles.gst_number),
    dealer_status = COALESCE(EXCLUDED.dealer_status, public.profiles.dealer_status),
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_approved_dealer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'dealer')
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = _user_id AND dealer_status = 'approved'
    )
$$;

CREATE OR REPLACE FUNCTION public.get_visible_products()
RETURNS TABLE (
  id TEXT,
  sku TEXT,
  name TEXT,
  brand TEXT,
  category public.product_category,
  price NUMERIC,
  mrp NUMERIC,
  bulk_price NUMERIC,
  bulk_min_qty INTEGER,
  stock INTEGER,
  low_stock_threshold INTEGER,
  rating NUMERIC,
  reviews INTEGER,
  image_url TEXT,
  heavy BOOLEAN,
  installation BOOLEAN,
  bulk_available BOOLEAN,
  fast_delivery BOOLEAN,
  cross_sell_ids TEXT[],
  active BOOLEAN,
  retail_price NUMERIC,
  dealer_price NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.sku, p.name, p.brand, p.category,
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
$$;

CREATE OR REPLACE FUNCTION public.get_admin_products()
RETURNS TABLE (
  id TEXT,
  sku TEXT,
  name TEXT,
  brand TEXT,
  category public.product_category,
  price NUMERIC,
  mrp NUMERIC,
  bulk_price NUMERIC,
  bulk_min_qty INTEGER,
  stock INTEGER,
  low_stock_threshold INTEGER,
  rating NUMERIC,
  reviews INTEGER,
  image_url TEXT,
  heavy BOOLEAN,
  installation BOOLEAN,
  bulk_available BOOLEAN,
  fast_delivery BOOLEAN,
  cross_sell_ids TEXT[],
  active BOOLEAN,
  retail_price NUMERIC,
  dealer_price NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.sku, p.name, p.brand, p.category,
    COALESCE(p.retail_price, p.price) AS price,
    p.mrp, p.bulk_price, p.bulk_min_qty, p.stock, p.low_stock_threshold,
    p.rating, p.reviews, p.image_url, p.heavy, p.installation, p.bulk_available,
    p.fast_delivery, p.cross_sell_ids, p.active,
    COALESCE(p.retail_price, p.price) AS retail_price,
    p.dealer_price
  FROM public.products p
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY p.name;
$$;

REVOKE SELECT (dealer_price) ON public.products FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_visible_products() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_products() TO authenticated;