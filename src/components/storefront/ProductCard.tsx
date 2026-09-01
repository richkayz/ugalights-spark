import { Link } from "@tanstack/react-router";
import { discountPercent, effectivePrice, formatUGX } from "@/lib/format";
import type { ProductCardData } from "@/lib/store-types";

export function ProductCard({ product }: { product: ProductCardData }) {
  const price = effectivePrice(Number(product.price), product.sale_price ? Number(product.sale_price) : null);
  const off = discountPercent(Number(product.price), product.sale_price ? Number(product.sale_price) : null);
  const outOfStock = product.stock_quantity <= 0 || product.stock_status === "out_of_stock";

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group card-surface flex flex-col overflow-hidden transition-shadow hover:shadow-lift"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.main_image_url ? (
          <img
            src={product.main_image_url}
            alt={product.name}
            loading="lazy"
            width={800}
            height={800}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {off != null && (
            <span className="rounded-md bg-sale px-2 py-0.5 text-[11px] font-semibold text-sale-foreground">
              -{off}%
            </span>
          )}
          {product.is_new_arrival && (
            <span className="rounded-md bg-highlight px-2 py-0.5 text-[11px] font-semibold text-highlight-foreground">
              NEW
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
        <div className="mt-auto pt-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-base font-bold text-primary">{formatUGX(price)}</span>
            {off != null && (
              <span className="text-xs text-muted-foreground line-through">
                {formatUGX(product.price)}
              </span>
            )}
          </div>
          <p className={`mt-1 text-xs ${outOfStock ? "text-muted-foreground" : "text-success"}`}>
            {outOfStock ? "Out of stock" : "In stock"}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No products found.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
