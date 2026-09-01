import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { useCart } from "@/lib/cart";
import { formatUGX } from "@/lib/format";
import { NOINDEX } from "@/lib/seo";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart | UGALights Uganda" },
      {
        name: "description",
        content: "Review the lighting and electrical products in your UGALights cart before checkout.",
      },
      { property: "og:title", content: "Your Cart | UGALights" },
      { property: "og:description", content: "Review your UGALights order before checkout." },
      ...NOINDEX,
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();

  return (
    <StoreLayout>
      <div className="container-page py-10">
        <h1 className="section-title mb-6">Your cart</h1>

        {cart.lines.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <Button asChild className="mt-4">
              <Link to="/shop">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-3">
              {cart.lines.map((line) => (
                <div
                  key={`${line.productId}-${line.variantId ?? "base"}`}
                  className="card-surface flex gap-3 p-3"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {line.image && (
                      <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link
                      to="/product/$slug"
                      params={{ slug: line.slug }}
                      className="text-sm font-semibold hover:text-primary"
                    >
                      {line.name}
                    </Link>
                    {line.variantName && (
                      <p className="text-xs text-muted-foreground">{line.variantName}</p>
                    )}
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {formatUGX(line.unitPrice)}
                    </p>
                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <div className="flex items-center rounded-md border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            cart.setQuantity(line.productId, line.variantId, line.quantity - 1)
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm">{line.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Increase quantity"
                          onClick={() =>
                            cart.setQuantity(line.productId, line.variantId, line.quantity + 1)
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove item"
                        onClick={() => cart.removeLine(line.productId, line.variantId)}
                      >
                        <Trash2 className="h-4 w-4 text-sale" />
                      </Button>
                    </div>
                  </div>
                  <p className="hidden self-center font-display font-bold sm:block">
                    {formatUGX(line.unitPrice * line.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <aside className="card-surface h-fit space-y-4 p-5">
              <h2 className="font-display text-lg font-bold">Order summary</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatUGX(cart.subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Delivery fees are calculated at checkout based on your location.
              </p>
              <Button asChild className="w-full" size="lg">
                <Link to="/checkout">Proceed to checkout</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/shop">Continue shopping</Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
