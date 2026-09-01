import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { useStoreConfig } from "@/hooks/use-store-config";
import {
  formatDateTime,
  formatUGX,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/format";
import { getOrderByToken } from "@/lib/orders.functions";
import { whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/order/$token")({
  loader: async ({ params }) => {
    const result = await getOrderByToken({ data: { token: params.token } });
    if (!result.order) throw notFound();
    return result;
  },
  head: () => ({
    meta: [
      { title: "Order Confirmation | UGALights Uganda" },
      { name: "description", content: "Track the status of your UGALights order." },
      { property: "og:title", content: "Order Confirmation | UGALights" },
      { property: "og:description", content: "Your UGALights order details and status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { order, items } = Route.useLoaderData();
  const { settings } = useStoreConfig();
  if (!order) return null;

  return (
    <StoreLayout>
      <div className="container-page max-w-3xl py-10">
        <div className="card-surface p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-3 font-display text-2xl font-bold">Thank you for your order!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Order <span className="font-semibold text-foreground">{order.order_number}</span> placed{" "}
            {formatDateTime(order.created_at)}
          </p>
          <p className="mt-3 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </p>
        </div>

        <div className="card-surface mt-5 p-5">
          <h2 className="font-display text-lg font-bold">Items</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {items.map((item, index) => (
              <li key={index} className="flex justify-between gap-3 py-2">
                <span className="text-muted-foreground">
                  {item.product_name}
                  {item.variant_name ? ` (${item.variant_name})` : ""} x{item.quantity}
                </span>
                <span className="font-medium">{formatUGX(item.line_total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatUGX(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
                <span>-{formatUGX(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>
                {Number(order.delivery_fee) > 0 ? formatUGX(order.delivery_fee) : "Free"}
              </span>
            </div>
            <div className="flex justify-between font-display text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatUGX(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="card-surface mt-5 space-y-1.5 p-5 text-sm">
          <h2 className="font-display text-lg font-bold">Delivery</h2>
          <p>{order.customer_name}</p>
          <p className="text-muted-foreground">{order.customer_phone}</p>
          <p className="text-muted-foreground">
            {order.delivery_location}
            {order.delivery_address ? ` - ${order.delivery_address}` : ""}
          </p>
          <p className="text-muted-foreground">
            Payment: {PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {settings["whatsapp"] && (
            <Button asChild variant="secondary">
              <a
                href={whatsappLink(
                  settings["whatsapp"],
                  `Hello UGALights, I would like to follow up on order ${order.order_number}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-1 h-4 w-4" /> Chat about this order
              </a>
            </Button>
          )}
          <Button asChild>
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </StoreLayout>
  );
}
