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
import { formatDate, formatUGX } from "@/lib/format";
import { deleteCoupon, listAdminCoupons, saveCoupon } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  head: () => ({
    meta: [
      { title: "Coupons | UGALights Admin" },
      { name: "description", content: "Create and manage UGALights discount coupons." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCoupons,
});

type Draft = {
  id?: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  usageLimit: string;
  endsAt: string;
  isActive: boolean;
};

const blank: Draft = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: 10,
  minOrderValue: 0,
  usageLimit: "",
  endsAt: "",
  isActive: true,
};

function AdminCoupons() {
  const fetchCoupons = useServerFn(listAdminCoupons);
  const save = useServerFn(saveCoupon);
  const remove = useServerFn(deleteCoupon);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(blank);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => fetchCoupons({}),
  });

  const mutation = useMutation({
    mutationFn: (values: Draft) =>
      save({
        data: {
          ...(values.id ? { id: values.id } : {}),
          code: values.code,
          description: values.description,
          discountType: values.discountType,
          discountValue: values.discountValue,
          minOrderValue: values.minOrderValue,
          usageLimit: values.usageLimit ? Number(values.usageLimit) : null,
          endsAt: values.endsAt || null,
          isActive: values.isActive,
        } as any,
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Coupon saved");
        setDraft(blank);
        void queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const deletion = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Coupon deleted");
        void queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  return (
    <AdminLayout title="Coupons">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min order</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    Loading coupons...
                  </td>
                </tr>
              )}
              {(data?.coupons ?? []).length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    No coupons yet.
                  </td>
                </tr>
              )}
              {((data?.coupons ?? []) as any[]).map((coupon) => (
                <tr key={coupon.id} className="hover:bg-muted/60">
                  <td className="px-4 py-3 font-semibold">{coupon.code}</td>
                  <td className="px-4 py-3">
                    {coupon.discount_type === "percentage"
                      ? `${Number(coupon.discount_value)}%`
                      : formatUGX(coupon.discount_value)}
                  </td>
                  <td className="px-4 py-3">{formatUGX(coupon.min_order_value)}</td>
                  <td className="px-4 py-3">
                    {coupon.used_count}
                    {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                  </td>
                  <td className="px-4 py-3">{coupon.ends_at ? formatDate(coupon.ends_at) : "-"}</td>
                  <td className="px-4 py-3">{coupon.is_active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setDraft({
                          id: coupon.id,
                          code: coupon.code,
                          description: coupon.description ?? "",
                          discountType: coupon.discount_type,
                          discountValue: Number(coupon.discount_value),
                          minOrderValue: Number(coupon.min_order_value),
                          usageLimit: coupon.usage_limit ? String(coupon.usage_limit) : "",
                          endsAt: coupon.ends_at ? coupon.ends_at.slice(0, 10) : "",
                          isActive: coupon.is_active,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Delete coupon ${coupon.code}?`)) deletion.mutate(coupon.id);
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

        <form
          className="card-surface h-fit space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(draft);
          }}
        >
          <h2 className="font-display text-base font-bold">{draft.id ? "Edit coupon" : "New coupon"}</h2>
          <div className="space-y-1.5">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              required
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Discount type</Label>
            <select
              id="type"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.discountType}
              onChange={(e) =>
                setDraft({ ...draft, discountType: e.target.value as Draft["discountType"] })
              }
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed amount (UGX)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="value">Discount value</Label>
            <Input
              id="value"
              inputMode="numeric"
              value={String(draft.discountValue)}
              onChange={(e) =>
                setDraft({ ...draft, discountValue: Number(e.target.value.replace(/[^0-9.]/g, "") || 0) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="min">Minimum order value (UGX)</Label>
            <Input
              id="min"
              inputMode="numeric"
              value={String(draft.minOrderValue)}
              onChange={(e) =>
                setDraft({ ...draft, minOrderValue: Number(e.target.value.replace(/[^0-9]/g, "") || 0) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="limit">Usage limit (blank = unlimited)</Label>
            <Input
              id="limit"
              inputMode="numeric"
              value={draft.usageLimit}
              onChange={(e) => setDraft({ ...draft, usageLimit: e.target.value.replace(/[^0-9]/g, "") })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ends">Expiry date</Label>
            <Input
              id="ends"
              type="date"
              value={draft.endsAt}
              onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
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
              {draft.id ? "Save changes" : "Create coupon"}
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
