import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStoreConfig } from "@/hooks/use-store-config";
import { useCart } from "@/lib/cart";

const NAV = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export function AnnouncementBar({ text, link }: { text: string; link?: string }) {
  if (!text) return null;
  return (
    <div className="bg-navy px-4 py-2 text-center text-xs font-medium text-navy-foreground md:text-sm">
      {link ? (
        <Link to={link} className="hover:underline">
          {text}
        </Link>
      ) : (
        text
      )}
    </div>
  );
}

export function SiteHeader() {
  const { categories } = useStoreConfig();
  const cart = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState("");

  const topCategories = categories.filter((c) => !c.parent_id).slice(0, 12);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = term.trim();
    if (!q) return;
    setMenuOpen(false);
    void navigate({ to: "/search", search: { q } });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3 md:h-20 md:gap-6">
        <BrandLogo />

        <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="transition-colors hover:text-primary [&.active]:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <div className="group relative">
            <button className="transition-colors hover:text-primary" type="button">
              Categories
            </button>
            <div className="invisible absolute left-0 top-full w-64 rounded-lg border border-border bg-popover p-2 opacity-0 shadow-lift transition-opacity group-hover:visible group-hover:opacity-100">
              {topCategories.map((cat) => (
                <Link
                  key={cat.id}
                  to="/category/$slug"
                  params={{ slug: cat.slug }}
                  className="block rounded-md px-3 py-1.5 text-sm hover:bg-accent"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-sm flex-1 md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search bulbs, panels, cables..."
              aria-label="Search products"
              className="pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex">
            <Link to="/auth" aria-label="Account">
              <User className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/cart" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {cart.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                  {cart.count}
                </span>
              )}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-card lg:hidden">
          <div className="container-page space-y-3 py-4">
            <form onSubmit={submitSearch} className="md:hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                  className="pl-9"
                />
              </div>
            </form>
            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md bg-muted px-3 py-2"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Categories
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {topCategories.map((cat) => (
                <Link
                  key={cat.id}
                  to="/category/$slug"
                  params={{ slug: cat.slug }}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md border border-border px-3 py-2"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
