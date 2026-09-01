import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  listHomepageSections,
  reorderHomepageSections,
  saveHomepageSection,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/homepage")({
  head: () => ({
    meta: [
      { title: "Homepage Editor | UGALights Admin" },
      {
        name: "description",
        content: "Enable, reorder and edit the UGALights homepage sections and footer.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminHomepage,
});

type Section = {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: Record<string, any>;
  sort_order: number;
  is_enabled: boolean;
};

type FieldDef = { key: string; label: string; type: "text" | "textarea" | "items" };

const SECTION_META: Record<string, { label: string; hint: string; fields: FieldDef[] }> = {
  announcement: {
    label: "Announcement bar",
    hint: "Thin strip above the header. The title is the message shown.",
    fields: [],
  },
  hero: {
    label: "Hero banner",
    hint: "Top banner with headline, body text, background image and buttons.",
    fields: [
      { key: "body", label: "Body text", type: "textarea" },
      { key: "image_url", label: "Background image URL", type: "text" },
      { key: "primary_button_text", label: "Primary button text", type: "text" },
      { key: "primary_button_link", label: "Primary button link", type: "text" },
      { key: "secondary_button_text", label: "WhatsApp button text", type: "text" },
    ],
  },
  why_us: {
    label: "Why choose us",
    hint: "Benefit tiles. Each item needs a title and text.",
    fields: [{ key: "items", label: "Benefit items", type: "items" }],
  },
  featured_categories: {
    label: "Category grid",
    hint: "Shows featured categories from the catalogue.",
    fields: [],
  },
  featured_products: {
    label: "Featured products",
    hint: "Products flagged as featured in the catalogue.",
    fields: [],
  },
  bestsellers: {
    label: "Bestsellers",
    hint: "Products flagged as bestsellers, ordered by sales.",
    fields: [],
  },
  promo_banner: {
    label: "Promo banner",
    hint: "Full-width promotional banner with an image and button.",
    fields: [
      { key: "image_url", label: "Background image URL", type: "text" },
      { key: "button_text", label: "Button text", type: "text" },
      { key: "button_link", label: "Button link", type: "text" },
    ],
  },
  popular_products: {
    label: "New arrivals",
    hint: "Newest published products.",
    fields: [],
  },
  about_us: {
    label: "About UGALights",
    hint: "Short company story with a link to the full About page.",
    fields: [
      { key: "body", label: "About text", type: "textarea" },
      { key: "button_text", label: "Button text", type: "text" },
      { key: "button_link", label: "Button link", type: "text" },
    ],
  },
  delivery_info: {
    label: "Delivery & payment",
    hint: "Delivery and payment tiles. Each item needs a heading and text.",
    fields: [{ key: "items", label: "Delivery points", type: "items" }],
  },
  faq: {
    label: "FAQs",
    hint: "Questions and answers shown as expandable rows.",
    fields: [{ key: "items", label: "FAQ entries", type: "items" }],
  },
  contact_info: {
    label: "Contact details",
    hint: "Phone and email come from Settings. Address, hours and note are edited here.",
    fields: [
      { key: "address", label: "Address", type: "text" },
      { key: "hours", label: "Opening hours", type: "text" },
      { key: "note", label: "Helper note", type: "textarea" },
      { key: "button_text", label: "WhatsApp button text", type: "text" },
    ],
  },
  whatsapp_cta: {
    label: "WhatsApp call to action",
    hint: "Encourages shoppers to chat on WhatsApp.",
    fields: [{ key: "button_text", label: "Button text", type: "text" }],
  },
  footer: {
    label: "Footer",
    hint: "Site-wide footer text and column headings.",
    fields: [
      { key: "about_text", label: "About text", type: "textarea" },
      { key: "shop_heading", label: "Shop column heading", type: "text" },
      { key: "info_heading", label: "Information column heading", type: "text" },
      { key: "contact_heading", label: "Contact column heading", type: "text" },
      { key: "bottom_note", label: "Bottom note", type: "text" },
    ],
  },
};

function AdminHomepage() {
  const fetchSections = useServerFn(listHomepageSections);
  const saveSection = useServerFn(saveHomepageSection);
  const reorder = useServerFn(reorderHomepageSections);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "homepage"],
    queryFn: () => fetchSections({}),
  });

  const [order, setOrder] = useState<Section[]>([]);
  useEffect(() => {
    if (data?.sections) setOrder(data.sections as Section[]);
  }, [data]);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["admin", "homepage"] });
  }

  const saveMutation = useMutation({
    mutationFn: (input: {
      id: string;
      title?: string;
      subtitle?: string;
      content?: Record<string, any>;
      isEnabled?: boolean;
    }) => saveSection({ data: input }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Section saved. Refresh the storefront to see it live.");
        invalidate();
      } else {
        toast.error(result.message ?? "Could not save section");
      }
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => reorder({ data: { ids } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Order updated");
        invalidate();
      } else {
        toast.error(result.message ?? "Could not reorder sections");
      }
    },
  });

  function move(index: number, direction: -1 | 1) {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    const b = next[target]!;
    next[index] = b;
    next[target] = a;
    setOrder(next);
    reorderMutation.mutate(next.map((s) => s.id));
  }

  return (
    <AdminLayout title="Homepage editor">
      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        Everything on the homepage is stored in the database. Turn sections on or off, change their
        order, and edit their text — no code changes needed.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading sections...</p>
      ) : (
        <div className="space-y-4">
          {order.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              total={order.length}
              onMove={move}
              onSave={(patch) => saveMutation.mutate({ id: section.id, ...patch })}
              onToggle={(checked) =>
                saveMutation.mutate({ id: section.id, isEnabled: checked })
              }
              saving={saveMutation.isPending}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function SectionCard({
  section,
  index,
  total,
  onMove,
  onSave,
  onToggle,
  saving,
}: {
  section: Section;
  index: number;
  total: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onSave: (patch: { title: string; subtitle: string; content: Record<string, any> }) => void;
  onToggle: (checked: boolean) => void;
  saving: boolean;
}) {
  const meta = SECTION_META[section.section_key] ?? {
    label: section.section_key.replace(/_/g, " "),
    hint: "",
    fields: [],
  };

  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle);
  const [content, setContent] = useState<Record<string, any>>(section.content ?? {});
  const [itemsError, setItemsError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(section.title);
    setSubtitle(section.subtitle);
    setContent(section.content ?? {});
  }, [section]);

  function submit() {
    setItemsError(null);
    onSave({ title, subtitle, content });
  }

  return (
    <section className="card-surface p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold capitalize">{meta.label}</h2>
          {meta.hint && <p className="text-xs text-muted-foreground">{meta.hint}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Move section up"
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Move section down"
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 pl-2">
            <span className="text-xs text-muted-foreground">
              {section.is_enabled ? "Visible" : "Hidden"}
            </span>
            <Switch
              checked={section.is_enabled}
              onCheckedChange={onToggle}
              aria-label={`Show ${meta.label}`}
            />
          </div>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Title</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Subtitle</span>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </label>

        {meta.fields.map((field) =>
          field.type === "items" ? (
            <label key={field.key} className="grid gap-1 text-sm md:col-span-2">
              <span className="font-medium">{field.label} (one entry per line: title | text)</span>
              <Textarea
                rows={4}
                value={itemsToText(content[field.key], section.section_key)}
                onChange={(e) => {
                  const parsed = textToItems(e.target.value, section.section_key);
                  setItemsError(parsed.error);
                  setContent({ ...content, [field.key]: parsed.items });
                }}
              />
              {itemsError && <span className="text-xs text-sale">{itemsError}</span>}
            </label>
          ) : field.type === "textarea" ? (
            <label key={field.key} className="grid gap-1 text-sm md:col-span-2">
              <span className="font-medium">{field.label}</span>
              <Textarea
                rows={3}
                value={String(content[field.key] ?? "")}
                onChange={(e) => setContent({ ...content, [field.key]: e.target.value })}
              />
            </label>
          ) : (
            <label key={field.key} className="grid gap-1 text-sm">
              <span className="font-medium">{field.label}</span>
              <Input
                value={String(content[field.key] ?? "")}
                onChange={(e) => setContent({ ...content, [field.key]: e.target.value })}
              />
            </label>
          ),
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={submit} disabled={saving}>
          Save section
        </Button>
      </div>
    </section>
  );
}

function itemsToText(value: unknown, sectionKey: string): string {
  if (!Array.isArray(value)) return "";
  return (value as Record<string, string>[])
    .map((item) =>
      sectionKey === "testimonials"
        ? [item["name"] ?? "", item["location"] ?? "", item["text"] ?? ""].join(" | ")
        : [item["title"] ?? "", item["text"] ?? ""].join(" | "),
    )
    .join("\n");
}

function textToItems(
  text: string,
  sectionKey: string,
): { items: Record<string, string>[]; error: string | null } {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const items: Record<string, string>[] = [];
  let error: string | null = null;
  for (const line of lines) {
    const parts = line.split("|").map((p) => p.trim());
    if (sectionKey === "testimonials") {
      if (parts.length < 3) error = "Use: name | location | quote";
      items.push({ name: parts[0] ?? "", location: parts[1] ?? "", text: parts[2] ?? "" });
    } else {
      if (parts.length < 2) error = "Use: title | text";
      items.push({ title: parts[0] ?? "", text: parts[1] ?? "" });
    }
  }
  return { items, error };
}
