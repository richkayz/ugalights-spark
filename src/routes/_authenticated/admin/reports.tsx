import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatUGX } from "@/lib/format";
import { getAdminOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports | UGALights Admin" },
      { name: "description", content: "Sales and performance reports for UGALights." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminReports,
});

function AdminReports() {
  const fetchOverview = useServerFn(getAdminOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fetchOverview({}),
  });

  const trend = data?.salesTrend ?? [];
  const max = Math.max(1, ...trend.map((d) => d.revenue));
  const average = trend.length
    ? trend.reduce((sum, d) => sum + d.revenue, 0) / trend.length
    : 0;

  return (
    <AdminLayout title="Reports">
      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading reports...</p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total revenue", value: formatUGX(data.revenue) },
              { label: "Avg. daily revenue (14d)", value: formatUGX(average) },
              { label: "Customers", value: String(data.customerCount) },
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
            <h2 className="font-display text-base font-bold">Daily revenue (last 14 days)</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {trend.map((day) => (
                <li key={day.date} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{day.date}</span>
                  <div className="h-3 flex-1 rounded-full bg-muted">
                    <div
                      className="h-3 rounded-full bg-primary"
                      style={{ width: `${(day.revenue / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-32 shrink-0 text-right text-xs font-medium">
                    {formatUGX(day.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
