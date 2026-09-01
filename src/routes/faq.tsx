import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/storefront/ContentPage";
import { getPageContent } from "@/lib/storefront.functions";
import { canonicalLink, canonicalMeta } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  loader: () => getPageContent({ data: { pageKey: "faq" } }),
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    const title = `${page?.seo_title || page?.title || "Frequently Asked Questions"} | UGALights`;
    const description = (page?.seo_description || "Answers about ordering, delivery, payment and warranties at UGALights Uganda.").slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...canonicalMeta("/faq"),
      ],
      links: canonicalLink("/faq"),
    };
  },
  component: Page,
});

function Page() {
  const { page } = Route.useLoaderData();
  return (
    <ContentPage
      title={page?.title ?? "Frequently Asked Questions"}
      body={page?.body ?? "Content coming soon."}
    />
  );
}
