
-- ============================================
-- ROLES & PROFILES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to check role without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default 'customer' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policies
CREATE POLICY "Users view own profile" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PRODUCTS (catalog migrated to DB)
-- ============================================
CREATE TYPE public.product_category AS ENUM ('Power', 'Security', 'Solar', 'Appliances');

CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category public.product_category NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  mrp NUMERIC(10,2) NOT NULL CHECK (mrp >= 0),
  bulk_price NUMERIC(10,2),
  bulk_min_qty INTEGER,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  rating NUMERIC(2,1) DEFAULT 4.5,
  reviews INTEGER DEFAULT 0,
  image_url TEXT,
  heavy BOOLEAN DEFAULT FALSE,
  installation BOOLEAN DEFAULT FALSE,
  bulk_available BOOLEAN DEFAULT FALSE,
  fast_delivery BOOLEAN DEFAULT TRUE,
  cross_sell_ids TEXT[] DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Anyone can read active products; admins can read all
CREATE POLICY "Public read active products" ON public.products
FOR SELECT USING (active = TRUE OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert products" ON public.products
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update products" ON public.products
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete products" ON public.products
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PAYMENT SETTINGS (admin-managed singleton-ish)
-- ============================================
CREATE TABLE public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id TEXT,
  paytm_id TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_name TEXT,
  qr_code_url TEXT,
  cod_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_payment_settings_updated_at
BEFORE UPDATE ON public.payment_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Public read payment settings" ON public.payment_settings
FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage payment settings" ON public.payment_settings
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ORDERS
-- ============================================
CREATE TYPE public.order_status AS ENUM (
  'pending_payment','awaiting_verification','paid','processing','shipped','delivered','cancelled','refunded'
);
CREATE TYPE public.payment_method AS ENUM ('upi_qr','paytm','bank_transfer','cod');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('VLZ-' || to_char(now(),'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_pincode TEXT NOT NULL,
  shipping_landmark TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  install_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  installation BOOLEAN NOT NULL DEFAULT FALSE,
  shipping_speed TEXT NOT NULL DEFAULT 'standard',
  payment_method public.payment_method NOT NULL,
  payment_reference TEXT,
  payment_proof_url TEXT,
  status public.order_status NOT NULL DEFAULT 'pending_payment',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_brand TEXT,
  product_image TEXT,
  unit_price NUMERIC(10,2) NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  line_total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- Order RLS
CREATE POLICY "Customers create own orders" ON public.orders
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers view own orders" ON public.orders
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins view all orders" ON public.orders
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update orders" ON public.orders
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers update own pending order proof" ON public.orders
FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status IN ('pending_payment','awaiting_verification'));

-- Order items RLS
CREATE POLICY "Customers insert items for own orders" ON public.order_items
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);

CREATE POLICY "Customers view items of own orders" ON public.order_items
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);

CREATE POLICY "Admins view all order items" ON public.order_items
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ATOMIC: place order + decrement stock
-- ============================================
CREATE OR REPLACE FUNCTION public.place_order(
  _customer_name TEXT,
  _customer_email TEXT,
  _customer_phone TEXT,
  _shipping_address TEXT,
  _shipping_city TEXT,
  _shipping_state TEXT,
  _shipping_pincode TEXT,
  _shipping_landmark TEXT,
  _shipping_speed TEXT,
  _installation BOOLEAN,
  _payment_method public.payment_method,
  _items JSONB  -- [{"product_id":"inv-1500","qty":2}, ...]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order_id UUID;
  _uid UUID := auth.uid();
  _item JSONB;
  _product RECORD;
  _line_qty INTEGER;
  _line_price NUMERIC(10,2);
  _subtotal NUMERIC(10,2) := 0;
  _shipping_fee NUMERIC(10,2);
  _install_fee NUMERIC(10,2);
  _tax NUMERIC(10,2);
  _total NUMERIC(10,2);
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'Cart is empty'; END IF;

  -- Validate stock + compute subtotal (lock product rows)
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _line_qty := (_item->>'qty')::INTEGER;
    SELECT id, name, stock, price, bulk_price, bulk_min_qty
      INTO _product
      FROM public.products
      WHERE id = (_item->>'product_id') AND active = TRUE
      FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product not found: %', _item->>'product_id'; END IF;
    IF _product.stock < _line_qty THEN
      RAISE EXCEPTION 'Insufficient stock for %', _product.name;
    END IF;
    _line_price := CASE
      WHEN _product.bulk_min_qty IS NOT NULL AND _product.bulk_price IS NOT NULL
        AND _line_qty >= _product.bulk_min_qty
      THEN _product.bulk_price
      ELSE _product.price
    END;
    _subtotal := _subtotal + (_line_price * _line_qty);
  END LOOP;

  _shipping_fee := CASE WHEN _shipping_speed = 'express' THEN 299 ELSE 0 END;
  _install_fee := CASE WHEN _installation THEN 499 ELSE 0 END;
  _tax := ROUND(_subtotal * 0.18, 2);
  _total := _subtotal + _shipping_fee + _install_fee + _tax;

  INSERT INTO public.orders (
    user_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_city, shipping_state, shipping_pincode, shipping_landmark,
    shipping_speed, installation, payment_method,
    subtotal, shipping_fee, install_fee, tax, total,
    status
  ) VALUES (
    _uid, _customer_name, _customer_email, _customer_phone,
    _shipping_address, _shipping_city, _shipping_state, _shipping_pincode, _shipping_landmark,
    _shipping_speed, _installation, _payment_method,
    _subtotal, _shipping_fee, _install_fee, _tax, _total,
    CASE WHEN _payment_method = 'cod' THEN 'processing'::public.order_status
         ELSE 'pending_payment'::public.order_status END
  ) RETURNING id INTO _order_id;

  -- Insert items + decrement stock
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _line_qty := (_item->>'qty')::INTEGER;
    SELECT id, name, brand, image_url, price, bulk_price, bulk_min_qty
      INTO _product
      FROM public.products
      WHERE id = (_item->>'product_id');
    _line_price := CASE
      WHEN _product.bulk_min_qty IS NOT NULL AND _product.bulk_price IS NOT NULL
        AND _line_qty >= _product.bulk_min_qty
      THEN _product.bulk_price
      ELSE _product.price
    END;
    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_brand, product_image,
      unit_price, qty, line_total
    ) VALUES (
      _order_id, _product.id, _product.name, _product.brand, _product.image_url,
      _line_price, _line_qty, _line_price * _line_qty
    );
    UPDATE public.products SET stock = stock - _line_qty WHERE id = _product.id;
  END LOOP;

  RETURN _order_id;
END;
$$;

-- ============================================
-- STORAGE: payment proofs + qr codes
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('qr-codes', 'qr-codes', true);

-- payment proofs: customer can upload to their own folder, admin can read all
CREATE POLICY "Customers upload payment proof" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Customers read own payment proof" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins read all payment proofs" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

-- qr codes: public read, admin write
CREATE POLICY "Public read qr codes" ON storage.objects
FOR SELECT USING (bucket_id = 'qr-codes');

CREATE POLICY "Admins manage qr codes" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'qr-codes' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'qr-codes' AND public.has_role(auth.uid(), 'admin'));

-- Seed default payment settings row
INSERT INTO public.payment_settings (upi_id, paytm_id, bank_account_name, bank_name, notes, cod_enabled)
VALUES ('voltzo@okhdfc', 'voltzo@paytm', 'Voltzo Pvt Ltd', 'HDFC Bank', 'After payment, upload screenshot below.', TRUE);

-- ============================================
-- SEED PRODUCTS (mirror src/lib/catalog.ts)
-- ============================================
INSERT INTO public.products (id, sku, name, brand, category, price, mrp, stock, low_stock_threshold, rating, reviews, heavy, installation, bulk_available, fast_delivery, bulk_price, bulk_min_qty, cross_sell_ids) VALUES
('inv-1500','VLZ-INV-1500','PowerMax 1500VA Pure Sine Wave Inverter','Voltzo','Power',12499,15999,42,5,4.6,842,FALSE,TRUE,TRUE,TRUE,10999,10,ARRAY['bat-220']),
('bat-220','VLZ-BAT-220','Tall Tubular Inverter Battery 220Ah','Voltzo','Power',18750,22500,18,5,4.7,1204,TRUE,TRUE,TRUE,TRUE,16500,10,ARRAY['inv-1500']),
('cctv-4mp','SEN-CCTV-4MP','4MP HD Dome CCTV Camera with Night Vision','Sentinel','Security',3299,4499,156,10,4.5,2310,FALSE,TRUE,TRUE,TRUE,2799,10,ARRAY['dvr-8ch']),
('dvr-8ch','SEN-DVR-8CH','8-Channel Full HD DVR Recorder','Sentinel','Security',5999,7999,28,5,4.4,678,FALSE,TRUE,TRUE,TRUE,5299,10,ARRAY['cctv-4mp']),
('sol-330','SUN-SOL-330','330W Polycrystalline Solar Panel','SunGrid','Solar',8999,11500,64,10,4.7,451,TRUE,TRUE,TRUE,FALSE,7999,10,ARRAY['inv-1500']),
('tv-43','PIX-TV-43','43" 4K Ultra HD Smart LED TV','Pixela','Appliances',24999,32999,12,5,4.5,3892,FALSE,TRUE,FALSE,TRUE,NULL,NULL,ARRAY[]::TEXT[]),
('ro-15','AQU-RO-15','RO + UV Water Purifier 15L','AquaPure','Appliances',13499,17999,38,5,4.6,1523,FALSE,TRUE,FALSE,TRUE,NULL,NULL,ARRAY[]::TEXT[]),
('ac-15','FRO-AC-15','1.5 Ton 5-Star Inverter Split AC','Frosta','Appliances',38999,49999,3,5,4.7,2102,TRUE,TRUE,TRUE,FALSE,35999,10,ARRAY[]::TEXT[]);
