import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import { adjustInventory, listInventory } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory | UGALights Admin" },
      { name: "description", content: "Stock levels and inventory movements for UGALights." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminInventory,
});

function AdminInventory() {
  const fetchInventory = useServerFn(listInventory);
  const adjust = useServerFn(adjustInventory);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    productId: "",
    quantityChange: "10",
    reason: "restock" as "restock" | "adjustment" | "damage" | "return",
    reference: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inventory"],
    queryFn: () => fetchInventory({}),
  });

  const mutation = useMutation({
    mutationFn: () =>
      adjust({
        data: {
          productId: form.productId,
          quantityChange: Number(form.quantityChange),
          reason: form.reason,
          reference: form.reference,
        } as any,
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(`Stock updated to ${result.resulting}`);
        setForm({ ...form, reference: "" });
        void queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const productNames: Record<string, string> = {};
  for (const product of (data?.products ?? []) as any[]) {
    productNames[product.id] = product.name;
  }

  return (
    <AdminLayout title="Inventory">
      <form
        className="card-surface mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_120px_160px_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.productId) {
            toast.error("Pick a product");
            return;
          }
          mutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="adj-product">Product</Label>
          <select
            id="adj-product"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
          >
            <option value="">Select a product</option>
            {((data?.products ?? []) as any[]).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.stock_quantity})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adj-qty">Change</Label>
          <Input
            id="adj-qty"
            value={form.quantityChange}
            onChange={(e) =>
              setForm({ ...form, quantityChange: e.target.value.replace(/[^0-9-]/g, "") })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adj-reason">Reason</Label>
          <select
            id="adj-reason"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value as typeof form.reason })}
          >
            <option value="restock">Restock</option>
            <option value="adjustment">Adjustment</option>
            <option value="damage">Damage / loss</option>
            <option value="return">Customer return</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adj-ref">Reference (optional)</Label>
          <Input
            id="adj-ref"
            placeholder="Supplier invoice, note..."
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          Record
        </Button>
      </form>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading inventory...</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="card-surface overflow-hidden">
            <h2 className="border-b border-border px-4 py-3 font-display text-base font-bold">
              Stock levels
            </h2>
            <ul className="divide-y divide-border text-sm">
              {(data?.products ?? []).map((product: any) => (
                <li key={product.id} className="flex items-center justify-between px-4 py-2">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <span
                    className={
                      product.stock_quantity <= product.low_stock_threshold
                        ? "font-semibold text-sale"
                        : "text-muted-foreground"
                    }
                  >
                    {product.stock_quantity}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card-surface overflow-hidden">
            <h2 className="border-b border-border px-4 py-3 font-display text-base font-bold">
              Recent movements
            </h2>
            <ul className="divide-y divide-border text-sm">
              {(data?.movements ?? []).map((movement: any) => (
                <li key={movement.id} className="px-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {productNames[movement.product_id] ?? "Product"}
                    </span>
                    <span
                      className={
                        movement.quantity_change < 0 ? "text-sale" : "text-success"
                      }
                    >
                      {movement.quantity_change > 0 ? "+" : ""}
                      {movement.quantity_change}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {movement.reason}
                    {movement.reference ? ` - ${movement.reference}` : ""} -{" "}
                    {formatDateTime(movement.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
