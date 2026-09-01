/** Shared SEO helpers: canonical URLs, absolute asset URLs and JSON-LD builders. */

export const SITE_URL = "https://www.ugalights.com";
export const SITE_NAME = "UGALights";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Canonical <link> plus matching og:url meta for a route path. */
export function canonical(path: string) {
  const url = absoluteUrl(path);
  return {
    links: [{ rel: "canonical", href: url }],
    meta: [{ property: "og:url", content: url }],
    url,
  };
}

/** og:image + twitter:image pair, only when we have a usable absolute image. */
export function socialImage(image?: string | null) {
  if (!image) return [];
  const url = absoluteUrl(image);
  if (!/^https:\/\//i.test(url)) return [];
  return [
    { property: "og:image", content: url },
    { name: "twitter:image", content: url },
  ];
}

export function clamp(text: string | null | undefined, fallback: string, max = 158): string {
  const value = (text ?? "").replace(/\s+/g, " ").trim() || fallback;
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

type Settings = Record<string, string>;

/** LocalBusiness + Organization data used site-wide for local/Maps visibility. */
export function localBusinessJsonLd(settings: Settings) {
  const phone = settings["phone"] ?? "";
  const whatsapp = settings["whatsapp"] ?? "";
  return {
    "@context": "https://schema.org",
    "@type": ["Store", "ElectricalContractor", "LocalBusiness"],
    "@id": `${SITE_URL}/#store`,
    name: SITE_NAME,
    alternateName: "UGA Lights Uganda",
    url: SITE_URL,
    image: absoluteUrl("/favicon.png"),
    logo: absoluteUrl("/favicon.png"),
    description:
      "UGALights supplies genuine LED lighting, solar power systems, chandeliers, flood lights and electrical accessories in Uganda, with delivery in Kampala and countrywide.",
    ...(phone ? { telephone: phone } : {}),
    ...(settings["email"] ? { email: settings["email"] } : {}),
    priceRange: "UGX",
    currenciesAccepted: "UGX",
    paymentAccepted: "Cash, Mobile Money, Bank Transfer",
    areaServed: [
      { "@type": "Country", name: "Uganda" },
      { "@type": "City", name: "Kampala" },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: settings["address"] ?? "Energy Center, Shop No. M3-23",
      addressLocality: "Kampala",
      addressCountry: "UG",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:30",
        closes: "18:30",
      },
    ],
    ...(whatsapp
      ? {
          contactPoint: [
            {
              "@type": "ContactPoint",
              contactType: "sales",
              telephone: `+${whatsapp.replace(/\D/g, "")}`,
              availableLanguage: ["en"],
              areaServed: "UG",
            },
          ],
        }
      : {}),
  };
}

/** WebSite entity with the on-site search action. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "en-UG",
    publisher: { "@id": `${SITE_URL}/#store` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(pairs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((pair) => ({
      "@type": "Question",
      name: pair.question,
      acceptedAnswer: { "@type": "Answer", text: pair.answer },
    })),
  };
}

/** Route `head().scripts` entry for a JSON-LD document. */
export function ldScript(data: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}
