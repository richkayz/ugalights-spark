import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitQuoteRequest } from "@/lib/storefront.functions";
import { whatsappLink } from "@/lib/whatsapp";

export type QuoteFormContext = {
  productId: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  kind: "quote" | "bulk";
  whatsapp?: string;
  pageUrl: string;
};

export function QuoteRequestForm({ context }: { context: QuoteFormContext }) {
  const send = useServerFn(submitQuoteRequest);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState(context.quantity);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const waMessage = [
    context.kind === "bulk"
      ? "Hello UGALights, I would like a bulk price for:"
      : "Hello UGALights, please send me a quotation for:",
    `Product: ${context.productName}`,
    ...(context.variantName ? [`Option: ${context.variantName}`] : []),
    `Quantity: ${quantity}`,
    ...(name ? [`Name: ${name}`] : []),
    ...(phone ? [`Phone: ${phone}`] : []),
    ...(location ? [`Location: ${location}`] : []),
    ...(message ? [`Message: ${message}`] : []),
    `Link: ${context.pageUrl}`,
  ].join("\n");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || phone.trim().length < 5) {
      toast.error("Please enter your name and phone number.");
      return;
    }
    setSending(true);
    try {
      const result = await send({
        data: {
          productId: context.productId,
          productName: context.productName,
          variantId: context.variantId,
          variantName: context.variantName,
          quantity: Math.max(1, Math.round(quantity)),
          customerName: name.trim(),
          customerPhone: phone.trim(),
          location: location.trim(),
          message: message.trim(),
          kind: context.kind,
        },
      });
      if (result.ok) {
        setSent(true);
        toast.success("Enquiry sent — we will contact you with a price shortly.");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Could not send your enquiry. Please try WhatsApp.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="font-display text-base font-bold">
        {context.kind === "bulk" ? "Request a bulk price" : "Get a quote"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="quote-qty">Quantity needed</Label>
          <Input
            id="quote-qty"
            inputMode="numeric"
            value={String(quantity)}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value.replace(/[^0-9]/g, "")) || 1))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quote-name">Your name</Label>
          <Input id="quote-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quote-phone">Phone number</Label>
          <Input
            id="quote-phone"
            required
            maxLength={40}
            placeholder="07XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quote-location">Location</Label>
          <Input
            id="quote-location"
            maxLength={160}
            placeholder="Kampala"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="quote-message">Message (optional)</Label>
        <Textarea
          id="quote-message"
          rows={3}
          maxLength={1500}
          placeholder="Tell us more about what you need"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={sending}>
          <Send className="mr-2 h-4 w-4" />
          {sending ? "Sending..." : "Submit enquiry"}
        </Button>
        {context.whatsapp && (
          <Button type="button" variant="secondary" asChild>
            <a href={whatsappLink(context.whatsapp, waMessage)} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Send on WhatsApp
            </a>
          </Button>
        )}
      </div>
      {sent && (
        <p className="text-sm font-medium text-success">
          Thank you — your request has been received. Our team will reply with the latest price.
        </p>
      )}
    </form>
  );
}
