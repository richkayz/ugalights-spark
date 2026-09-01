-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','manager');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.staff_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.staff_profiles TO authenticated;
GRANT ALL ON public.staff_profiles TO service_role;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.staff_profiles sp ON sp.user_id = ur.user_id
    WHERE ur.user_id = _user_id AND sp.is_active
  );
$$;

CREATE POLICY "staff read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff read staff profiles" ON public.staff_profiles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER t_staff_profiles_updated BEFORE UPDATE ON public.staff_profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ MEDIA ============
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  url text NOT NULL,
  filename text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  content_type text NOT NULL DEFAULT 'image/jpeg',
  size_bytes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media public read" ON public.media FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "media staff write" ON public.media FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "media objects staff write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'media' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'media' AND public.is_staff(auth.uid()));
CREATE POLICY "media objects read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'media');

-- ============ CATALOGUE ============
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_active ON public.categories(is_active, sort_order);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sku text NOT NULL DEFAULT '',
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  sale_price numeric(12,2) CHECK (sale_price IS NULL OR sale_price >= 0),
  cost_price numeric(12,2),
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  stock_status text NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock','out_of_stock','backorder')),
  main_image_url text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  weight_kg numeric(10,3),
  dimensions text,
  is_featured boolean NOT NULL DEFAULT false,
  is_bestseller boolean NOT NULL DEFAULT false,
  is_new_arrival boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  sales_count integer NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_published ON public.products(is_published, created_at DESC);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_flags ON public.products(is_featured, is_bestseller, is_new_arrival);

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);
CREATE INDEX idx_product_images_product ON public.product_images(product_id, sort_order);

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text NOT NULL DEFAULT '',
  price numeric(12,2) NOT NULL DEFAULT 0,
  sale_price numeric(12,2),
  stock_quantity integer NOT NULL DEFAULT 0,
  image_url text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);
CREATE INDEX idx_variants_product ON public.product_variants(product_id, sort_order);

CREATE TABLE public.product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE INDEX idx_specs_product ON public.product_specifications(product_id, sort_order);

CREATE TRIGGER t_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CUSTOMERS & ORDERS ============
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  orders_count integer NOT NULL DEFAULT 0,
  total_spent numeric(14,2) NOT NULL DEFAULT 0,
  last_order_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phone)
);
CREATE TRIGGER t_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TYPE public.order_status AS ENUM ('pending','confirmed','processing','ready_for_delivery','out_for_delivery','completed','cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed','cod');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  access_token uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  delivery_location text NOT NULL,
  delivery_address text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  payment_method text NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod','mobile_money','whatsapp')),
  payment_reference text,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  coupon_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE TRIGGER t_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  variant_name text,
  sku text NOT NULL DEFAULT '',
  unit_price numeric(12,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total numeric(14,2) NOT NULL
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity_change integer NOT NULL,
  resulting_stock integer,
  reason text NOT NULL DEFAULT 'adjustment',
  reference text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inv_product ON public.inventory_movements(product_id, created_at DESC);

-- ============ PROMOTIONS ============
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric(12,2) NOT NULL DEFAULT 0,
  min_order_value numeric(14,2) NOT NULL DEFAULT 0,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  scope text NOT NULL DEFAULT 'category' CHECK (scope IN ('product','category','store')),
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric(12,2) NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ CMS ============
CREATE TABLE public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER t_homepage_updated BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.website_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  seo_title text,
  seo_description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER t_content_updated BEFORE UPDATE ON public.website_content FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER t_settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ GRANTS + RLS ============
GRANT SELECT ON public.brands, public.categories, public.products, public.product_images,
  public.product_variants, public.product_specifications, public.homepage_sections,
  public.website_content, public.settings, public.coupons, public.promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.brands, public.categories, public.products, public.product_images,
  public.product_variants, public.product_specifications, public.homepage_sections,
  public.website_content, public.settings, public.coupons, public.promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers, public.orders, public.order_items,
  public.inventory_movements TO authenticated;
GRANT ALL ON public.brands, public.categories, public.products, public.product_images,
  public.product_variants, public.product_specifications, public.homepage_sections,
  public.website_content, public.settings, public.coupons, public.promotions,
  public.customers, public.orders, public.order_items, public.inventory_movements TO service_role;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brands read" ON public.brands FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "brands staff" ON public.brands FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "categories read" ON public.categories FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "categories staff read" ON public.categories FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "categories staff write" ON public.categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "products read" ON public.products FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "products staff read" ON public.products FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "products staff write" ON public.products FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "product images read" ON public.product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "product images staff" ON public.product_images FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "variants read" ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "variants staff" ON public.product_variants FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "specs read" ON public.product_specifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "specs staff" ON public.product_specifications FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "homepage read" ON public.homepage_sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "homepage staff" ON public.homepage_sections FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "content read" ON public.website_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "content staff" ON public.website_content FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "settings read" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings staff" ON public.settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "coupons read" ON public.coupons FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "coupons staff" ON public.coupons FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "promotions read" ON public.promotions FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "promotions staff" ON public.promotions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "customers staff" ON public.customers FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "orders staff" ON public.orders FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "order items staff" ON public.order_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "inventory staff" ON public.inventory_movements FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ ORDER NUMBERS ============
CREATE SEQUENCE public.order_number_seq START 1001;
GRANT USAGE, SELECT ON SEQUENCE public.order_number_seq TO authenticated, service_role;

-- ============ SEED: SETTINGS ============
INSERT INTO public.settings (key, value) VALUES
  ('business_name','UGALights'),
  ('tagline','Because your home deserves the best'),
  ('phone','+256 700 000000'),
  ('whatsapp','+256700000000'),
  ('email','info@ugalights.com'),
  ('address','Kampala, Uganda'),
  ('currency','UGX'),
  ('delivery_fee','10000'),
  ('free_delivery_threshold','300000'),
  ('minimum_order','0'),
  ('opening_hours','Mon - Sat: 8:00am - 7:00pm'),
  ('facebook','https://facebook.com/ugalights'),
  ('instagram','https://instagram.com/ugalights'),
  ('tiktok',''),
  ('footer_text','UGALights supplies quality lighting and electrical accessories across Uganda.');

-- ============ SEED: HOMEPAGE SECTIONS ============
INSERT INTO public.homepage_sections (section_key, title, subtitle, content, sort_order, is_enabled) VALUES
('announcement','Free delivery on orders above UGX 300,000 within Kampala','', '{"link":"/shop"}'::jsonb, 1, true),
('hero','Light Up Your Space','Quality lighting and electrical accessories for homes, offices and businesses.',
 '{"primary_button_text":"Shop Now","primary_button_link":"/shop","secondary_button_text":"Chat on WhatsApp","image_url":""}'::jsonb, 2, true),
('featured_categories','Shop by Category','Find exactly the light you need','{}'::jsonb, 3, true),
('featured_products','Featured Products','Hand-picked lighting for every space','{}'::jsonb, 4, true),
('bestsellers','Best Sellers','What Uganda is buying right now','{}'::jsonb, 5, true),
('promo_banner','Solar & Security Lighting','Cut your power bill with efficient solar lighting solutions.',
 '{"button_text":"Explore Solar","button_link":"/category/solar-lights","image_url":""}'::jsonb, 6, true),
('why_us','Why Choose UGALights','Trusted lighting supplier since day one',
 '{"items":[{"title":"Genuine Quality","text":"Tested LED and electrical products, no cheap knock-offs."},{"title":"Countrywide Delivery","text":"Fast delivery in Kampala and across Uganda."},{"title":"Fair Prices","text":"Wholesale and retail pricing in UGX."},{"title":"Expert Advice","text":"Talk to us on WhatsApp before you buy."}]}'::jsonb, 7, true),
('popular_products','Popular Right Now','New arrivals and customer favourites','{}'::jsonb, 8, true),
('testimonials','What Our Customers Say','',
 '{"items":[{"name":"Sarah N.","location":"Kampala","text":"Ordered LED panels for my salon. Delivered same day and they look great."},{"name":"Moses K.","location":"Entebbe","text":"Best prices on flood lights I found in Uganda. Very helpful on WhatsApp."},{"name":"Grace A.","location":"Mukono","text":"The solar security light has been running perfectly for months."}]}'::jsonb, 9, true),
('whatsapp_cta','Need help choosing?','Send us a message on WhatsApp and we will guide you.','{"button_text":"Chat on WhatsApp"}'::jsonb, 10, true),
('newsletter','Get lighting deals first','Join our list for offers and new arrivals.','{"button_text":"Subscribe"}'::jsonb, 11, true);

-- ============ SEED: WEBSITE CONTENT ============
INSERT INTO public.website_content (page_key, title, body, seo_title, seo_description) VALUES
('about','About UGALights','UGALights is a Ugandan lighting and electrical retailer supplying LED bulbs, panels, flood lights, solar lighting, decorative fittings and electrical accessories to homes, offices, hotels and construction projects.

We started with one simple belief: because your home deserves the best. Every product we stock is tested for quality and priced fairly in UGX.','About UGALights | Lighting & Electrical Suppliers in Uganda','Learn about UGALights, a Ugandan supplier of LED lighting, solar lights and electrical accessories for homes and businesses.'),
('contact','Contact Us','Talk to our team about products, bulk orders and project quotations. WhatsApp is the fastest way to reach us.','Contact UGALights | Lighting Shop in Kampala','Contact UGALights by phone, WhatsApp or email for lighting and electrical product enquiries in Uganda.'),
('faq','Frequently Asked Questions','**Do you deliver countrywide?**
Yes. We deliver within Kampala same or next day and countrywide via courier.

**What payment methods do you accept?**
Cash on delivery, Mobile Money (MTN and Airtel) and WhatsApp-confirmed orders.

**Do I need an account to order?**
No. You can check out as a guest.

**Do you offer warranties?**
Most LED products carry a manufacturer warranty. Ask us on WhatsApp for specifics.','UGALights FAQ | Orders, Delivery & Payments','Answers to common questions about ordering lighting products from UGALights in Uganda.'),
('delivery','Delivery Information','**Kampala:** Same-day or next-day delivery.
**Upcountry:** 1-3 working days by courier.
**Delivery fee:** From UGX 10,000 depending on location.
**Free delivery:** On orders above UGX 300,000 within Kampala.

We will call or WhatsApp you to confirm your order before dispatch.','Delivery Information | UGALights Uganda','UGALights delivery times, fees and free delivery threshold for lighting orders in Uganda.'),
('terms','Terms & Conditions','By placing an order with UGALights you agree to these terms. Prices are in Ugandan Shillings and may change without notice. Orders are confirmed by phone or WhatsApp before dispatch. Goods remain the property of UGALights until paid in full.','Terms & Conditions | UGALights','Terms and conditions for purchasing lighting and electrical products from UGALights.'),
('privacy','Privacy Policy','We collect only the information needed to process and deliver your order: your name, phone number, optional email, and delivery location. We never sell your data. Your details are shared only with the courier handling your delivery.','Privacy Policy | UGALights','How UGALights collects, uses and protects your personal information.');

-- ============ SEED: BRANDS & CATEGORIES ============
INSERT INTO public.brands (name, slug) VALUES ('UGALights','ugalights'),('Philips','philips'),('Osram','osram'),('Generic','generic');

INSERT INTO public.categories (name, slug, description, sort_order, is_featured) VALUES
('LED Bulbs','led-bulbs','Energy saving LED bulbs in all wattages.',1,true),
('LED Panels','led-panels','Slim ceiling and surface LED panel lights.',2,true),
('Flood Lights','flood-lights','High output flood lighting for compounds and sites.',3,true),
('Security Lights','security-lights','Motion and dusk-to-dawn security lighting.',4,true),
('Solar Lights','solar-lights','Solar powered street, garden and security lights.',5,true),
('Decorative Lights','decorative-lights','Chandeliers, pendants and feature lighting.',6,true),
('Indoor Lighting','indoor-lighting','Lighting for living rooms, bedrooms and offices.',7,false),
('Outdoor Lighting','outdoor-lighting','Weatherproof lighting for outdoor spaces.',8,true),
('Ceiling Lights','ceiling-lights','Surface and recessed ceiling fittings.',9,false),
('Wall Lights','wall-lights','Indoor and outdoor wall mounted fittings.',10,false),
('LED Strip Lights','led-strip-lights','Flexible LED strips and accessories.',11,true),
('Electrical Accessories','electrical-accessories','Everyday electrical fittings and accessories.',12,true),
('Switches & Sockets','switches-sockets','Wall switches, sockets and plates.',13,false),
('Cables','cables','Electrical cables and wiring.',14,false),
('Extension Cables','extension-cables','Extension cords and multi-sockets.',15,false),
('Other Accessories','other-accessories','Holders, drivers, tapes and spares.',16,false);
