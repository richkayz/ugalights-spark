import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "ready_for_delivery",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

const PAYMENT_STATUSES = ["pending", "paid", "failed", "cod"] as const;

/** Throws when the signed-in user is not active staff. */
async function assertStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("staff_profiles")
    .select("user_id,full_name,email,is_active")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (error || !data || !data.is_active) {
    throw new Response("Forbidden", { status: 403 });
  }
  const { data: roles } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  return {
    profile: data as { user_id: string; full_name: string; email: string; is_active: boolean },
    roles: ((roles ?? []) as { role: string }[]).map((r) => r.role),
  };
}

export const getAdminSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const staff = await assertStaff(context as any);
    return { fullName: staff.profile.full_name, email: staff.profile.email, roles: staff.roles };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;

    const [orders, products, customers, lowStock, recent] = await Promise.all([
      db.from("orders").select("total,status,created_at"),
      db.from("products").select("id", { count: "exact", head: true }),
      db.from("customers").select("id", { count: "exact", head: true }),
      db
        .from("products")
        .select("id,name,slug,stock_quantity,low_stock_threshold")
        .order("stock_quantity", { ascending: true })
        .limit(8),
      db
        .from("orders")
        .select("id,order_number,customer_name,total,status,created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const allOrders = (orders.data ?? []) as { total: number; status: string; created_at: string }[];
    const revenue = allOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total), 0);
    const pending = allOrders.filter((o) => o.status === "pending").length;

    const now = new Date();
    const days: { date: string; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
      const total = allOrders
        .filter((o) => o.status !== "cancelled" && o.created_at.slice(0, 10) === day)
        .reduce((sum, o) => sum + Number(o.total), 0);
      days.push({ date: day, revenue: total });
    }

    return {
      revenue,
      orderCount: allOrders.length,
      pendingCount: pending,
      productCount: products.count ?? 0,
      customerCount: customers.count ?? 0,
      lowStock: (lowStock.data ?? []) as {
        id: string;
        name: string;
        slug: string;
        stock_quantity: number;
        low_stock_threshold: number;
      }[],
      recentOrders: (recent.data ?? []) as {
        id: string;
        order_number: string;
        customer_name: string;
        total: number;
        status: string;
        created_at: string;
      }[],
      salesTrend: days,
    };
  });

export const listAdminOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(ORDER_STATUSES).optional(),
        q: z.string().max(80).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    let query = db
      .from("orders")
      .select(
        "id,order_number,customer_name,customer_phone,delivery_location,total,status,payment_status,payment_method,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.status) query = query.eq("status", data.status);
    if (data.q)
      query = query.or(
        `order_number.ilike.%${data.q}%,customer_name.ilike.%${data.q}%,customer_phone.ilike.%${data.q}%`,
      );
    const { data: rows } = await query;
    return { orders: rows ?? [] };
  });

export const getAdminOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const { data: order } = await db.from("orders").select("*").eq("id", data.id).maybeSingle();
    if (!order) return { order: null, items: [] };
    const { data: items } = await db
      .from("order_items")
      .select("product_name,variant_name,sku,quantity,unit_price,line_total")
      .eq("order_id", data.id);
    return { order, items: items ?? [] };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(ORDER_STATUSES).optional(),
        paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const patch: Record<string, string> = {};
    if (data.status) patch["status"] = data.status;
    if (data.paymentStatus) patch["payment_status"] = data.paymentStatus;
    const { error } = await db.from("orders").update(patch).eq("id", data.id);
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  });

export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ q: z.string().max(80).optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    let query = db
      .from("products")
      .select(
        "id,name,slug,sku,price,sale_price,stock_quantity,low_stock_threshold,is_published,is_featured,main_image_url,category_id,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.q) query = query.or(`name.ilike.%${data.q}%,sku.ilike.%${data.q}%`);
    const [{ data: rows }, { data: categories }] = await Promise.all([
      query,
      db.from("categories").select("id,name").order("name"),
    ]);
    return { products: rows ?? [], categories: categories ?? [] };
  });

export const setProductFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        isPublished: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        stockQuantity: z.number().int().min(0).max(1000000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const patch: Record<string, unknown> = {};
    if (data.isPublished !== undefined) patch["is_published"] = data.isPublished;
    if (data.isFeatured !== undefined) patch["is_featured"] = data.isFeatured;
    if (data.stockQuantity !== undefined) {
      patch["stock_quantity"] = data.stockQuantity;
      patch["stock_status"] = data.stockQuantity > 0 ? "in_stock" : "out_of_stock";
    }
    const { error } = await db.from("products").update(patch).eq("id", data.id);
    if (error) return { ok: false as const, message: error.message };
    if (data.stockQuantity !== undefined) {
      await db.from("inventory_movements").insert({
        product_id: data.id,
        quantity_change: 0,
        resulting_stock: data.stockQuantity,
        reason: "adjustment",
        created_by: (context as any).userId,
      });
    }
    return { ok: true as const };
  });

export const listAdminCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const { data } = await db
      .from("customers")
      .select("id,full_name,phone,email,orders_count,total_spent,last_order_at,created_at")
      .order("total_spent", { ascending: false })
      .limit(200);
    return { customers: data ?? [] };
  });

export const listInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const [{ data: products }, { data: movements }] = await Promise.all([
      db
        .from("products")
        .select("id,name,sku,stock_quantity,low_stock_threshold,stock_status")
        .order("stock_quantity", { ascending: true })
        .limit(200),
      db
        .from("inventory_movements")
        .select("id,product_id,quantity_change,resulting_stock,reason,reference,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return { products: products ?? [], movements: movements ?? [] };
  });

export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const { data } = await db.from("settings").select("key,value").order("key");
    return { settings: (data ?? []) as { key: string; value: string }[] };
  });

export const updateAdminSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ key: z.string().max(60), value: z.string().max(2000) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const { error } = await db
      .from("settings")
      .upsert({ key: data.key, value: data.value }, { onConflict: "key" });
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  });

// ===================== Homepage editor =====================

export const listHomepageSections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const { data, error } = await db
      .from("homepage_sections")
      .select("id,section_key,title,subtitle,content,sort_order,is_enabled")
      .order("sort_order");
    if (error) return { sections: [], message: error.message };
    return {
      sections: (data ?? []) as {
        id: string;
        section_key: string;
        title: string;
        subtitle: string;
        content: Record<string, any>;
        sort_order: number;
        is_enabled: boolean;
      }[],
    };
  });

export const saveHomepageSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().max(200).optional(),
        subtitle: z.string().max(400).optional(),
        content: z.record(z.string(), z.any()).optional(),
        isEnabled: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch["title"] = data.title;
    if (data.subtitle !== undefined) patch["subtitle"] = data.subtitle;
    if (data.content !== undefined) patch["content"] = data.content;
    if (data.isEnabled !== undefined) patch["is_enabled"] = data.isEnabled;
    if (Object.keys(patch).length === 0) return { ok: true as const };
    const { error } = await db.from("homepage_sections").update(patch).eq("id", data.id);
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  });

/** Persists a new display order for homepage sections. */
export const reorderHomepageSections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(60) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    for (let i = 0; i < data.ids.length; i++) {
      const { error } = await db
        .from("homepage_sections")
        .update({ sort_order: i + 1 })
        .eq("id", data.ids[i]);
      if (error) return { ok: false as const, message: error.message };
    }
    return { ok: true as const };
  });

/* ---------------------------------------------------------------------------
 * Catalogue management (products, categories, brands, coupons)
 * ------------------------------------------------------------------------- */

function adminOrderNumber(): string {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `UGA-${stamp}-${rand}`;
}

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  sku: z.string().max(80).default(""),
  shortDescription: z.string().max(500).default(""),
  description: z.string().max(20000).default(""),
  price: z.number().min(0),
  salePrice: z.number().min(0).nullable().optional(),
  costPrice: z.number().min(0).nullable().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  categoryId: z.string().uuid().nullable().optional(),
  subcategoryId: z.string().uuid().nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
  mainImageUrl: z.string().max(600).nullable().optional(),
  tags: z.array(z.string().max(50)).max(30).default([]),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  seoTitle: z.string().max(200).nullable().optional(),
  seoDescription: z.string().max(400).nullable().optional(),
  images: z.array(z.object({ url: z.string().min(1).max(600), altText: z.string().max(200).default("") })).max(20).default([]),
  specifications: z.array(z.object({ label: z.string().min(1).max(120), value: z.string().min(1).max(400) })).max(40).default([]),
  variants: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        sku: z.string().max(80).default(""),
        price: z.number().min(0),
        salePrice: z.number().min(0).nullable().optional(),
        stockQuantity: z.number().int().min(0).default(0),
      }),
    )
    .max(30)
    .default([]),
});

/** Loads one product with its images, specs and variants for the editor. */
export const getAdminProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const [{ data: product }, { data: images }, { data: specs }, { data: variants }] = await Promise.all([
      db.from("products").select("*").eq("id", data.id).maybeSingle(),
      db.from("product_images").select("url,alt_text,sort_order").eq("product_id", data.id).order("sort_order"),
      db.from("product_specifications").select("label,value,sort_order").eq("product_id", data.id).order("sort_order"),
      db.from("product_variants").select("name,sku,price,sale_price,stock_quantity,sort_order").eq("product_id", data.id).order("sort_order"),
    ]);
    return {
      product: product ?? null,
      images: images ?? [],
      specifications: specs ?? [],
      variants: variants ?? [],
    };
  });

/** Reference lists used by the product editor selects. */
export const getCatalogueOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const [{ data: categories }, { data: brands }] = await Promise.all([
      db.from("categories").select("id,name,parent_id").order("name"),
      db.from("brands").select("id,name").order("name"),
    ]);
    return { categories: categories ?? [], brands: brands ?? [] };
  });

/** Creates or updates a product together with its gallery, specs and variants. */
export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const row = {
      name: data.name,
      slug: data.slug,
      sku: data.sku,
      short_description: data.shortDescription,
      description: data.description,
      price: data.price,
      sale_price: data.salePrice ?? null,
      cost_price: data.costPrice ?? null,
      stock_quantity: data.stockQuantity,
      low_stock_threshold: data.lowStockThreshold,
      stock_status: data.stockQuantity > 0 ? "in_stock" : "out_of_stock",
      category_id: data.categoryId ?? null,
      subcategory_id: data.subcategoryId ?? null,
      brand_id: data.brandId ?? null,
      main_image_url: data.mainImageUrl ?? null,
      tags: data.tags,
      is_published: data.isPublished,
      is_featured: data.isFeatured,
      is_bestseller: data.isBestseller,
      is_new_arrival: data.isNewArrival,
      seo_title: data.seoTitle ?? null,
      seo_description: data.seoDescription ?? null,
    };

    let productId = data.id ?? null;
    if (productId) {
      const { error } = await db.from("products").update(row).eq("id", productId);
      if (error) return { ok: false as const, message: error.message };
    } else {
      const { data: created, error } = await db.from("products").insert(row).select("id").maybeSingle();
      if (error || !created) return { ok: false as const, message: error?.message ?? "Could not create product" };
      productId = created.id as string;
    }

    await Promise.all([
      db.from("product_images").delete().eq("product_id", productId),
      db.from("product_specifications").delete().eq("product_id", productId),
      db.from("product_variants").delete().eq("product_id", productId),
    ]);

    if (data.images.length > 0) {
      await db.from("product_images").insert(
        data.images.map((img, i) => ({
          product_id: productId,
          url: img.url,
          alt_text: img.altText || data.name,
          sort_order: i,
        })),
      );
    }
    if (data.specifications.length > 0) {
      await db.from("product_specifications").insert(
        data.specifications.map((spec, i) => ({
          product_id: productId,
          label: spec.label,
          value: spec.value,
          sort_order: i,
        })),
      );
    }
    if (data.variants.length > 0) {
      await db.from("product_variants").insert(
        data.variants.map((v, i) => ({
          product_id: productId,
          name: v.name,
          sku: v.sku,
          price: v.price,
          sale_price: v.salePrice ?? null,
          stock_quantity: v.stockQuantity,
          sort_order: i,
          is_active: true,
        })),
      );
    }

    return { ok: true as const, id: productId as string };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const { error } = await db.from("products").delete().eq("id", data.id);
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  });

export const listAdminCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const [{ data: categories }, { data: products }] = await Promise.all([
      db
        .from("categories")
        .select("id,parent_id,name,slug,description,image_url,sort_order,is_active,is_featured")
        .order("sort_order"),
      db.from("products").select("category_id"),
    ]);
    const counts: Record<string, number> = {};
    for (const p of (products ?? []) as { category_id: string | null }[]) {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
    }
    return { categories: categories ?? [], counts };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(2).max(120),
        slug: z.string().min(2).max(120),
        description: z.string().max(2000).default(""),
        imageUrl: z.string().max(600).nullable().optional(),
        parentId: z.string().uuid().nullable().optional(),
        sortOrder: z.number().int().min(0).default(0),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const row = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      image_url: data.imageUrl ?? null,
      parent_id: data.parentId ?? null,
      sort_order: data.sortOrder,
      is_active: data.isActive,
      is_featured: data.isFeatured,
    };
    const { error } = data.id
      ? await db.from("categories").update(row).eq("id", data.id)
      : await db.from("categories").insert(row);
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const { error } = await db.from("categories").delete().eq("id", data.id);
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  });

export const listAdminCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const { data } = await db
      .from("coupons")
      .select("id,code,description,discount_type,discount_value,min_order_value,usage_limit,used_count,starts_at,ends_at,is_active")
      .order("created_at", { ascending: false });
    return { coupons: data ?? [] };
  });

export const saveCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        code: z.string().min(2).max(40),
        description: z.string().max(300).default(""),
        discountType: z.enum(["percentage", "fixed"]).default("percentage"),
        discountValue: z.number().min(0),
        minOrderValue: z.number().min(0).default(0),
        usageLimit: z.number().int().min(0).nullable().optional(),
        endsAt: z.string().max(40).nullable().optional(),
        isActive: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const row = {
      code: data.code.toUpperCase().trim(),
      description: data.description,
      discount_type: data.discountType,
      discount_value: data.discountValue,
      min_order_value: data.minOrderValue,
      usage_limit: data.usageLimit ?? null,
      ends_at: data.endsAt ? new Date(data.endsAt).toISOString() : null,
      is_active: data.isActive,
    };
    const { error } = data.id
      ? await db.from("coupons").update(row).eq("id", data.id)
      : await db.from("coupons").insert(row);
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const { error } = await db.from("coupons").delete().eq("id", data.id);
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  });

/* ---------------------------------------------------------------------------
 * Customers
 * ------------------------------------------------------------------------- */

export const saveCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        fullName: z.string().min(2).max(150),
        phone: z.string().min(5).max(40),
        email: z.string().max(150).nullable().optional(),
        notes: z.string().max(2000).default(""),
        isActive: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const row = {
      full_name: data.fullName,
      phone: data.phone,
      email: data.email || null,
      notes: data.notes,
      is_active: data.isActive,
    };
    const { error } = data.id
      ? await db.from("customers").update(row).eq("id", data.id)
      : await db.from("customers").insert(row);
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const { error } = await db.from("customers").delete().eq("id", data.id);
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  });

/** Customer detail with their order history. */
export const getAdminCustomer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const [{ data: customer }, { data: orders }] = await Promise.all([
      db.from("customers").select("*").eq("id", data.id).maybeSingle(),
      db
        .from("orders")
        .select("id,order_number,total,status,payment_status,created_at")
        .eq("customer_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    return { customer: customer ?? null, orders: orders ?? [] };
  });

/* ---------------------------------------------------------------------------
 * Manual orders + inventory adjustments
 * ------------------------------------------------------------------------- */

/** Lightweight product list for the manual-order and inventory pickers. */
export const listProductPicker = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const { data } = await db
      .from("products")
      .select("id,name,sku,price,sale_price,stock_quantity")
      .order("name")
      .limit(500);
    return { products: data ?? [] };
  });

/** Creates an order manually (phone/walk-in sales) and adjusts stock. */
export const createManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        customerName: z.string().min(2).max(150),
        customerPhone: z.string().min(5).max(40),
        customerEmail: z.string().max(150).optional().default(""),
        deliveryLocation: z.string().min(2).max(120),
        deliveryAddress: z.string().max(400).default(""),
        notes: z.string().max(2000).default(""),
        paymentMethod: z.enum(["cod", "mobile_money", "bank_transfer", "cash", "whatsapp"]).default("cash"),
        paymentStatus: z.enum(PAYMENT_STATUSES).default("pending"),
        status: z.enum(ORDER_STATUSES).default("confirmed"),
        deliveryFee: z.number().min(0).default(0),
        discount: z.number().min(0).default(0),
        items: z
          .array(
            z.object({
              productId: z.string().uuid(),
              quantity: z.number().int().min(1).max(999),
              unitPrice: z.number().min(0),
            }),
          )
          .min(1)
          .max(50),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;

    const ids = data.items.map((i) => i.productId);
    const { data: products } = await db
      .from("products")
      .select("id,name,sku,stock_quantity")
      .in("id", ids);
    const byId = new Map(
      ((products ?? []) as { id: string; name: string; sku: string; stock_quantity: number }[]).map(
        (p) => [p.id, p],
      ),
    );
    if (byId.size !== new Set(ids).size) {
      return { ok: false as const, message: "One or more products no longer exist" };
    }

    const lines = data.items.map((item) => {
      const product = byId.get(item.productId)!;
      return {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        line_total: item.unitPrice * item.quantity,
      };
    });
    const subtotal = lines.reduce((sum, l) => sum + l.line_total, 0);
    const total = Math.max(0, subtotal + data.deliveryFee - data.discount);

    // Reuse an existing customer with the same phone, otherwise create one.
    const { data: existing } = await db
      .from("customers")
      .select("id,orders_count,total_spent")
      .eq("phone", data.customerPhone)
      .maybeSingle();
    let customerId = existing?.id as string | undefined;
    if (!customerId) {
      const { data: created } = await db
        .from("customers")
        .insert({
          full_name: data.customerName,
          phone: data.customerPhone,
          email: data.customerEmail || null,
        })
        .select("id")
        .maybeSingle();
      customerId = created?.id as string | undefined;
    }

    const { data: order, error } = await db
      .from("orders")
      .insert({
        order_number: adminOrderNumber(),
        customer_id: customerId ?? null,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail || null,
        delivery_location: data.deliveryLocation,
        delivery_address: data.deliveryAddress,
        notes: data.notes,
        payment_method: data.paymentMethod,
        payment_status: data.paymentStatus,
        status: data.status,
        subtotal,
        delivery_fee: data.deliveryFee,
        discount: data.discount,
        total,
      })
      .select("id,order_number")
      .maybeSingle();
    if (error || !order) return { ok: false as const, message: error?.message ?? "Could not create order" };

    const { error: itemsError } = await db
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (itemsError) return { ok: false as const, message: itemsError.message };

    for (const line of lines) {
      const product = byId.get(line.product_id)!;
      const resulting = Math.max(0, product.stock_quantity - line.quantity);
      await db
        .from("products")
        .update({
          stock_quantity: resulting,
          stock_status: resulting > 0 ? "in_stock" : "out_of_stock",
        })
        .eq("id", line.product_id);
      await db.from("inventory_movements").insert({
        product_id: line.product_id,
        quantity_change: -line.quantity,
        resulting_stock: resulting,
        reason: "sale",
        reference: order.order_number,
        created_by: (context as any).userId,
      });
    }

    if (customerId) {
      await db
        .from("customers")
        .update({
          orders_count: (existing?.orders_count ?? 0) + 1,
          total_spent: Number(existing?.total_spent ?? 0) + total,
          last_order_at: new Date().toISOString(),
        })
        .eq("id", customerId);
    }

    return { ok: true as const, id: order.id as string, orderNumber: order.order_number as string };
  });

/** Records a stock adjustment (restock, damage, correction) with an audit trail. */
export const adjustInventory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        quantityChange: z.number().int().min(-100000).max(100000),
        reason: z.enum(["restock", "adjustment", "damage", "return"]).default("adjustment"),
        reference: z.string().max(120).default(""),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as any);
    const db = (context as any).supabase;
    const { data: product } = await db
      .from("products")
      .select("stock_quantity")
      .eq("id", data.productId)
      .maybeSingle();
    if (!product) return { ok: false as const, message: "Product not found" };
    const resulting = Math.max(0, Number(product.stock_quantity) + data.quantityChange);
    const { error } = await db
      .from("products")
      .update({
        stock_quantity: resulting,
        stock_status: resulting > 0 ? "in_stock" : "out_of_stock",
      })
      .eq("id", data.productId);
    if (error) return { ok: false as const, message: error.message };
    await db.from("inventory_movements").insert({
      product_id: data.productId,
      quantity_change: data.quantityChange,
      resulting_stock: resulting,
      reason: data.reason,
      reference: data.reference || null,
      created_by: (context as any).userId,
    });
    return { ok: true as const, resulting };
  });
