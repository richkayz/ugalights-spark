import type { BulkTier, PricingMode } from "./store-types";

export const PRICING_MODES: { value: PricingMode; label: string; help: string }[] = [
  {
    value: "show_price",
    label: "Show price",
    help: "Price is public, customers can add to cart and buy now.",
  },
  {
    value: "quote_only",
    label: "Quote only",
    help: "Hide the price and show a Get a Quote enquiry form instead.",
  },
  {
    value: "show_price_bulk",
    label: "Show price + bulk quote",
    help: "Show the retail price and also let customers request a bulk price.",
  },
];

export function pricingMode(value: unknown): PricingMode {
  return value === "quote_only" || value === "show_price_bulk" ? value : "show_price";
}

/** Normalises the jsonb bulk tier list stored on a product. */
export function parseBulkTiers(value: unknown): BulkTier[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      const tier = (raw ?? {}) as Record<string, unknown>;
      const minQty = Number(tier["minQty"] ?? tier["min_qty"] ?? 1);
      const maxRaw = tier["maxQty"] ?? tier["max_qty"] ?? null;
      const priceRaw = tier["price"] ?? null;
      return {
        minQty: Number.isFinite(minQty) && minQty > 0 ? Math.round(minQty) : 1,
        maxQty: maxRaw == null || maxRaw === "" ? null : Math.round(Number(maxRaw)),
        price: priceRaw == null || priceRaw === "" ? null : Number(priceRaw),
        note: String(tier["note"] ?? ""),
      } satisfies BulkTier;
    })
    .filter((tier) => Number.isFinite(tier.minQty))
    .sort((a, b) => a.minQty - b.minQty);
}

export function tierRangeLabel(tier: BulkTier): string {
  if (tier.maxQty == null) return `${tier.minQty}+ units`;
  if (tier.maxQty === tier.minQty) return `${tier.minQty} unit${tier.minQty === 1 ? "" : "s"}`;
  return `${tier.minQty}–${tier.maxQty} units`;
}
