import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { ProductListing, type ListingSearch } from "@/components/storefront/ProductListing";
import { getShopProducts } from "@/lib/storefront.functions";
import type { SortValue } from "@/components/storefront/ProductFilters";
import { breadcrumbJsonLd, canonicalLink, canonicalMeta, clamp, socialImage } from "@/lib/seo";

const SORTS: SortValue[] = ["featured", "newest", "price_asc", "price_desc", "bestselling"];

export const Route = createFileRoute("/category/$slug")({
  validateSearch: (search: Record<string, unknown>): ListingSearch => ({
    sort: SORTS.includes(search["sort"] as SortValue) ? (search["sort"] as SortValue) : undefined,
    page: Number(search["page"]) > 0 ? Number(search["page"]) : undefined,
    minPrice: Number(search["minPrice"]) > 0 ? Number(search["minPrice"]) : undefined,
    maxPrice: Number(search["maxPrice"]) > 0 ? Number(search["maxPrice"]) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ params, deps }) =>
    getShopProducts({
      data: {
        category: params.slug,
        sort: deps.sort ?? "featured",
        page: deps.page ?? 1,
        minPrice: deps.minPrice,
        maxPrice: deps.maxPrice,
        pageSize: 12,
      },
    }),
  head: ({ loaderData }) => {
    const name = loaderData?.category?.name ?? "Category";
    const description = clamp(
      loaderData?.category?.description,
      `Shop ${name} in Uganda at UGALights. Genuine products, UGX prices and delivery in Kampala and countrywide.`,
    );
    const path = `/category/${loaderData?.category?.slug ?? ""}`;
    return {
      meta: [
        { title: `${name} in Uganda | Prices & Delivery | UGALights`.slice(0, 70) },
        { name: "description", content: description },
        { property: "og:title", content: `${name} | UGALights Uganda` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...socialImage(loaderData?.category?.image_url ?? null),
        ...canonicalMeta(path),
      ],
      links: canonicalLink(path),
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const { slug } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <StoreLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/shop" },
              { name: data.category?.name ?? slug, path: `/category/${slug}` },
            ]),
          ),
        }}
      />
      <ProductListing
        title={data.category?.name ?? "Category"}
        description={data.category?.description || undefined}
        data={data}
        search={search}
        activeCategory={slug}
        onSearchChange={(next) => void navigate({ search: (prev) => ({ ...prev, ...next }) })}
      />
    </StoreLayout>
  );
}
