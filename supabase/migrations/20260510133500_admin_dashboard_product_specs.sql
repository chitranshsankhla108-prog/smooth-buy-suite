ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS voltage TEXT,
ADD COLUMN IF NOT EXISTS ah_rating TEXT,
ADD COLUMN IF NOT EXISTS resolution TEXT,
ADD COLUMN IF NOT EXISTS warranty_period TEXT,
ADD COLUMN IF NOT EXISTS technical_capacity TEXT,
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS model_name TEXT;

UPDATE public.products
SET
  retail_price = COALESCE(retail_price, price),
  brand_name = COALESCE(brand_name, brand),
  model_name = COALESCE(model_name, sku);

DROP FUNCTION IF EXISTS public.get_visible_products();
DROP FUNCTION IF EXISTS public.get_admin_products();

CREATE FUNCTION public.get_visible_products()
 RETURNS TABLE(
  id text,
  sku text,
  name text,
  brand text,
  category text,
  price numeric,
  mrp numeric,
  bulk_price numeric,
  bulk_min_qty integer,
  stock integer,
  low_stock_threshold integer,
  rating numeric,
  reviews integer,
  image_url text,
  heavy boolean,
  installation boolean,
  bulk_available boolean,
  fast_delivery boolean,
  cross_sell_ids text[],
  active boolean,
  retail_price numeric,
  dealer_price numeric,
  created_at timestamptz,
  description text,
  voltage text,
  ah_rating text,
  resolution text,
  warranty_period text,
  technical_capacity text,
  brand_name text,
  model_name text
 )
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.sku, p.name, p.brand, p.category::text,
    COALESCE(p.retail_price, p.price), p.mrp,
    CASE WHEN public.is_approved_dealer(auth.uid()) THEN p.dealer_price ELSE p.bulk_price END,
    p.bulk_min_qty, p.stock, p.low_stock_threshold, p.rating, p.reviews, p.image_url,
    p.heavy, p.installation, p.bulk_available, p.fast_delivery, p.cross_sell_ids, p.active,
    COALESCE(p.retail_price, p.price),
    CASE WHEN public.is_approved_dealer(auth.uid()) OR public.has_role(auth.uid(), 'admin') THEN p.dealer_price ELSE NULL END,
    p.created_at,
    p.description,
    p.voltage,
    p.ah_rating,
    p.resolution,
    p.warranty_period,
    p.technical_capacity,
    COALESCE(p.brand_name, p.brand),
    COALESCE(p.model_name, p.sku)
  FROM public.products p
  WHERE p.active = true OR public.has_role(auth.uid(), 'admin')
  ORDER BY p.name;
$function$;

CREATE FUNCTION public.get_admin_products()
 RETURNS TABLE(
  id text,
  sku text,
  name text,
  brand text,
  category text,
  price numeric,
  mrp numeric,
  bulk_price numeric,
  bulk_min_qty integer,
  stock integer,
  low_stock_threshold integer,
  rating numeric,
  reviews integer,
  image_url text,
  heavy boolean,
  installation boolean,
  bulk_available boolean,
  fast_delivery boolean,
  cross_sell_ids text[],
  active boolean,
  retail_price numeric,
  dealer_price numeric,
  created_at timestamptz,
  description text,
  voltage text,
  ah_rating text,
  resolution text,
  warranty_period text,
  technical_capacity text,
  brand_name text,
  model_name text
 )
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.sku, p.name, p.brand, p.category::text,
    COALESCE(p.retail_price, p.price), p.mrp, p.bulk_price, p.bulk_min_qty, p.stock, p.low_stock_threshold,
    p.rating, p.reviews, p.image_url, p.heavy, p.installation, p.bulk_available,
    p.fast_delivery, p.cross_sell_ids, p.active,
    COALESCE(p.retail_price, p.price), p.dealer_price, p.created_at,
    p.description,
    p.voltage,
    p.ah_rating,
    p.resolution,
    p.warranty_period,
    p.technical_capacity,
    COALESCE(p.brand_name, p.brand),
    COALESCE(p.model_name, p.sku)
  FROM public.products p
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY p.name;
$function$;
