import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/storefront/ContentPage";
import { getPageContent } from "@/lib/storefront.functions";
import { canonicalLink, canonicalMeta } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  loader: () => getPageContent({ data: { pageKey: "terms" } }),
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    const title = `${page?.seo_title || page?.title || "Terms & Conditions"} | UGALights`;
    const description = (page?.seo_description || "The terms and conditions that apply to purchases from UGALights Uganda.").slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...canonicalMeta("/terms"),
      ],
      links: canonicalLink("/terms"),
    };
  },
  component: Page,
});

function Page() {
  const { page } = Route.useLoaderData();
  return (
    <ContentPage
      title={page?.title ?? "Terms & Conditions"}
      body={page?.body ?? "Content coming soon."}
    />
  );
}
