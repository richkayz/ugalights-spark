import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/storefront/ContentPage";
import { getPageContent } from "@/lib/storefront.functions";
import { canonicalLink, canonicalMeta } from "@/lib/seo";

export const Route = createFileRoute("/delivery")({
  loader: () => getPageContent({ data: { pageKey: "delivery" } }),
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    const title = `${page?.seo_title || page?.title || "Delivery & Returns"} | UGALights`;
    const description = (page?.seo_description || "UGALights delivery fees, timelines and return policy for orders across Uganda.").slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...canonicalMeta("/delivery"),
      ],
      links: canonicalLink("/delivery"),
    };
  },
  component: Page,
});

function Page() {
  const { page } = Route.useLoaderData();
  return (
    <ContentPage
      title={page?.title ?? "Delivery & Returns"}
      body={page?.body ?? "Content coming soon."}
    />
  );
}
