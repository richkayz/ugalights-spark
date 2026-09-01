import { MessageCircle } from "lucide-react";
import { AnnouncementBar, SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { MobileTabBar } from "./MobileTabBar";
import { useStoreConfig } from "@/hooks/use-store-config";
import { whatsappLink } from "@/lib/whatsapp";

export function WhatsAppFloat() {
  const { settings } = useStoreConfig();
  const number = settings["whatsapp"];
  if (!number) return null;
  return (
    <a
      href={whatsappLink(number, "Hello UGALights, I need help with a product.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with UGALights on WhatsApp"
      className="fixed bottom-5 right-4 z-40 hidden h-13 items-center gap-2 rounded-full bg-success px-4 py-3 text-sm font-semibold text-success-foreground shadow-lift transition-transform hover:scale-105 md:flex"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}

export function StoreLayout({
  children,
  announcement,
}: {
  children: React.ReactNode;
  announcement?: string | undefined;
}) {
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      {announcement ? <AnnouncementBar text={announcement} /> : null}
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppFloat />
      <MobileTabBar />
    </div>
  );
}
