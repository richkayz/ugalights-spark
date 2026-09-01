import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatUGX } from "@/lib/format";
import {
  convertQuoteToOrder,
  deleteQuoteRequest,
  listQuoteRequests,
  updateQuoteRequest,
} from "@/lib/admin.functions";
import { whatsappLink } from "@/lib/whatsapp";

const STATUSES = ["new", "contacted", "quoted", "accepted", "rejected", "closed"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_CLASS: Record<Status, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-highlight/20 text-highlight-foreground",
  quoted: "bg-accent text-primary",
  accepted: "bg-success/15 text-success",
  rejected: "bg-sale/15 text-sale",
  closed: "bg-muted text-muted-foreground",
};

export const Route = createFileRoute("/_authenticated/admin/quotes")({
  head: () => ({
    meta: [
      { title: "Quote Requests | UGALights Admin" },
      { name: "description", content: "Manage UGALights quotation and bulk price requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminQuotes,
});

type QuoteRow = {
  id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  location: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  message: string;
  kind: string;
  status: Status;
  quoted_price: number | null;
  staff_notes: string;
  order_id: string | null;
  created_at: string;
};

function AdminQuotes() {
  const fetchQuotes = useServerFn(listQuoteRequests);
  const update = useServerFn(updateQuoteRequest);
  const remove = useServerFn(deleteQuoteRequest);
  const convert = useServerFn(convertQuoteToOrder);
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<Status | "all">("all");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("0");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "quotes", status, q],
    queryFn: () =>
      fetchQuotes({ data: { ...(status !== "all" ? { status } : {}), ...(q ? { q } : {}) } }),
  });

  const requests = (data?.requests ?? []) as QuoteRow[];
  const selected = requests.find((r) => r.id === selectedId) ?? null;

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["admin", "quotes"] });
  }

  function pick(row: QuoteRow) {
    setSelectedId(row.id);
    setPrice(row.quoted_price == null ? "" : String(row.quoted_price));
    setNotes(row.staff_notes ?? "");
    setDeliveryFee("0");
  }

  const saveMutation = useMutation({
    mutationFn: (input: { id: string; status?: Status; quotedPrice?: number | null; staffNotes?: string }) =>
      update({ data: input }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Quote updated");
        refresh();
      } else toast.error(result.message);
    },
  });

  const convertMutation = useMutation({
    mutationFn: (input: { id: string; unitPrice: number; deliveryFee: number }) =>
      convert({ data: { ...input, paymentMethod: "cod" } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(`Order ${result.orderNumber} created`);
        refresh();
      } else toast.error(result.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Quote request deleted");
      setSelectedId(null);
      refresh();
    },
  });

  return (
    <AdminLayout title="Quote requests">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search name, phone, product or reference"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-1">
          {(["all", ...STATUSES] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value as Status | "all")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                status === value ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
              }`}
            >
              {value}
              {value !== "all" && data?.counts?.[value] ? ` (${data.counts[value]})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Product</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Location</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={6}>
                    Loading quote requests...
                  </td>
                </tr>
              )}
              {!isLoading && requests.length === 0 && (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={6}>
                    No quote requests yet.
                  </td>
                </tr>
              )}
              {requests.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => pick(row)}
                  className={`cursor-pointer border-t border-border hover:bg-accent/50 ${
                    selectedId === row.id ? "bg-accent" : ""
                  }`}
                >
                  <td className="p-3">
                    <p className="font-medium">{row.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{row.customer_phone}</p>
                  </td>
                  <td className="p-3">
                    <p>{row.product_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.variant_name ? `${row.variant_name} · ` : ""}
                      {row.kind === "bulk" ? "Bulk price" : "Quotation"}
                    </p>
                  </td>
                  <td className="p-3">{row.quantity}</td>
                  <td className="p-3">{row.location || "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{formatDateTime(row.created_at)}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_CLASS[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-surface space-y-4 p-4">
          {!selected ? (
            <p className="text-sm text-muted-foreground">
              Select a quote request to reply, quote a price or convert it to an order.
            </p>
          ) : (
            <>
              <div>
                <p className="font-display text-base font-bold">{selected.reference}</p>
                <p className="text-sm">{selected.customer_name}</p>
                <p className="text-sm text-muted-foreground">{selected.customer_phone}</p>
                {selected.customer_email && (
                  <p className="text-sm text-muted-foreground">{selected.customer_email}</p>
                )}
                <p className="mt-2 text-sm">
                  <span className="font-medium">{selected.product_name || "—"}</span>
                  {selected.variant_name ? ` (${selected.variant_name})` : ""} × {selected.quantity}
                </p>
                <p className="text-sm text-muted-foreground">Location: {selected.location || "—"}</p>
                {selected.message && (
                  <p className="mt-2 rounded-md bg-muted p-2 text-sm">{selected.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-status">Status</Label>
                <select
                  id="quote-status"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize"
                  value={selected.status}
                  onChange={(e) =>
                    saveMutation.mutate({ id: selected.id, status: e.target.value as Status })
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-price">Quoted unit price (UGX)</Label>
                <Input
                  id="quote-price"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-notes">Internal notes</Label>
                <Textarea
                  id="quote-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    saveMutation.mutate({
                      id: selected.id,
                      quotedPrice: price ? Number(price) : null,
                      staffNotes: notes,
                      ...(selected.status === "new" && price ? { status: "quoted" as Status } : {}),
                    })
                  }
                  disabled={saveMutation.isPending}
                >
                  Save quote
                </Button>
                <Button variant="secondary" asChild>
                  <a
                    href={whatsappLink(
                      selected.customer_phone,
                      `Hello ${selected.customer_name}, thank you for your enquiry about ${selected.product_name} (${selected.quantity} unit(s)).${
                        price ? ` Our price is UGX ${Number(price).toLocaleString("en-UG")} per unit.` : ""
                      }`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp customer
                  </a>
                </Button>
              </div>

              {selected.order_id ? (
                <p className="text-sm text-success">
                  Converted to an order.{" "}
                  <Link
                    to="/admin/orders/$id"
                    params={{ id: selected.order_id }}
                    className="underline"
                  >
                    View order
                  </Link>
                </p>
              ) : (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold">Convert to order</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="quote-delivery">Delivery fee (UGX)</Label>
                    <Input
                      id="quote-delivery"
                      inputMode="numeric"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value.replace(/[^0-9]/g, ""))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total:{" "}
                    {formatUGX(
                      (Number(price) || 0) * selected.quantity + (Number(deliveryFee) || 0),
                    )}
                  </p>
                  <Button
                    className="w-full"
                    disabled={!price || convertMutation.isPending}
                    onClick={() =>
                      convertMutation.mutate({
                        id: selected.id,
                        unitPrice: Number(price),
                        deliveryFee: Number(deliveryFee) || 0,
                      })
                    }
                  >
                    Convert to order
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                className="w-full text-sale"
                onClick={() => {
                  if (window.confirm("Delete this quote request?")) deleteMutation.mutate(selected.id);
                }}
              >
                Delete request
              </Button>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
