import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  formatDateTime,
  formatUGX,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/format";
import { getAdminOrder, updateOrderStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order Details | UGALights Admin" },
      { name: "description", content: "View and update a UGALights order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrderDetail,
});

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getAdminOrder);
  const saveStatus = useServerFn(updateOrderStatus);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => fetchOrder({ data: { id } }),
  });

  const mutation = useMutation({
    mutationFn: (patch: { status?: string; paymentStatus?: string }) =>
      saveStatus({ data: { id, ...(patch as any) } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Order updated");
        void queryClient.invalidateQueries({ queryKey: ["admin"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const order = data?.order as any;

  return (
    <AdminLayout title={order ? `Order ${order.order_number}` : "Order"}>
      {isLoading || !order ? (
        <p className="text-sm text-muted-foreground">Loading order...</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="card-surface p-5">
            <h2 className="font-display text-base font-bold">Items</h2>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-border">
                {(data?.items ?? []).map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="py-2">
                      {item.product_name}
                      {item.variant_name ? ` (${item.variant_name})` : ""}
                      <span className="block text-xs text-muted-foreground">{item.sku}</span>
                    </td>
                    <td className="py-2 text-center">x{item.quantity}</td>
                    <td className="py-2 text-right font-medium">{formatUGX(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatUGX(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{formatUGX(order.delivery_fee)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
                  <span>-{formatUGX(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-display text-base font-bold">
                <span>Total</span>
                <span>{formatUGX(order.total)}</span>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="card-surface space-y-3 p-5 text-sm">
              <h2 className="font-display text-base font-bold">Status</h2>
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">Order status</span>
                <select
                  value={order.status}
                  onChange={(e) => mutation.mutate({ status: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">Payment status</span>
                <select
                  value={order.payment_status}
                  onChange={(e) => mutation.mutate({ paymentStatus: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="card-surface space-y-1.5 p-5 text-sm">
              <h2 className="font-display text-base font-bold">Customer</h2>
              <p>{order.customer_name}</p>
              <p className="text-muted-foreground">{order.customer_phone}</p>
              {order.customer_email && (
                <p className="text-muted-foreground">{order.customer_email}</p>
              )}
              <p className="text-muted-foreground">
                {order.delivery_location}
                {order.delivery_address ? ` - ${order.delivery_address}` : ""}
              </p>
              <p className="text-muted-foreground">
                {PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}
              </p>
              <p className="text-xs text-muted-foreground">
                Placed {formatDateTime(order.created_at)}
              </p>
              {order.notes && <p className="rounded-md bg-muted p-2 text-xs">{order.notes}</p>}
            </div>
          </aside>
        </div>
      )}
    </AdminLayout>
  );
}
