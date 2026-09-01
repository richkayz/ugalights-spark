import { Button } from "@/components/ui/button";
import { ProductGrid } from "./ProductCard";
import { FilterSidebar, SORT_OPTIONS, type SortValue } from "./ProductFilters";
import type { ProductCardData } from "@/lib/store-types";

export type ListingSearch = {
  q?: string | undefined;
  sort?: SortValue | undefined;
  page?: number | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
};

export function ProductListing({
  title,
  description,
  data,
  search,
  activeCategory,
  onSearchChange,
}: {
  title: string;
  description?: string | undefined;
  data: { items: ProductCardData[]; total: number; page: number; pageSize: number };
  search: ListingSearch;
  activeCategory?: string | undefined;
  onSearchChange: (next: Partial<ListingSearch>) => void;
}) {
  const sort = search.sort ?? "featured";
  const page = data.page;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="container-page py-8">
      <header className="mb-6">
        <h1 className="section-title">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="hidden lg:block">
          <FilterSidebar
            activeCategory={activeCategory}
            minPrice={search.minPrice}
            maxPrice={search.maxPrice}
            onPriceApply={(min, max) =>
              onSearchChange({ minPrice: min, maxPrice: max, page: 1 })
            }
          />
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {data.total} product{data.total === 1 ? "" : "s"}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sort by</span>
              <select
                value={sort}
                onChange={(e) => onSearchChange({ sort: e.target.value as SortValue, page: 1 })}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ProductGrid products={data.items} />

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => onSearchChange({ page: page - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => onSearchChange({ page: page + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
