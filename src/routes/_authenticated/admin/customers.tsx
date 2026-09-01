import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatUGX } from "@/lib/format";
import { deleteCustomer, listAdminCustomers, saveCustomer } from "@/lib/admin.functions";

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

type Draft = {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  isActive: boolean;
};

const blank: Draft = { fullName: "", phone: "", email: "", notes: "", isActive: true };

function AdminCustomers() {
  const fetchCustomers = useServerFn(listAdminCustomers);
  const save = useServerFn(saveCustomer);
  const remove = useServerFn(deleteCustomer);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(blank);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => fetchCustomers({}),
  });

  const mutation = useMutation({
    mutationFn: (values: Draft) =>
      save({
        data: {
          ...(values.id ? { id: values.id } : {}),
          fullName: values.fullName,
          phone: values.phone,
          email: values.email || null,
          notes: values.notes,
          isActive: values.isActive,
        } as any,
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Customer saved");
        setDraft(blank);
        void queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const deletion = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Customer deleted");
        void queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const customers = ((data?.customers ?? []) as any[]).filter((c) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      String(c.full_name).toLowerCase().includes(needle) ||
      String(c.phone).toLowerCase().includes(needle) ||
      String(c.email ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <AdminLayout title="Customers">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Input
            placeholder="Search name, phone or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
          <div className="card-surface overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Spent</th>
                  <th className="px-4 py-3">Last order</th>
                  <th className="px-4 py-3" />
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
                {!isLoading && customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No customers found.
                    </td>
                  </tr>
                )}
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/60">
                    <td className="px-4 py-3">
                      <p className="font-medium">{customer.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.phone}
                        {customer.email ? ` · ${customer.email}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">{customer.orders_count}</td>
                    <td className="px-4 py-3">{formatUGX(customer.total_spent)}</td>
                    <td className="px-4 py-3">{formatDate(customer.last_order_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setDraft({
                            id: customer.id,
                            fullName: customer.full_name,
                            phone: customer.phone,
                            email: customer.email ?? "",
                            notes: customer.notes ?? "",
                            isActive: customer.is_active ?? true,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm(`Delete ${customer.full_name}?`))
                            deletion.mutate(customer.id);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form
          className="card-surface h-fit space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(draft);
          }}
        >
          <h2 className="font-display text-base font-bold">
            {draft.id ? "Edit customer" : "Add customer"}
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="cust-name">Full name</Label>
            <Input
              id="cust-name"
              required
              value={draft.fullName}
              onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-phone">Phone</Label>
            <Input
              id="cust-phone"
              required
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-email">Email</Label>
            <Input
              id="cust-email"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-notes">Notes</Label>
            <Textarea
              id="cust-notes"
              rows={3}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>
          <label className="flex items-center justify-between text-sm">
            Active
            <Switch
              checked={draft.isActive}
              onCheckedChange={(checked) => setDraft({ ...draft, isActive: checked })}
              aria-label="Active"
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={mutation.isPending}>
              {draft.id ? "Save changes" : "Add customer"}
            </Button>
            {draft.id && (
              <Button type="button" variant="ghost" onClick={() => setDraft(blank)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
