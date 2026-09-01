ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS pricing_mode text NOT NULL DEFAULT 'show_price',
  ADD COLUMN IF NOT EXISTS bulk_tiers jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.products
  ADD CONSTRAINT products_pricing_mode_check
  CHECK (pricing_mode IN ('show_price', 'quote_only', 'show_price_bulk'));

CREATE TABLE public.quote_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference text NOT NULL DEFAULT ('QR-' || to_char(now(), 'YYMMDD') || '-' || lpad((floor(random() * 10000))::int::text, 4, '0')),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  location text NOT NULL DEFAULT '',
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL DEFAULT '',
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  variant_name text,
  quantity integer NOT NULL DEFAULT 1,
  message text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'quote',
  status text NOT NULL DEFAULT 'new',
  quoted_price numeric,
  staff_notes text NOT NULL DEFAULT '',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quote_requests_status_check CHECK (status IN ('new','contacted','quoted','accepted','rejected','closed')),
  CONSTRAINT quote_requests_kind_check CHECK (kind IN ('quote','bulk'))
);

GRANT INSERT ON public.quote_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quote requests public insert" ON public.quote_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "quote requests staff read" ON public.quote_requests
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "quote requests staff update" ON public.quote_requests
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "quote requests staff delete" ON public.quote_requests
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER quote_requests_touch BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX quote_requests_status_idx ON public.quote_requests(status, created_at DESC);