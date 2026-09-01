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
