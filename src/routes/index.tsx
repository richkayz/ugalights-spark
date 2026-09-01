import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Quote, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/storefront/ProductCard";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { useStoreConfig } from "@/hooks/use-store-config";
import { getHomepage } from "@/lib/storefront.functions";
import { whatsappLink } from "@/lib/whatsapp";
import type { HomepageSection, ProductCardData } from "@/lib/store-types";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function str(section: HomepageSection, key: string): string | undefined {
  const value = section.content?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function items(section: HomepageSection): Record<string, string>[] {
  const value = section.content?.["items"];
  return Array.isArray(value) ? (value as Record<string, string>[]) : [];
}

function HomePage() {
  const data = Route.useLoaderData();
  const { settings, categories } = useStoreConfig();

  const announcement = data.sections.find((s) => s.section_key === "announcement");
  const whatsappNumber = settings["whatsapp"] ?? settings["phone"] ?? "";

  const productSets: Record<string, ProductCardData[]> = {
    featured_products: data.featured,
    bestsellers: data.bestsellers,
    popular_products: data.newest,
  };

  function renderSection(section: HomepageSection) {
    switch (section.section_key) {
      case "announcement":
      case "footer":
        return null;

      case "hero":
        return (
          <section
            key={section.id}
            className="relative overflow-hidden bg-navy text-navy-foreground"
          >
            {str(section, "image_url") && (
              <img
                src={str(section, "image_url")}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
            )}
            <div className="relative container-page grid gap-6 py-16 md:py-24 lg:w-3/5">
              {section.subtitle && (
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight">
                  {section.subtitle}
                </p>
              )}
              <h1 className="font-display text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
                {section.title}
              </h1>
              {str(section, "body") && (
                <p className="max-w-xl text-base text-navy-foreground/85 md:text-lg">
                  {str(section, "body")}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to={(str(section, "primary_button_link") ?? "/shop") as string}>
                    {str(section, "primary_button_text") ?? "Shop now"}{" "}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                {str(section, "secondary_button_text") && (
                  <Button asChild size="lg" variant="secondary">
                    <a
                      href={whatsappLink(whatsappNumber, "Hello UGALights, I need help choosing.")}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {str(section, "secondary_button_text")}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </section>
        );

      case "why_us": {
        const list = items(section);
        if (list.length === 0) return null;
        return (
          <section key={section.id} className="border-b border-border bg-card">
            <div className="container-page py-10">
              {section.title && <h2 className="section-title mb-6">{section.title}</h2>}
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                {list.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="rounded-lg bg-accent p-2 text-primary">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item["title"]}</p>
                      <p className="text-xs text-muted-foreground">{item["text"]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "featured_categories": {
        const cats = categories.filter((c) => !c.parent_id && c.is_featured).slice(0, 8);
        const shown = cats.length > 0 ? cats : categories.filter((c) => !c.parent_id).slice(0, 8);
        if (shown.length === 0) return null;
        return (
          <section key={section.id} className="container-page py-12">
            <h2 className="section-title">{section.title || "Shop by category"}</h2>
            {section.subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{section.subtitle}</p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {shown.map((cat) => (
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
        );
      }

      case "featured_products":
      case "bestsellers":
      case "popular_products": {
        const products = productSets[section.section_key] ?? [];
        if (products.length === 0) return null;
        return (
          <section key={section.id} className="container-page py-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="section-title">{section.title}</h2>
                {section.subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">{section.subtitle}</p>
                )}
              </div>
              <Link to="/shop" className="text-sm font-semibold text-primary hover:underline">
                View all
              </Link>
            </div>
            <ProductGrid products={products} />
          </section>
        );
      }

      case "promo_banner":
        return (
          <section key={section.id} className="container-page py-8">
            <div className="relative overflow-hidden rounded-2xl bg-navy p-8 text-navy-foreground md:p-12">
              {str(section, "image_url") && (
                <img
                  src={str(section, "image_url")}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover opacity-45"
                />
              )}
              <div className="relative max-w-xl space-y-3">
                <h2 className="font-display text-2xl font-bold md:text-4xl">{section.title}</h2>
                {section.subtitle && <p className="text-navy-foreground/85">{section.subtitle}</p>}
                <Button asChild variant="secondary">
                  <Link to={(str(section, "button_link") ?? "/shop") as string}>
                    {str(section, "button_text") ?? "Explore deals"}
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        );

      case "testimonials": {
        const list = items(section);
        if (list.length === 0) return null;
        return (
          <section key={section.id} className="bg-card py-12">
            <div className="container-page">
              <h2 className="section-title mb-6">{section.title}</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {list.map((item, index) => (
                  <figure key={index} className="card-surface space-y-3 p-5">
                    <Quote className="h-5 w-5 text-primary" />
                    <blockquote className="text-sm text-muted-foreground">{item["text"]}</blockquote>
                    <figcaption className="text-sm font-semibold">
                      {item["name"]}
                      {item["location"] ? (
                        <span className="text-muted-foreground"> — {item["location"]}</span>
                      ) : null}
                    </figcaption>
                    <div className="flex gap-0.5 text-highlight">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "whatsapp_cta":
        return (
          <section key={section.id} className="container-page py-12">
            <div className="card-surface flex flex-col items-center gap-3 p-8 text-center">
              <h2 className="font-display text-2xl font-bold">{section.title}</h2>
              {section.subtitle && (
                <p className="max-w-xl text-sm text-muted-foreground">{section.subtitle}</p>
              )}
              <Button asChild size="lg">
                <a
                  href={whatsappLink(whatsappNumber, "Hello UGALights, I need lighting advice.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-1 h-4 w-4" />
                  {str(section, "button_text") ?? "Chat on WhatsApp"}
                </a>
              </Button>
            </div>
          </section>
        );

      case "newsletter":
        return (
          <section key={section.id} className="bg-accent py-12">
            <div className="container-page flex flex-col items-center gap-3 text-center">
              <h2 className="font-display text-2xl font-bold">{section.title}</h2>
              {section.subtitle && (
                <p className="max-w-xl text-sm text-muted-foreground">{section.subtitle}</p>
              )}
              <Button asChild variant="secondary">
                <a
                  href={whatsappLink(whatsappNumber, "Please add me to UGALights offers list.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  {str(section, "button_text") ?? "Subscribe"}
                </a>
              </Button>
            </div>
          </section>
        );

      default:
        if (!section.title) return null;
        return (
          <section key={section.id} className="container-page py-10">
            <h2 className="section-title">{section.title}</h2>
            {section.subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{section.subtitle}</p>
            )}
          </section>
        );
    }
  }

  return (
    <StoreLayout announcement={announcement?.title || settings["announcement"]}>
      {data.sections.map(renderSection)}
    </StoreLayout>
  );
}
