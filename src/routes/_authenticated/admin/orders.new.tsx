import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatUGX, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/format";
import { createManualOrder, listProductPicker } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/orders/new")({
  head: () => ({
    meta: [
      { title: "New Manual Order | UGALights Admin" },
      { name: "description", content: "Record a walk-in or phone order for UGALights." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewManualOrder,
});

type Line = { productId: string; quantity: number; unitPrice: number };

function NewManualOrder() {
  const fetchProducts = useServerFn(listProductPicker);
  const create = useServerFn(createManualOrder);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryLocation: "Kampala",
    deliveryAddress: "",
    notes: "",
    paymentMethod: "cash" as "cod" | "mobile_money" | "bank_transfer" | "cash" | "whatsapp",
    paymentStatus: "paid" as "pending" | "paid" | "failed" | "cod",
    status: "confirmed" as keyof typeof ORDER_STATUS_LABELS,
    deliveryFee: 0,
    discount: 0,
  });
  const [lines, setLines] = useState<Line[]>([]);

  const { data } = useQuery({
    queryKey: ["admin", "product-picker"],
    queryFn: () => fetchProducts({}),
  });
  const products = (data?.products ?? []) as {
    id: string;
    name: string;
    sku: string;
    price: number;
    sale_price: number | null;
    stock_quantity: number;
  }[];

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const total = Math.max(0, subtotal + form.deliveryFee - form.discount);

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          ...form,
          items: lines.filter((l) => l.productId),
        } as any,
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(`Order ${result.orderNumber} created`);
        void navigate({ to: "/admin/orders/$id", params: { id: result.id } });
      } else {
        toast.error(result.message);
      }
    },
    onError: () => toast.error("Could not create the order"),
  });

  function addLine() {
    setLines([...lines, { productId: "", quantity: 1, unitPrice: 0 }]);
  }

  function setLine(index: number, patch: Partial<Line>) {
    const next = [...lines];
    next[index] = { ...next[index]!, ...patch };
    setLines(next);
  }

  return (
    <AdminLayout title="New manual order">
      <form
        className="grid gap-6 lg:grid-cols-[1fr_340px]"
        onSubmit={(e) => {
          e.preventDefault();
          if (lines.filter((l) => l.productId).length === 0) {
            toast.error("Add at least one product");
            return;
          }
          mutation.mutate();
        }}
      >
        <div className="space-y-6">
          <section className="card-surface space-y-4 p-4">
            <h2 className="font-display text-base font-bold">Customer</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  required
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Delivery location</Label>
                <Input
                  id="location"
                  required
                  value={form.deliveryLocation}
                  onChange={(e) => setForm({ ...form, deliveryLocation: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Delivery address</Label>
              <Input
                id="address"
                value={form.deliveryAddress}
                onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Internal notes</Label>
              <Textarea
                id="notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </section>

          <section className="card-surface space-y-3 p-4">
            <h2 className="font-display text-base font-bold">Items</h2>
            {lines.map((line, index) => {
              const product = products.find((p) => p.id === line.productId);
              return (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_90px_130px_auto]">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={line.productId}
                    onChange={(e) => {
                      const picked = products.find((p) => p.id === e.target.value);
                      setLine(index, {
                        productId: e.target.value,
                        unitPrice: picked
                          ? Number(picked.sale_price ?? picked.price)
                          : line.unitPrice,
                      });
                    }}
                  >
                    <option value="">Select a product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.stock_quantity} in stock)
                      </option>
                    ))}
                  </select>
                  <Input
                    aria-label="Quantity"
                    inputMode="numeric"
                    value={String(line.quantity)}
                    onChange={(e) =>
                      setLine(index, {
                        quantity: Math.max(1, Number(e.target.value.replace(/[^0-9]/g, "") || 1)),
                      })
                    }
                  />
                  <Input
                    aria-label="Unit price"
                    inputMode="numeric"
                    value={String(line.unitPrice)}
                    onChange={(e) =>
                      setLine(index, { unitPrice: Number(e.target.value.replace(/[^0-9]/g, "") || 0) })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <span className="min-w-[90px] text-sm text-muted-foreground">
                      {formatUGX(line.unitPrice * line.quantity)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Remove item"
                      onClick={() => setLines(lines.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {product && line.quantity > product.stock_quantity && (
                    <p className="text-xs text-sale sm:col-span-4">
                      Only {product.stock_quantity} in stock — stock will be set to 0.
                    </p>
                  )}
                </div>
              );
            })}
            <Button type="button" variant="secondary" size="sm" onClick={addLine}>
              Add item
            </Button>
          </section>
        </div>

        <aside className="card-surface h-fit space-y-4 p-4">
          <h2 className="font-display text-base font-bold">Order summary</h2>
          <div className="space-y-1.5">
            <Label htmlFor="fee">Delivery fee (UGX)</Label>
            <Input
              id="fee"
              inputMode="numeric"
              value={String(form.deliveryFee)}
              onChange={(e) =>
                setForm({ ...form, deliveryFee: Number(e.target.value.replace(/[^0-9]/g, "") || 0) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discount">Discount (UGX)</Label>
            <Input
              id="discount"
              inputMode="numeric"
              value={String(form.discount)}
              onChange={(e) =>
                setForm({ ...form, discount: Number(e.target.value.replace(/[^0-9]/g, "") || 0) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="method">Payment method</Label>
            <select
              id="method"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value as typeof form.paymentMethod })
              }
            >
              <option value="cash">Cash (in shop)</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="cod">Cash on delivery</option>
              <option value="whatsapp">WhatsApp order</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paystatus">Payment status</Label>
            <select
              id="paystatus"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.paymentStatus}
              onChange={(e) =>
                setForm({ ...form, paymentStatus: e.target.value as typeof form.paymentStatus })
              }
            >
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Order status</Label>
            <select
              id="status"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.status as string}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <dl className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatUGX(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{formatUGX(form.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>-{formatUGX(form.discount)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-display font-bold">
              <dt>Total</dt>
              <dd>{formatUGX(total)}</dd>
            </div>
          </dl>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create order"}
          </Button>
        </aside>
      </form>
    </AdminLayout>
  );
}
