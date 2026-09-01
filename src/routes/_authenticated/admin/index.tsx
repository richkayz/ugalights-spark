import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatDateTime, formatUGX, ORDER_STATUS_LABELS } from "@/lib/format";
import { getAdminOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard | UGALights Admin" },
      { name: "description", content: "UGALights admin dashboard overview." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const fetchOverview = useServerFn(getAdminOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fetchOverview({}),
  });

  const maxRevenue = Math.max(1, ...(data?.salesTrend ?? []).map((d) => d.revenue));

  return (
    <AdminLayout title="Dashboard">
      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Revenue", value: formatUGX(data.revenue) },
              { label: "Orders", value: String(data.orderCount) },
              { label: "Pending orders", value: String(data.pendingCount) },
              { label: "Products", value: String(data.productCount) },
            ].map((stat) => (
              <div key={stat.label} className="card-surface p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 font-display text-xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <section className="card-surface p-5">
            <h2 className="font-display text-base font-bold">Revenue, last 14 days</h2>
            <div className="mt-4 flex h-40 items-end gap-1.5">
              {data.salesTrend.map((day) => (
                <div key={day.date} className="flex-1" title={`${day.date}: ${formatUGX(day.revenue)}`}>
                  <div
                    className="rounded-t bg-primary/80"
                    style={{ height: `${Math.max(2, (day.revenue / maxRevenue) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card-surface p-5">
              <h2 className="font-display text-base font-bold">Recent orders</h2>
              <ul className="mt-3 divide-y divide-border text-sm">
                {data.recentOrders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <Link
                        to="/admin/orders/$id"
                        params={{ id: order.id }}
                        className="font-medium hover:text-primary"
                      >
                        {order.order_number}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {order.customer_name} - {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatUGX(order.total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card-surface p-5">
              <h2 className="font-display text-base font-bold">Low stock</h2>
              <ul className="mt-3 divide-y divide-border text-sm">
                {data.lowStock.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2">
                    <span>{item.name}</span>
                    <span
                      className={
                        item.stock_quantity <= item.low_stock_threshold
                          ? "font-semibold text-sale"
                          : "text-muted-foreground"
                      }
                    >
                      {item.stock_quantity} left
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
