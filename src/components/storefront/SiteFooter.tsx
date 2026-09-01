import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, MapPin, MessageCircle } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { useStoreConfig } from "@/hooks/use-store-config";

const PAGES = [
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "FAQ", to: "/faq" },
  { label: "Delivery", to: "/delivery" },
  { label: "Terms", to: "/terms" },
  { label: "Privacy", to: "/privacy" },
];

export function SiteFooter() {
  const { settings, categories, footer } = useStoreConfig();
  const fc = (footer?.content ?? {}) as Record<string, string>;
  const topCategories = categories.filter((c) => !c.parent_id).slice(0, 6);

  return (
    <footer className="mt-16 bg-navy text-navy-foreground">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="space-y-4">
          <div className="inline-flex rounded-lg bg-card p-2">
            <BrandLogo className="h-8 w-auto" />
          </div>
          <p className="text-sm text-navy-foreground/80">
            {fc["about_text"] ||
              settings["footer_text"] ||
              "UGALights supplies quality lighting and electrical accessories across Uganda."}
          </p>
          <div className="flex gap-3">
            {settings["facebook"] && (
              <a
                href={settings["facebook"]}
                aria-label="Facebook"
                className="rounded-md bg-navy-foreground/10 p-2 transition-colors hover:bg-navy-foreground/20"
              >
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {settings["instagram"] && (
              <a
                href={settings["instagram"]}
                aria-label="Instagram"
                className="rounded-md bg-navy-foreground/10 p-2 transition-colors hover:bg-navy-foreground/20"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-highlight">
            {fc["shop_heading"] || "Shop"}
          </h3>
          <ul className="space-y-2 text-sm text-navy-foreground/80">
            <li>
              <Link to="/shop" className="hover:text-navy-foreground">
                All products
              </Link>
            </li>
            {topCategories.map((cat) => (
              <li key={cat.id}>
                <Link
                  to="/category/$slug"
                  params={{ slug: cat.slug }}
                  className="hover:text-navy-foreground"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-highlight">
            {fc["info_heading"] || "Information"}
          </h3>
          <ul className="space-y-2 text-sm text-navy-foreground/80">
            {PAGES.map((page) => (
              <li key={page.to}>
                <Link to={page.to} className="hover:text-navy-foreground">
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-highlight">
            {fc["contact_heading"] || "Get in touch"}
          </h3>
          <ul className="space-y-3 text-sm text-navy-foreground/80">
            {settings["phone"] && (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <a href={`tel:${settings["phone"]}`}>{settings["phone"]}</a>
              </li>
            )}
            {settings["email"] && (
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <a href={`mailto:${settings["email"]}`}>{settings["email"]}</a>
              </li>
            )}
            {settings["address"] && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{settings["address"]}</span>
              </li>
            )}
            {settings["opening_hours"] && <li>{settings["opening_hours"]}</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-foreground/15 py-5">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-navy-foreground/70 md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {settings["business_name"] ?? "UGALights"}. All rights
            reserved.
          </p>
          <p>{fc["bottom_note"] || "Prices in Ugandan Shillings (UGX)"}</p>
        </div>
      </div>
    </footer>
  );
}
