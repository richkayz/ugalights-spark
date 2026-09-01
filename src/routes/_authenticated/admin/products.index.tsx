import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatUGX } from "@/lib/format";
import { listAdminProducts, setProductFlags } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/products/")({
  head: () => ({
    meta: [
      { title: "Products | UGALights Admin" },
      { name: "description", content: "Manage the UGALights product catalogue." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminProducts,
});

function AdminProducts() {
  const fetchProducts = useServerFn(listAdminProducts);
  const saveFlags = useServerFn(setProductFlags);
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [stockDraft, setStockDraft] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", q],
    queryFn: () => fetchProducts({ data: q ? { q } : {} }),
  });

  const mutation = useMutation({
    mutationFn: (input: {
      id: string;
      isPublished?: boolean;
      isFeatured?: boolean;
      stockQuantity?: number;
    }) => saveFlags({ data: input as any }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Product updated");
        void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  return (
    <AdminLayout
      title="Products"
      actions={
        <Button asChild>
          <Link to="/admin/products/new">New product</Link>
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by name or SKU"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          {(data?.products ?? []).length} products loaded
        </p>
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Loading products...
                </td>
              </tr>
            )}
            {(data?.products ?? []).map((product: any) => (
              <tr key={product.id} className="hover:bg-muted/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                      {product.main_image_url && (
                        <img
                          src={product.main_image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {formatUGX(product.sale_price ?? product.price)}
                  {product.sale_price && (
                    <span className="block text-xs text-muted-foreground line-through">
                      {formatUGX(product.price)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-9 w-20"
                      inputMode="numeric"
                      value={stockDraft[product.id] ?? String(product.stock_quantity)}
                      onChange={(e) =>
                        setStockDraft({
                          ...stockDraft,
                          [product.id]: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        mutation.mutate({
                          id: product.id,
                          stockQuantity: Number(stockDraft[product.id] ?? product.stock_quantity),
                        })
                      }
                    >
                      Save
                    </Button>
                  </div>
                  {product.stock_quantity <= product.low_stock_threshold && (
                    <span className="text-xs font-medium text-sale">Low stock</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={product.is_published}
                    onCheckedChange={(checked) =>
                      mutation.mutate({ id: product.id, isPublished: checked })
                    }
                    aria-label="Published"
                  />
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={product.is_featured}
                    onCheckedChange={(checked) =>
                      mutation.mutate({ id: product.id, isFeatured: checked })
                    }
                    aria-label="Featured"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link to="/admin/products/$id" params={{ id: product.id }}>
                        Edit
                      </Link>
                    </Button>
                    <Link
                      to="/product/$slug"
                      params={{ slug: product.slug }}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
