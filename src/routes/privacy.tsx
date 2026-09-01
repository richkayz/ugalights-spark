import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/storefront/ContentPage";
import { getPageContent } from "@/lib/storefront.functions";
import { canonicalLink, canonicalMeta } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  loader: () => getPageContent({ data: { pageKey: "privacy" } }),
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    const title = `${page?.seo_title || page?.title || "Privacy Policy"} | UGALights`;
    const description = (page?.seo_description || "How UGALights collects, uses and protects your personal information.").slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...canonicalMeta("/privacy"),
      ],
      links: canonicalLink("/privacy"),
    };
  },
  component: Page,
});

function Page() {
  const { page } = Route.useLoaderData();
  return (
    <ContentPage
      title={page?.title ?? "Privacy Policy"}
      body={page?.body ?? "Content coming soon."}
    />
  );
}
