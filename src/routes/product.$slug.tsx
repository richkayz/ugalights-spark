import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, MessageCircle, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { ProductGrid } from "@/components/storefront/ProductCard";
import { useStoreConfig } from "@/hooks/use-store-config";
import { useCart } from "@/lib/cart";
import { discountPercent, effectivePrice, formatUGX } from "@/lib/format";
import { QuoteRequestForm } from "@/components/storefront/QuoteRequestForm";
import { parseBulkTiers, pricingMode, tierRangeLabel } from "@/lib/pricing";
import { getProductPage } from "@/lib/storefront.functions";
import { productEnquiryMessage, whatsappLink } from "@/lib/whatsapp";
import {
  breadcrumbJsonLd,
  canonicalLink,
  canonicalMeta,
  clamp,
  SITE_URL,
  socialImage,
} from "@/lib/seo";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const result = await getProductPage({ data: { slug: params.slug } });
    if (!result.product) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) return {};
    const description = clamp(
      product.seo_description || product.short_description,
      `Buy ${product.name} in Uganda from UGALights. Genuine quality, UGX pricing, delivery in Kampala and countrywide.`,
    );
    const base = (product.seo_title || product.name).replace(/\s*[|\-–]\s*UGALights.*$/i, "").trim();
    const shortName = base.length > 44 ? `${base.slice(0, 43).trimEnd()}…` : base;
    const title = `${shortName} | Price in Uganda | UGALights`;
    const path = `/product/${product.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:site_name", content: "UGALights" },
        { name: "twitter:card", content: "summary_large_image" },
        ...socialImage(product.main_image_url),
        ...canonicalMeta(path),
      ],
      links: canonicalLink(path),
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product, images, variants, specs, category, related } = Route.useLoaderData();
  const { settings } = useStoreConfig();
  const cart = useCart();
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product!.main_image_url ?? images[0]?.url ?? null);
  const [showQuote, setShowQuote] = useState(false);
  const navigate = useNavigate();

  const mode = pricingMode((product as any)!.pricing_mode);
  const tiers = useMemo(() => parseBulkTiers((product as any)!.bulk_tiers), [product]);
  const pageUrl = `https://www.ugalights.com/product/${product!.slug}`;

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const basePrice = Number(variant?.price ?? product!.price);
  const salePrice = variant
    ? variant.sale_price != null
      ? Number(variant.sale_price)
      : null
    : product!.sale_price != null
      ? Number(product!.sale_price)
      : null;
  const price = effectivePrice(basePrice, salePrice);
  const off = discountPercent(basePrice, salePrice);
  const stock = variant ? variant.stock_quantity : product!.stock_quantity;
  const outOfStock = stock <= 0;

  const gallery = useMemo(() => {
    const urls = [product!.main_image_url, ...images.map((i) => i.url)].filter(
      (u): u is string => Boolean(u),
    );
    return Array.from(new Set(urls));
  }, [product, images]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product!.name,
    description: product!.short_description || product!.name,
    sku: product!.sku,
    category: category?.name,
    url: pageUrl,
    image: gallery.map((url) => (url.startsWith("http") ? url : `${SITE_URL}${url}`)),
    ...(mode === "quote_only"
      ? {}
      : {
          offers: {
            "@type": "Offer",
            price: String(price),
            priceCurrency: "UGX",
            url: pageUrl,
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: "UGALights" },
            availability: outOfStock
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          },
        }),
  };

  function addToCart() {
    cart.addLine({
      productId: product!.id,
      variantId: variant?.id ?? null,
      name: product!.name,
      variantName: variant?.name ?? null,
      slug: product!.slug,
      sku: variant?.sku || product!.sku,
      unitPrice: price,
      image: activeImage,
      quantity,
    });
    toast.success("Added to cart", { description: `${product!.name} x${quantity}` });
  }

  return (
    <StoreLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/shop" },
              ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
              { name: product!.name, path: `/product/${product!.slug}` },
            ]),
          ),
        }}
      />
      <div className="container-page py-8">
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-primary">
            Shop
          </Link>
          {category && (
            <>
              <span>/</span>
              <Link
                to="/category/$slug"
                params={{ slug: category.slug }}
                className="hover:text-primary"
              >
                {category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{product!.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="card-surface aspect-square overflow-hidden bg-muted">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product!.name}
                  className="h-full w-full object-cover"
                  width={1000}
                  height={1000}
                />
              ) : null}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {gallery.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(url)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 ${activeImage === url ? "border-primary" : "border-border"}`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <h1 className="font-display text-2xl font-bold md:text-3xl">{product!.name}</h1>
              {product!.short_description && (
                <p className="mt-2 text-sm text-muted-foreground">{product!.short_description}</p>
              )}
            </div>

            {mode === "quote_only" ? (
              <div className="rounded-lg border border-primary/30 bg-accent p-4">
                <p className="font-display text-xl font-bold text-primary">Price on request</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Contact us for the latest price.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-display text-3xl font-extrabold text-primary">
                  {formatUGX(price)}
                </span>
                {off != null && (
                  <>
                    <span className="text-base text-muted-foreground line-through">
                      {formatUGX(basePrice)}
                    </span>
                    <span className="rounded-md bg-sale px-2 py-0.5 text-xs font-semibold text-sale-foreground">
                      Save {off}%
                    </span>
                  </>
                )}
              </div>
            )}

            {mode !== "quote_only" && (
              <p className={`text-sm font-medium ${outOfStock ? "text-sale" : "text-success"}`}>
                {outOfStock ? "Out of stock" : `In stock (${stock} available)`}
              </p>
            )}

            {variants.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Options</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        variantId === v.id
                          ? "border-primary bg-accent font-semibold text-primary"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-md border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {mode === "quote_only" ? (
                <Button size="lg" onClick={() => setShowQuote(true)}>
                  <FileText className="mr-1 h-4 w-4" /> Get a quote
                </Button>
              ) : (
                <>
                  <Button size="lg" disabled={outOfStock} onClick={addToCart}>
                    Add to cart
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    disabled={outOfStock}
                    onClick={() => {
                      addToCart();
                      void navigate({ to: "/checkout" });
                    }}
                  >
                    Buy now
                  </Button>
                </>
              )}
              {settings["whatsapp"] && (
                <Button asChild size="lg" variant="secondary">
                  <a
                    href={whatsappLink(
                      settings["whatsapp"],
                      productEnquiryMessage({
                        productName: product!.name,
                        url: pageUrl,
                        variant: variant?.name ?? null,
                        quantity,
                      }),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-1 h-4 w-4" />{" "}
                    {mode === "quote_only" ? "Ask on WhatsApp" : "Order on WhatsApp"}
                  </a>
                </Button>
              )}
            </div>

            {mode === "show_price_bulk" && (
              <div className="rounded-lg border border-border bg-muted/60 p-4">
                <p className="font-display text-sm font-bold">
                  Need a larger quantity? Request bulk price
                </p>
                {tiers.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {tiers.map((tier, i) => (
                      <li key={i} className="flex flex-wrap justify-between gap-2">
                        <span>{tierRangeLabel(tier)}</span>
                        <span className="font-medium text-foreground">
                          {tier.price != null ? formatUGX(tier.price) : tier.note || "Contact for quotation"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {!showQuote && (
                  <Button className="mt-3" variant="secondary" onClick={() => setShowQuote(true)}>
                    <FileText className="mr-2 h-4 w-4" /> Request bulk price
                  </Button>
                )}
              </div>
            )}

            {(showQuote || mode === "quote_only") && (
              <QuoteRequestForm
                context={{
                  productId: product!.id,
                  productName: product!.name,
                  variantId: variant?.id ?? null,
                  variantName: variant?.name ?? null,
                  quantity,
                  kind: mode === "quote_only" ? "quote" : "bulk",
                  whatsapp: settings["whatsapp"],
                  pageUrl,
                }}
              />
            )}


            <div className="grid gap-2 rounded-lg bg-muted p-4 text-sm">
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" /> Delivery in Kampala &amp; countrywide
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Genuine, quality-checked products
              </p>
            </div>

            {specs.length > 0 && (
              <div>
                <h2 className="mb-2 font-display text-lg font-bold">Specifications</h2>
                <dl className="divide-y divide-border rounded-lg border border-border text-sm">
                  {specs.map((spec) => (
                    <div key={spec.label} className="flex justify-between gap-4 px-4 py-2">
                      <dt className="text-muted-foreground">{spec.label}</dt>
                      <dd className="font-medium">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {product!.description && (
          <section className="mt-12 max-w-3xl">
            <h2 className="section-title mb-3">Description</h2>
            <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product!.description}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title mb-6">Related products</h2>
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </StoreLayout>
  );
}
