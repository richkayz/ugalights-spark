import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { ProductListing, type ListingSearch } from "@/components/storefront/ProductListing";
import { getShopProducts } from "@/lib/storefront.functions";
import type { SortValue } from "@/components/storefront/ProductFilters";

const SORTS: SortValue[] = ["featured", "newest", "price_asc", "price_desc", "bestselling"];

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ListingSearch => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
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
      { title: "Shop Lighting & Electricals | UGALights Uganda" },
      {
        name: "description",
        content:
          "Browse all UGALights products: LED bulbs, solar kits, chandeliers, flood lights, switches, sockets, cables and more with delivery across Uganda.",
      },
      { property: "og:title", content: "Shop Lighting & Electricals | UGALights" },
      {
        property: "og:description",
        content: "All UGALights lighting and electrical products, priced in UGX.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <StoreLayout>
      <ProductListing
        title="All products"
        description="Quality lighting and electrical accessories, priced in Ugandan Shillings."
        data={data}
        search={search}
        onSearchChange={(next) =>
          void navigate({ search: (prev) => ({ ...prev, ...next }) })
        }
      />
    </StoreLayout>
  );
}
