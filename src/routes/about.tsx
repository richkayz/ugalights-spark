import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/storefront/ContentPage";
import { getPageContent } from "@/lib/storefront.functions";
import { canonicalLink, canonicalMeta } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  loader: () => getPageContent({ data: { pageKey: "about" } }),
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    const title = `${page?.seo_title || page?.title || "About UGALights"} | UGALights`;
    const description = (page?.seo_description || "Learn about UGALights, Uganda's trusted supplier of lighting and electrical accessories.").slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...canonicalMeta("/about"),
      ],
      links: canonicalLink("/about"),
    };
  },
  component: Page,
});

function Page() {
  const { page } = Route.useLoaderData();
  return (
    <ContentPage
      title={page?.title ?? "About UGALights"}
      body={page?.body ?? "Content coming soon."}
    />
  );
}
