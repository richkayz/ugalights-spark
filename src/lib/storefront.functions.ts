import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  HomepageSection,
  NavCategory,
  ProductCardData,
  SettingsMap,
  StoreConfig,
} from "./store-types";

const PRODUCT_CARD_COLUMNS =
  "id,name,slug,price,sale_price,main_image_url,stock_quantity,stock_status,is_new_arrival,is_bestseller,short_description";

function toSettings(rows: { key: string; value: string }[] | null): SettingsMap {
  const map: SettingsMap = {};
  for (const row of rows ?? []) map[row.key] = row.value;
  return map;
}

export const getStoreConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreConfig> => {
    const { publicClient } = await import("./supabase.server");
    const db = publicClient();
    const [settings, categories] = await Promise.all([
      db.from("settings").select("key,value"),
      db
        .from("categories")
        .select("id,name,slug,image_url,parent_id,is_featured")
        .eq("is_active", true)
        .order("sort_order"),
    ]);
    return {
      settings: toSettings(settings.data),
      categories: (categories.data ?? []) as NavCategory[],
    };
  },
);

export const getHomepage = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./supabase.server");
  const db = publicClient();
  const [sections, featuredCats, featured, bestsellers, newest] = await Promise.all([
    db.from("homepage_sections").select("*").eq("is_enabled", true).order("sort_order"),
    db
      .from("categories")
      .select("id,name,slug,image_url,parent_id,is_featured")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("sort_order")
      .limit(8),
    db
      .from("products")
      .select(PRODUCT_CARD_COLUMNS)
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("products")
      .select(PRODUCT_CARD_COLUMNS)
      .eq("is_published", true)
      .eq("is_bestseller", true)
      .order("sales_count", { ascending: false })
      .limit(8),
    db
      .from("products")
      .select(PRODUCT_CARD_COLUMNS)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return {
    sections: (sections.data ?? []) as unknown as HomepageSection[],
    featuredCategories: (featuredCats.data ?? []) as NavCategory[],
    featured: (featured.data ?? []) as unknown as ProductCardData[],
    bestsellers: (bestsellers.data ?? []) as unknown as ProductCardData[],
    newest: (newest.data ?? []) as unknown as ProductCardData[],
  };
});

const shopSchema = z.object({
  q: z.string().max(120).optional(),
  category: z.string().max(120).optional(),
  brand: z.string().max(120).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  attribute: z.string().max(80).optional(),
  sort: z
    .enum(["featured", "newest", "price_asc", "price_desc", "bestselling"])
    .default("featured"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(4).max(48).default(12),
});

export const getShopProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => shopSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase.server");
    const db = publicClient();

    let categoryIds: string[] | null = null;
    let categoryRow: { id: string; name: string; description: string; slug: string } | null =
      null;
    if (data.category) {
      const { data: cat } = await db
        .from("categories")
        .select("id,name,description,slug")
        .eq("slug", data.category)
        .eq("is_active", true)
        .maybeSingle();
      if (cat) {
        categoryRow = cat;
        const { data: children } = await db
          .from("categories")
          .select("id")
          .eq("parent_id", cat.id);
        categoryIds = [cat.id, ...(children ?? []).map((c) => c.id)];
      } else {
        categoryIds = ["00000000-0000-0000-0000-000000000000"];
      }
    }

    let query = db
      .from("products")
      .select(PRODUCT_CARD_COLUMNS, { count: "exact" })
      .eq("is_published", true);

    if (categoryIds) query = query.in("category_id", categoryIds);
    if (data.q) query = query.or(`name.ilike.%${data.q}%,short_description.ilike.%${data.q}%`);
    if (data.brand) query = query.eq("brand_id", data.brand);
    if (data.minPrice != null) query = query.gte("price", data.minPrice);
    if (data.maxPrice != null) query = query.lte("price", data.maxPrice);

    switch (data.sort) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "bestselling":
        query = query.order("sales_count", { ascending: false });
        break;
      default:
        query = query
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });
    }

    const from = (data.page - 1) * data.pageSize;
    const { data: rows, count } = await query.range(from, from + data.pageSize - 1);

    const { data: brands } = await db.from("brands").select("id,name,slug").order("name");

    return {
      items: (rows ?? []) as unknown as ProductCardData[],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      category: categoryRow,
      brands: brands ?? [],
    };
  });

export const getProductPage = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(160) }).parse(input))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase.server");
    const db = publicClient();
    const { data: product } = await db
      .from("products")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!product) return { product: null };

    const [images, variants, specs, category, related] = await Promise.all([
      db.from("product_images").select("id,url,alt_text").eq("product_id", product.id).order("sort_order"),
      db
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_active", true)
        .order("sort_order"),
      db
        .from("product_specifications")
        .select("label,value")
        .eq("product_id", product.id)
        .order("sort_order"),
      product.category_id
        ? db.from("categories").select("id,name,slug").eq("id", product.category_id).maybeSingle()
        : Promise.resolve({ data: null }),
      product.category_id
        ? db
            .from("products")
            .select(PRODUCT_CARD_COLUMNS)
            .eq("is_published", true)
            .eq("category_id", product.category_id)
            .neq("id", product.id)
            .limit(4)
        : Promise.resolve({ data: [] }),
    ]);

    return {
      product,
      images: images.data ?? [],
      variants: variants.data ?? [],
      specs: specs.data ?? [],
      category: category.data ?? null,
      related: (related.data ?? []) as unknown as ProductCardData[],
    };
  });

export const getPageContent = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ pageKey: z.string().max(40) }).parse(input))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase.server");
    const db = publicClient();
    const { data: page } = await db
      .from("website_content")
      .select("page_key,title,body,seo_title,seo_description")
      .eq("page_key", data.pageKey)
      .maybeSingle();
    return { page: page ?? null };
  });

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().min(2).max(40), subtotal: z.number().nonnegative() }).parse(
      input,
    ),
  )
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase.server");
    const db = publicClient();
    const { data: coupon } = await db
      .from("coupons")
      .select("code,discount_type,discount_value,min_order_value,usage_limit,used_count,starts_at,ends_at,is_active")
      .eq("code", data.code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (!coupon) return { valid: false as const, message: "Coupon code not found." };
    const now = Date.now();
    if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now)
      return { valid: false as const, message: "This coupon is not active yet." };
    if (coupon.ends_at && new Date(coupon.ends_at).getTime() < now)
      return { valid: false as const, message: "This coupon has expired." };
    if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit)
      return { valid: false as const, message: "This coupon has reached its usage limit." };
    if (data.subtotal < Number(coupon.min_order_value))
      return {
        valid: false as const,
        message: `Minimum order for this coupon is UGX ${Number(coupon.min_order_value).toLocaleString("en-UG")}.`,
      };

    const discount =
      coupon.discount_type === "percentage"
        ? Math.round((data.subtotal * Number(coupon.discount_value)) / 100)
        : Math.min(Number(coupon.discount_value), data.subtotal);

    return { valid: true as const, code: coupon.code, discount, message: "Coupon applied." };
  });
