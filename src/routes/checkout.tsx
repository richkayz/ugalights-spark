import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { useCart } from "@/lib/cart";
import { formatUGX, PAYMENT_METHOD_LABELS, UGANDA_LOCATIONS } from "@/lib/format";
import { createOrder } from "@/lib/orders.functions";
import { validateCoupon } from "@/lib/storefront.functions";
import { useStoreConfig } from "@/hooks/use-store-config";
import { orderMessage, whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | UGALights Uganda" },
      {
        name: "description",
        content:
          "Complete your UGALights order. Pay cash on delivery, by mobile money, or finish the order on WhatsApp.",
      },
      { property: "og:title", content: "Checkout | UGALights" },
      { property: "og:description", content: "Complete your UGALights lighting order." },
    ],
  }),
  component: CheckoutPage,
});

type PaymentMethod = "cod" | "mobile_money" | "whatsapp";

function CheckoutPage() {
  const cart = useCart();
  const { settings } = useStoreConfig();
  const navigate = useNavigate();
  const placeOrder = useServerFn(createOrder);
  const checkCoupon = useServerFn(validateCoupon);

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    location: UGANDA_LOCATIONS[0]!,
    address: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const freeThreshold = Number(settings["free_delivery_threshold"] ?? 0);
  const kampalaFee = Number(settings["delivery_fee_kampala"] ?? 0);
  const upcountryFee = Number(settings["delivery_fee_upcountry"] ?? kampalaFee);
  const isKampala = /kampala|wakiso|entebbe|mukono/i.test(form.location);
  const deliveryFee =
    freeThreshold > 0 && cart.subtotal >= freeThreshold ? 0 : isKampala ? kampalaFee : upcountryFee;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, cart.subtotal - discount) + (Number.isFinite(deliveryFee) ? deliveryFee : 0);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    const result = await checkCoupon({
      data: { code: couponInput.trim(), subtotal: cart.subtotal },
    });
    if (result.valid) {
      setCoupon({ code: result.code, discount: result.discount });
      toast.success(result.message);
    } else {
      setCoupon(null);
      toast.error(result.message);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (cart.lines.length === 0) return;
    setSubmitting(true);
    try {
      const result = await placeOrder({
        data: {
          customerName: form.customerName,
          phone: form.phone,
          email: form.email,
          location: form.location,
          address: form.address,
          notes: form.notes,
          paymentMethod,
          couponCode: coupon?.code ?? "",
          items: cart.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
          })),
        },
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      if (paymentMethod === "whatsapp" && settings["whatsapp"]) {
        window.open(
          whatsappLink(
            settings["whatsapp"],
            orderMessage({
              customerName: form.customerName,
              phone: form.phone,
              location: form.location,
              orderNumber: result.orderNumber,
              items: cart.lines.map((l) => ({
                name: l.name,
                variant: l.variantName,
                quantity: l.quantity,
                total: l.unitPrice * l.quantity,
              })),
              total: result.total,
            }),
          ),
          "_blank",
          "noopener,noreferrer",
        );
      }

      cart.clear();
      void navigate({ to: "/order/$token", params: { token: result.accessToken } });
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.lines.length === 0) {
    return (
      <StoreLayout>
        <div className="container-page py-16 text-center">
          <h1 className="section-title">Checkout</h1>
          <p className="mt-3 text-sm text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-5">
            <Link to="/shop">Browse products</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <form onSubmit={submit} className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <h1 className="section-title">Checkout</h1>

          <section className="card-surface space-y-4 p-5">
            <h2 className="font-display text-lg font-bold">Delivery details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name *</Label>
                <Input
                  id="name"
                  required
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number *</Label>
                <Input
                  id="phone"
                  required
                  inputMode="tel"
                  placeholder="07XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Delivery location *</Label>
                <select
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {UGANDA_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Street / landmark</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Order notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </section>

          <section className="card-surface space-y-3 p-5">
            <h2 className="font-display text-lg font-bold">Payment method</h2>
            {(["cod", "mobile_money", "whatsapp"] as PaymentMethod[]).map((method) => (
              <label
                key={method}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${
                  paymentMethod === method ? "border-primary bg-accent" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                <span className="font-medium">{PAYMENT_METHOD_LABELS[method]}</span>
              </label>
            ))}
            {paymentMethod === "mobile_money" && settings["mobile_money_details"] && (
              <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                {settings["mobile_money_details"]}
              </p>
            )}
          </section>
        </div>

        <aside className="card-surface h-fit space-y-4 p-5">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {cart.lines.map((line) => (
              <li key={`${line.productId}-${line.variantId ?? "base"}`} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {line.name}
                  {line.variantName ? ` (${line.variantName})` : ""} x{line.quantity}
                </span>
                <span className="whitespace-nowrap font-medium">
                  {formatUGX(line.unitPrice * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <Input
              placeholder="Coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              aria-label="Coupon code"
            />
            <Button type="button" variant="secondary" onClick={() => void applyCoupon()}>
              Apply
            </Button>
          </div>

          <div className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatUGX(cart.subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount ({coupon?.code})</span>
                <span>-{formatUGX(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>{deliveryFee > 0 ? formatUGX(deliveryFee) : "Free"}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatUGX(total)}</span>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Placing order..." : "Place order"}
          </Button>
          <p className="text-xs text-muted-foreground">
            We'll call you on {form.phone || "your number"} to confirm delivery.
          </p>
        </aside>
      </form>
    </StoreLayout>
  );
}
