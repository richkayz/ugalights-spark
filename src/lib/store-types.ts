export type SettingsMap = Record<string, string>;

export type NavCategory = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  parent_id: string | null;
  is_featured: boolean;
};

export type StoreConfig = {
  settings: SettingsMap;
  categories: NavCategory[];
  footer?: HomepageSection | null;
};

export type PricingMode = "show_price" | "quote_only" | "show_price_bulk";

export type BulkTier = {
  minQty: number;
  maxQty: number | null;
  price: number | null;
  note: string;
};

export type QuoteStatus = "new" | "contacted" | "quoted" | "accepted" | "rejected" | "closed";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  main_image_url: string | null;
  stock_quantity: number;
  stock_status: string;
  is_new_arrival: boolean;
  is_bestseller: boolean;
  short_description: string;
  pricing_mode: PricingMode;
  bulk_tiers: BulkTier[];
};

export type CartLine = {
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  slug: string;
  sku: string;
  unitPrice: number;
  image: string | null;
  quantity: number;
};

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type HomepageSection = {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: Record<string, any>;
  sort_order: number;
  is_enabled: boolean;
};
