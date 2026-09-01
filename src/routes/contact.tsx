import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentPage } from "@/components/storefront/ContentPage";
import { useStoreConfig } from "@/hooks/use-store-config";
import { getPageContent } from "@/lib/storefront.functions";
import { whatsappLink } from "@/lib/whatsapp";
import { canonicalLink, canonicalMeta } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  loader: () => getPageContent({ data: { pageKey: "contact" } }),
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    const title = `${page?.seo_title || page?.title || "Contact Us"} | UGALights`;
    const description = (
      page?.seo_description ||
      "Call, email or WhatsApp UGALights for lighting and electrical enquiries, quotes and project support in Uganda."
    ).slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...canonicalMeta("/contact"),
      ],
      links: canonicalLink("/contact"),
    };
  },
  component: ContactRoute,
});

function ContactRoute() {
  const { page } = Route.useLoaderData();
  const { settings } = useStoreConfig();

  return (
    <ContentPage
      title={page?.title ?? "Contact us"}
      body={page?.body ?? "Our team is available to help with product advice, quotes and orders."}
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {settings["phone"] && (
          <a href={`tel:${settings["phone"]}`} className="card-surface flex items-center gap-3 p-4">
            <Phone className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{settings["phone"]}</span>
          </a>
        )}
        {settings["email"] && (
          <a href={`mailto:${settings["email"]}`} className="card-surface flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{settings["email"]}</span>
          </a>
        )}
        {settings["address"] && (
          <div className="card-surface flex items-center gap-3 p-4">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{settings["address"]}</span>
          </div>
        )}
        {settings["opening_hours"] && (
          <div className="card-surface flex items-center gap-3 p-4">
            <span className="text-sm font-medium">{settings["opening_hours"]}</span>
          </div>
        )}
      </div>

      {settings["whatsapp"] && (
        <Button asChild size="lg" className="mt-6">
          <a
            href={whatsappLink(settings["whatsapp"], "Hello UGALights, I have an enquiry.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="mr-1 h-4 w-4" /> Chat on WhatsApp
          </a>
        </Button>
      )}
    </ContentPage>
  );
}
