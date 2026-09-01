import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Truck, Wallet, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/storefront/ProductCard";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { useStoreConfig } from "@/hooks/use-store-config";
import { getHomepage } from "@/lib/storefront.functions";
import type { HomepageSection } from "@/lib/store-types";

export const Route = createFileRoute("/")({
  loader: () => getHomepage(),
  head: () => ({
    meta: [
      { title: "UGALights | Lighting & Electrical Accessories in Uganda" },
      {
        name: "description",
        content:
          "Buy LED bulbs, solar power systems, chandeliers, flood lights, switches, sockets and cables in Uganda. Genuine products, fair prices, fast delivery.",
      },
      { property: "og:title", content: "UGALights | Lighting & Electrical Accessories Uganda" },
      {
        property: "og:description",
        content:
          "Uganda's lighting and electrical accessories store. Shop LED, solar and decorative lighting with countrywide delivery.",
      },
    ],
  }),
  component: HomePage,
});

function str(section: HomepageSection | undefined, key: string): string | undefined {
  const value = section?.content?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

const BENEFITS = [
  { icon: ShieldCheck, title: "Genuine products", text: "Tested lighting and electrical stock." },
  { icon: Truck, title: "Fast delivery", text: "Same-day in Kampala, countrywide shipping." },
  { icon: Wallet, title: "Pay on delivery", text: "Cash, mobile money or bank transfer." },
  { icon: Headphones, title: "Expert advice", text: "Talk to our team on WhatsApp any time." },
];

function HomePage() {
  const data = Route.useLoaderData();
  const { settings } = useStoreConfig();
  const sections = new Map(data.sections.map((s) => [s.section_key, s]));

  const hero = sections.get("hero");
  const promo = sections.get("promo_banner");
  const announcement = sections.get("announcement");

  return (
    <StoreLayout announcement={announcement?.title || settings["announcement"]}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        {str(hero, "image_url") && (
          <img
            src={str(hero, "image_url")}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="relative container-page grid gap-6 py-16 md:py-24 lg:w-3/5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight">
            {hero?.subtitle || "Lighting & electricals, Uganda"}
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
            {hero?.title || "Light up every room with confidence"}
          </h1>
          <p className="max-w-xl text-base text-navy-foreground/85 md:text-lg">
            {str(hero, "body") ||
              "From LED bulbs and chandeliers to solar systems, switches and cables — everything you need, delivered across Uganda."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/shop">
                Shop now <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/contact">Get a quote</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-border bg-card">
        <div className="container-page grid grid-cols-2 gap-4 py-8 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="rounded-lg bg-accent p-2 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {data.featuredCategories.length > 0 && (
        <section className="container-page py-12">
          <h2 className="section-title">Shop by category</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {data.featuredCategories.map((cat) => (
              <Link
                key={cat.id}
                to="/category/$slug"
                params={{ slug: cat.slug }}
                className="group card-surface overflow-hidden"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {cat.image_url && (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="px-3 py-3 text-sm font-semibold">{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {data.featured.length > 0 && (
        <section className="container-page py-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="section-title">Featured products</h2>
            <Link to="/shop" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <ProductGrid products={data.featured} />
        </section>
      )}

      {/* Promo banner */}
      {promo && (
        <section className="container-page py-12">
          <div className="relative overflow-hidden rounded-2xl bg-navy p-8 text-navy-foreground md:p-12">
            {str(promo, "image_url") && (
              <img
                src={str(promo, "image_url")}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-45"
              />
            )}
            <div className="relative max-w-xl space-y-3">
              <h2 className="font-display text-2xl font-bold md:text-4xl">{promo.title}</h2>
              <p className="text-navy-foreground/85">{promo.subtitle}</p>
              <Button asChild variant="secondary">
                <Link to="/shop">{str(promo, "cta_label") || "Explore deals"}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Bestsellers */}
      {data.bestsellers.length > 0 && (
        <section className="container-page py-6">
          <h2 className="section-title mb-6">Bestsellers</h2>
          <ProductGrid products={data.bestsellers} />
        </section>
      )}

      {/* New arrivals */}
      {data.newest.length > 0 && (
        <section className="container-page py-12">
          <h2 className="section-title mb-6">New arrivals</h2>
          <ProductGrid products={data.newest} />
        </section>
      )}
    </StoreLayout>
  );
}
