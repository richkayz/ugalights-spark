import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatDate, formatUGX } from "@/lib/format";
import { listAdminCustomers } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({
    meta: [
      { title: "Customers | UGALights Admin" },
      { name: "description", content: "UGALights customer directory and order history." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const fetchCustomers = useServerFn(listAdminCustomers);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => fetchCustomers({}),
  });

  return (
    <AdminLayout title="Customers">
      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total spent</th>
              <th className="px-4 py-3">Last order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Loading customers...
                </td>
              </tr>
            )}
            {(data?.customers ?? []).map((customer: any) => (
              <tr key={customer.id} className="hover:bg-muted/60">
                <td className="px-4 py-3">
                  <p className="font-medium">{customer.full_name}</p>
                  {customer.email && (
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{customer.phone}</td>
                <td className="px-4 py-3">{customer.orders_count}</td>
                <td className="px-4 py-3 font-semibold">{formatUGX(customer.total_spent)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(customer.last_order_at)}
                </td>
              </tr>
            ))}
            {!isLoading && (data?.customers ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
