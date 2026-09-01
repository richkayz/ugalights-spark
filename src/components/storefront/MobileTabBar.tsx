import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, MessageCircle, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useStoreConfig } from "@/hooks/use-store-config";
import { whatsappLink } from "@/lib/whatsapp";

const TABS = [
  { label: "Home", to: "/", icon: Home, exact: true },
  { label: "Shop", to: "/shop", icon: LayoutGrid, exact: false },
  { label: "Search", to: "/search", icon: Search, exact: false },
] as const;

export function MobileTabBar() {
  const cart = useCart();
  const { settings } = useStoreConfig();
  const number = settings["whatsapp"];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => (
          <li key={tab.to}>
            <Link
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium"
            >
              <tab.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            to="/cart"
            activeProps={{ className: "text-primary" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="relative flex flex-col items-center gap-1 py-2 text-[11px] font-medium"
          >
            <span className="relative">
              <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden="true" />
              {cart.count > 0 && (
                <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {cart.count}
                </span>
              )}
            </span>
            <span>Cart</span>
          </Link>
        </li>
        <li>
          {number ? (
            <a
              href={whatsappLink(number, "Hello UGALights, I need help with a product.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-success"
            >
              <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Chat</span>
            </a>
          ) : null}
        </li>
      </ul>
    </nav>
  );
}
