import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatDateTime } from "@/lib/format";
import { listInventory } from "@/lib/admin.functions";

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
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inventory"],
    queryFn: () => fetchInventory({}),
  });

  const productNames: Record<string, string> = {};
  for (const product of (data?.products ?? []) as any[]) {
    productNames[product.id] = product.name;
  }

  return (
    <AdminLayout title="Inventory">
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
                      {productNames.get(movement.product_id) ?? "Product"}
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
