import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

type Entry = { loc: string; changefreq: string; priority: string; lastmod?: string };

const STATIC_PAGES: Entry[] = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/shop", changefreq: "daily", priority: "0.9" },
  { loc: "/about", changefreq: "monthly", priority: "0.6" },
  { loc: "/contact", changefreq: "monthly", priority: "0.7" },
  { loc: "/delivery", changefreq: "monthly", priority: "0.6" },
  { loc: "/faq", changefreq: "monthly", priority: "0.6" },
  { loc: "/privacy", changefreq: "yearly", priority: "0.3" },
  { loc: "/terms", changefreq: "yearly", priority: "0.3" },
];

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlTag(entry: Entry): string {
  return [
    "  <url>",
    `    <loc>${xmlEscape(`${SITE_URL}${entry.loc}`)}</loc>`,
    entry.lastmod ? `    <lastmod>${entry.lastmod.slice(0, 10)}</lastmod>` : "",
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: Entry[] = [...STATIC_PAGES];

        try {
          const { publicClient } = await import("@/lib/supabase.server");
          const supabase = publicClient();

          const [categories, products] = await Promise.all([
            supabase.from("categories").select("slug, updated_at").eq("is_active", true),
            supabase
              .from("products")
              .select("slug, updated_at")
              .eq("status", "published")
              .order("updated_at", { ascending: false })
              .limit(2000),
          ]);

          for (const category of categories.data ?? []) {
            entries.push({
              loc: `/category/${category.slug}`,
              changefreq: "weekly",
              priority: "0.8",
              lastmod: (category as { updated_at?: string }).updated_at,
            });
          }
          for (const product of products.data ?? []) {
            entries.push({
              loc: `/product/${product.slug}`,
              changefreq: "weekly",
              priority: "0.7",
              lastmod: (product as { updated_at?: string }).updated_at,
            });
          }
        } catch (error) {
          console.error("sitemap: failed to load catalogue", error);
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(urlTag).join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
