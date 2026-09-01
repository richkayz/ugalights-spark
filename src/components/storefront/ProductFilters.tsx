import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useStoreConfig } from "@/hooks/use-store-config";

export type SortValue = "featured" | "newest" | "price_asc" | "price_desc" | "bestselling";

export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "bestselling", label: "Best selling" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export function FilterSidebar({
  activeCategory,
  minPrice,
  maxPrice,
  onPriceApply,
}: {
  activeCategory?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  onPriceApply: (min?: number, max?: number) => void;
}) {
  const { categories } = useStoreConfig();
  const [min, setMin] = useState(minPrice != null ? String(minPrice) : "");
  const [max, setMax] = useState(maxPrice != null ? String(maxPrice) : "");
  const parents = categories.filter((c) => !c.parent_id);

  return (
    <aside className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Categories
        </h3>
        <ul className="space-y-1 text-sm">
          <li>
            <Link
              to="/shop"
              className={`block rounded-md px-2 py-1.5 hover:bg-accent ${!activeCategory ? "bg-accent font-semibold text-primary" : ""}`}
            >
              All products
            </Link>
          </li>
          {parents.map((cat) => (
            <li key={cat.id}>
              <Link
                to="/category/$slug"
                params={{ slug: cat.slug }}
                className={`block rounded-md px-2 py-1.5 hover:bg-accent ${activeCategory === cat.slug ? "bg-accent font-semibold text-primary" : ""}`}
              >
                {cat.name}
              </Link>
              {categories.filter((c) => c.parent_id === cat.id).length > 0 && (
                <ul className="ml-3 border-l border-border pl-2">
                  {categories
                    .filter((c) => c.parent_id === cat.id)
                    .map((sub) => (
                      <li key={sub.id}>
                        <Link
                          to="/category/$slug"
                          params={{ slug: sub.slug }}
                          className={`block rounded-md px-2 py-1 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground ${activeCategory === sub.slug ? "font-semibold text-primary" : ""}`}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Price (UGX)
        </h3>
        <div className="flex items-center gap-2">
          <Input
            inputMode="numeric"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value.replace(/[^0-9]/g, ""))}
            aria-label="Minimum price"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            inputMode="numeric"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value.replace(/[^0-9]/g, ""))}
            aria-label="Maximum price"
          />
        </div>
        <Button
          className="mt-3 w-full"
          variant="secondary"
          onClick={() =>
            onPriceApply(min ? Number(min) : undefined, max ? Number(max) : undefined)
          }
        >
          Apply
        </Button>
      </div>
    </aside>
  );
}
