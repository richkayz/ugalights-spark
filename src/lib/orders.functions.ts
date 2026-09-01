import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1).max(999),
});

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  location: z.string().trim().min(2).max(120),
  address: z.string().trim().max(400).optional().or(z.literal("")),
  notes: z.string().trim().max(600).optional().or(z.literal("")),
  paymentMethod: z.enum(["cod", "mobile_money", "whatsapp"]),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1).max(60),
});

function orderNumber(): string {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `UGA-${stamp}-${rand}`;
}

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data }) => {
    const { serviceClient } = await import("./supabase.server");
    const db = serviceClient();

    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const variantIds = data.items
      .map((i) => i.variantId)
      .filter((id): id is string => Boolean(id));

    const [{ data: products }, { data: variants }, { data: settingsRows }] = await Promise.all([
      db
        .from("products")
        .select("id,name,sku,price,sale_price,stock_quantity,is_published")
        .in("id", productIds),
      variantIds.length
        ? db
            .from("product_variants")
            .select("id,product_id,name,sku,price,sale_price,stock_quantity,is_active")
            .in("id", variantIds)
        : Promise.resolve({ data: [] as never[] }),
      db.from("settings").select("key,value"),
    ]);

    const settings = new Map((settingsRows ?? []).map((r) => [r.key, r.value]));
    const productMap = new Map((products ?? []).map((p) => [p.id, p]));
    const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

    const lines: {
      product_id: string;
      variant_id: string | null;
      product_name: string;
      variant_name: string | null;
      sku: string;
      unit_price: number;
      quantity: number;
      line_total: number;
      remaining: number;
    }[] = [];

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product || !product.is_published) {
        return { ok: false as const, message: "One of the products is no longer available." };
      }
      const variant = item.variantId ? variantMap.get(item.variantId) : null;
      if (item.variantId && (!variant || !variant.is_active)) {
        return { ok: false as const, message: "A selected option is no longer available." };
      }
      const base = Number(variant?.price ?? product.price);
      const sale = variant
        ? variant.sale_price != null
          ? Number(variant.sale_price)
          : null
        : product.sale_price != null
          ? Number(product.sale_price)
          : null;
      const unitPrice = sale != null && sale > 0 && sale < base ? sale : base;
      const stock = variant ? variant.stock_quantity : product.stock_quantity;
      if (stock < item.quantity) {
        return {
          ok: false as const,
          message: `${product.name} only has ${stock} unit(s) left in stock.`,
        };
      }
      lines.push({
        product_id: product.id,
        variant_id: variant?.id ?? null,
        product_name: product.name,
        variant_name: variant?.name ?? null,
        sku: variant?.sku || product.sku,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: unitPrice * item.quantity,
        remaining: stock - item.quantity,
      });
    }

    const subtotal = lines.reduce((sum, l) => sum + l.line_total, 0);

    const freeThreshold = Number(settings.get("free_delivery_threshold") ?? 0);
    const kampalaFee = Number(settings.get("delivery_fee_kampala") ?? 0);
    const upcountryFee = Number(settings.get("delivery_fee_upcountry") ?? kampalaFee);
    const isKampala = /kampala|wakiso|entebbe|mukono/i.test(data.location);
    let deliveryFee =
      freeThreshold > 0 && subtotal >= freeThreshold ? 0 : isKampala ? kampalaFee : upcountryFee;
    if (!Number.isFinite(deliveryFee)) deliveryFee = 0;

    // Coupon (re-validated server-side)
    let discount = 0;
    let appliedCoupon: string | null = null;
    if (data.couponCode) {
      const { data: coupon } = await db
        .from("coupons")
        .select("*")
        .eq("code", data.couponCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      const now = Date.now();
      const valid =
        coupon &&
        (!coupon.starts_at || new Date(coupon.starts_at).getTime() <= now) &&
        (!coupon.ends_at || new Date(coupon.ends_at).getTime() >= now) &&
        (coupon.usage_limit == null || coupon.used_count < coupon.usage_limit) &&
        subtotal >= Number(coupon.min_order_value);
      if (valid && coupon) {
        discount =
          coupon.discount_type === "percentage"
            ? Math.round((subtotal * Number(coupon.discount_value)) / 100)
            : Math.min(Number(coupon.discount_value), subtotal);
        appliedCoupon = coupon.code;
        await db
          .from("coupons")
          .update({ used_count: coupon.used_count + 1 })
          .eq("id", coupon.id);
      }
    }

    const total = Math.max(0, subtotal - discount) + deliveryFee;

    // Customer record (matched on phone)
    const { data: existing } = await db
      .from("customers")
      .select("id,orders_count,total_spent")
      .eq("phone", data.phone)
      .maybeSingle();

    let customerId = existing?.id ?? null;
    if (existing) {
      await db
        .from("customers")
        .update({
          full_name: data.customerName,
          email: data.email || null,
          orders_count: existing.orders_count + 1,
          total_spent: Number(existing.total_spent) + total,
          last_order_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      const { data: created } = await db
        .from("customers")
        .insert({
          full_name: data.customerName,
          phone: data.phone,
          email: data.email || null,
          orders_count: 1,
          total_spent: total,
          last_order_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      customerId = created?.id ?? null;
    }

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        order_number: orderNumber(),
        customer_id: customerId,
        customer_name: data.customerName,
        customer_phone: data.phone,
        customer_email: data.email || null,
        delivery_location: data.location,
        delivery_address: data.address || "",
        notes: data.notes || "",
        payment_method: data.paymentMethod,
        payment_status: data.paymentMethod === "cod" ? "cod" : "pending",
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
        coupon_code: appliedCoupon,
      })
      .select("id,order_number,access_token,total,delivery_fee,discount,subtotal")
      .single();

    if (orderError || !order) {
      console.error("Order insert failed", orderError);
      return { ok: false as const, message: "We could not place your order. Please try again." };
    }

    await db.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        product_id: l.product_id,
        variant_id: l.variant_id,
        product_name: l.product_name,
        variant_name: l.variant_name,
        sku: l.sku,
        unit_price: l.unit_price,
        quantity: l.quantity,
        line_total: l.line_total,
      })),
    );

    // Stock decrement + inventory log
    for (const line of lines) {
      if (line.variant_id) {
        await db
          .from("product_variants")
          .update({ stock_quantity: line.remaining })
          .eq("id", line.variant_id);
      } else {
        await db
          .from("products")
          .update({
            stock_quantity: line.remaining,
            stock_status: line.remaining <= 0 ? "out_of_stock" : "in_stock",
          })
          .eq("id", line.product_id);
      }
      await db.from("inventory_movements").insert({
        product_id: line.product_id,
        variant_id: line.variant_id,
        quantity_change: -line.quantity,
        resulting_stock: line.remaining,
        reason: "sale",
        reference: order.order_number,
      });
    }

    return {
      ok: true as const,
      orderNumber: order.order_number,
      accessToken: order.access_token,
      subtotal,
      deliveryFee,
      discount,
      total,
    };
  });

export const getOrderByToken = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ token: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { serviceClient } = await import("./supabase.server");
    const db = serviceClient();
    const { data: order } = await db
      .from("orders")
      .select(
        "id,order_number,customer_name,customer_phone,delivery_location,delivery_address,notes,payment_method,status,payment_status,subtotal,delivery_fee,discount,total,coupon_code,created_at",
      )
      .eq("access_token", data.token)
      .maybeSingle();
    if (!order) return { order: null, items: [] };
    const { data: items } = await db
      .from("order_items")
      .select("product_name,variant_name,quantity,unit_price,line_total")
      .eq("order_id", order.id);
    return { order, items: items ?? [] };
  });
