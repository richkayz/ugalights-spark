import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { formatDateTime, formatUGX, ORDER_STATUS_LABELS } from "@/lib/format";
import { listAdminOrders } from "@/lib/admin.functions";

const STATUS_FILTERS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "ready_for_delivery",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

export const Route = createFileRoute("/_authenticated/admin/orders/")({
  head: () => ({
    meta: [
      { title: "Orders | UGALights Admin" },
      { name: "description", content: "Manage UGALights customer orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrders,
});

function AdminOrders() {
  const fetchOrders = useServerFn(listAdminOrders);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", status, q],
    queryFn: () =>
      fetchOrders({
        data: { ...(status !== "all" ? { status } : {}), ...(q ? { q } : {}) },
      }),
  });

  return (
    <AdminLayout title="Orders">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search order, name or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof STATUS_FILTERS)[number])}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All statuses" : (ORDER_STATUS_LABELS[option] ?? option)}
            </option>
          ))}
        </select>
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Loading orders...
                </td>
              </tr>
            )}
            {(data?.orders ?? []).map((order: any) => (
              <tr key={order.id} className="hover:bg-muted/60">
                <td className="px-4 py-3">
                  <Link
                    to="/admin/orders/$id"
                    params={{ id: order.id }}
                    className="font-medium hover:text-primary"
                  >
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {order.customer_name}
                  <span className="block text-xs text-muted-foreground">
                    {order.customer_phone}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{order.delivery_location}</td>
                <td className="px-4 py-3 font-semibold">{formatUGX(order.total)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-primary">
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDateTime(order.created_at)}
                </td>
              </tr>
            ))}
            {!isLoading && (data?.orders ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
