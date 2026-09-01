import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { ProductListing, type ListingSearch } from "@/components/storefront/ProductListing";
import { getShopProducts } from "@/lib/storefront.functions";
import type { SortValue } from "@/components/storefront/ProductFilters";

const SORTS: SortValue[] = ["featured", "newest", "price_asc", "price_desc", "bestselling"];

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): ListingSearch => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    sort: SORTS.includes(search["sort"] as SortValue) ? (search["sort"] as SortValue) : undefined,
    page: Number(search["page"]) > 0 ? Number(search["page"]) : undefined,
    minPrice: Number(search["minPrice"]) > 0 ? Number(search["minPrice"]) : undefined,
    maxPrice: Number(search["maxPrice"]) > 0 ? Number(search["maxPrice"]) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    getShopProducts({
      data: {
        q: deps.q,
        sort: deps.sort ?? "featured",
        page: deps.page ?? 1,
        minPrice: deps.minPrice,
        maxPrice: deps.maxPrice,
        pageSize: 12,
      },
    }),
  head: () => ({
    meta: [
      { title: "Search Products | UGALights Uganda" },
      {
        name: "description",
        content: "Search UGALights for bulbs, solar systems, fittings, switches, sockets and cables.",
      },
      { property: "og:title", content: "Search Products | UGALights" },
      { property: "og:description", content: "Find the exact lighting product you need." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <StoreLayout>
      <ProductListing
        title={search.q ? `Results for "${search.q}"` : "Search"}
        description={search.q ? undefined : "Use the search bar to find products."}
        data={data}
        search={search}
        onSearchChange={(next) => void navigate({ search: (prev) => ({ ...prev, ...next }) })}
      />
    </StoreLayout>
  );
}
