import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageDropzone, UploadButton } from "@/components/admin/ImageUploadButton";
import { slugify } from "@/lib/format";
import { PRICING_MODES, tierRangeLabel } from "@/lib/pricing";
import type { BulkTier, PricingMode } from "@/lib/store-types";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice: number | null;
  costPrice: number | null;
  pricingMode: PricingMode;
  bulkTiers: BulkTier[];
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId: string | null;
  subcategoryId: string | null;
  brandId: string | null;
  mainImageUrl: string | null;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  images: { url: string; altText: string }[];
  specifications: { label: string; value: string }[];
  variants: { name: string; sku: string; price: number; salePrice: number | null; stockQuantity: number }[];
};

export const emptyProduct: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  price: 0,
  salePrice: null,
  costPrice: null,
  pricingMode: "show_price",
  bulkTiers: [],
  stockQuantity: 0,
  lowStockThreshold: 5,
  categoryId: null,
  subcategoryId: null,
  brandId: null,
  mainImageUrl: null,
  tags: [],
  isPublished: true,
  isFeatured: false,
  isBestseller: false,
  isNewArrival: false,
  seoTitle: null,
  seoDescription: null,
  images: [],
  specifications: [],
  variants: [],
};

function num(value: string): number {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ProductForm({
  initial,
  categories,
  brands,
  saving,
  onSubmit,
}: {
  initial: ProductFormValues;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  saving: boolean;
  onSubmit: (values: ProductFormValues) => void;
}) {
  const [values, setValues] = useState<ProductFormValues>(initial);
  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...values, slug: values.slug || slugify(values.name) });
      }}
    >
      <section className="card-surface space-y-4 p-4">
        <h2 className="font-display text-base font-bold">Basics</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Product name</Label>
            <Input
              id="name"
              required
              value={values.name}
              onChange={(e) => {
                const name = e.target.value;
                setValues((prev) => ({
                  ...prev,
                  name,
                  slug: prev.slug === slugify(prev.name) || !prev.slug ? slugify(name) : prev.slug,
                }));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">URL slug</Label>
            <Input id="slug" required value={values.slug} onChange={(e) => set("slug", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" value={values.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={values.categoryId ?? ""}
              onChange={(e) => set("categoryId", e.target.value || null)}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand">Brand</Label>
            <select
              id="brand"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={values.brandId ?? ""}
              onChange={(e) => set("brandId", e.target.value || null)}
            >
              <option value="">No brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={values.tags.join(", ")}
              onChange={(e) =>
                set(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="short">Short description</Label>
          <Textarea
            id="short"
            rows={2}
            value={values.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Full description</Label>
          <Textarea
            id="description"
            rows={6}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </section>

      <section className="card-surface space-y-4 p-4">
        <h2 className="font-display text-base font-bold">Pricing mode</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {PRICING_MODES.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${
                values.pricingMode === option.value
                  ? "border-primary bg-accent"
                  : "border-border hover:bg-accent/50"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <input
                  type="radio"
                  name="pricingMode"
                  value={option.value}
                  checked={values.pricingMode === option.value}
                  onChange={() => set("pricingMode", option.value)}
                />
                {option.label}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{option.help}</span>
            </label>
          ))}
        </div>

        {values.pricingMode !== "show_price" && (
          <div className="space-y-2">
            <Label>Bulk quantity tiers (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Leave the price empty to show &quot;Contact for quotation&quot; for that tier.
            </p>
            {values.bulkTiers.map((tier, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-5">
                <Input
                  placeholder="Min qty"
                  inputMode="numeric"
                  value={String(tier.minQty)}
                  onChange={(e) => {
                    const next = [...values.bulkTiers];
                    next[index] = { ...tier, minQty: Math.max(1, Math.round(num(e.target.value))) };
                    set("bulkTiers", next);
                  }}
                />
                <Input
                  placeholder="Max qty (blank = no limit)"
                  inputMode="numeric"
                  value={tier.maxQty == null ? "" : String(tier.maxQty)}
                  onChange={(e) => {
                    const next = [...values.bulkTiers];
                    next[index] = {
                      ...tier,
                      maxQty: e.target.value ? Math.round(num(e.target.value)) : null,
                    };
                    set("bulkTiers", next);
                  }}
                />
                <Input
                  placeholder="Unit price (UGX)"
                  inputMode="numeric"
                  value={tier.price == null ? "" : String(tier.price)}
                  onChange={(e) => {
                    const next = [...values.bulkTiers];
                    next[index] = { ...tier, price: e.target.value ? num(e.target.value) : null };
                    set("bulkTiers", next);
                  }}
                />
                <Input
                  placeholder="Note (e.g. contact us)"
                  value={tier.note}
                  onChange={(e) => {
                    const next = [...values.bulkTiers];
                    next[index] = { ...tier, note: e.target.value };
                    set("bulkTiers", next);
                  }}
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{tierRangeLabel(tier)}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Remove tier"
                    onClick={() => set("bulkTiers", values.bulkTiers.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                set("bulkTiers", [
                  ...values.bulkTiers,
                  { minQty: values.bulkTiers.length === 0 ? 10 : 50, maxQty: null, price: null, note: "" },
                ])
              }
            >
              Add bulk tier
            </Button>
          </div>
        )}
      </section>

      <section className="card-surface space-y-4 p-4">
        <h2 className="font-display text-base font-bold">Pricing &amp; stock (UGX)</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              inputMode="numeric"
              value={String(values.price)}
              onChange={(e) => set("price", num(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salePrice">Sale price (optional)</Label>
            <Input
              id="salePrice"
              inputMode="numeric"
              value={values.salePrice == null ? "" : String(values.salePrice)}
              onChange={(e) => set("salePrice", e.target.value ? num(e.target.value) : null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="costPrice">Cost price (internal)</Label>
            <Input
              id="costPrice"
              inputMode="numeric"
              value={values.costPrice == null ? "" : String(values.costPrice)}
              onChange={(e) => set("costPrice", e.target.value ? num(e.target.value) : null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock">Stock quantity</Label>
            <Input
              id="stock"
              inputMode="numeric"
              value={String(values.stockQuantity)}
              onChange={(e) => set("stockQuantity", Math.round(num(e.target.value)))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lowStock">Low stock alert at</Label>
            <Input
              id="lowStock"
              inputMode="numeric"
              value={String(values.lowStockThreshold)}
              onChange={(e) => set("lowStockThreshold", Math.round(num(e.target.value)))}
            />
          </div>
        </div>
      </section>

      <section className="card-surface space-y-5 p-4">
        <h2 className="font-display text-base font-bold">Images</h2>

        <div className="space-y-2">
          <Label>Main image</Label>
          {values.mainImageUrl ? (
            <div className="flex flex-wrap items-center gap-3">
              <img
                src={values.mainImageUrl}
                alt="Main product image"
                className="h-24 w-24 rounded-md border border-border object-cover"
              />
              <UploadButton label="Replace image" onUploaded={(url) => set("mainImageUrl", url)} />
              <Button type="button" variant="ghost" size="sm" onClick={() => set("mainImageUrl", null)}>
                Remove
              </Button>
            </div>
          ) : (
            <ImageDropzone
              multiple={false}
              label="Drag the main photo here, or click to pick from your device"
              onUploaded={(url) => set("mainImageUrl", url)}
            />
          )}
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => setShowMainUrl((v) => !v)}
          >
            {showMainUrl ? "Hide URL field" : "Paste an image URL instead"}
          </button>
          {showMainUrl && (
            <Input
              id="mainImage"
              placeholder="https://..."
              value={values.mainImageUrl ?? ""}
              onChange={(e) => set("mainImageUrl", e.target.value || null)}
            />
          )}
        </div>

        <div className="space-y-3">
          <Label>Gallery images</Label>
          <ImageDropzone
            label="Drag gallery photos here, or click to pick several from your device"
            onUploaded={(url) => set("images", [...values.images, { url, altText: "" }])}
          />

          {values.images.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {values.images.map((img, index) => (
                <div key={index} className="flex items-center gap-3 rounded-md border border-border p-2">
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.altText || "Gallery image"}
                      className="h-16 w-16 shrink-0 rounded-md border border-border object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-md bg-muted" />
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      placeholder="Alt text (helps SEO)"
                      value={img.altText}
                      onChange={(e) => {
                        const next = [...values.images];
                        next[index] = { ...img, altText: e.target.value };
                        set("images", next);
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <UploadButton
                        label="Replace"
                        onUploaded={(url) => {
                          const next = [...values.images];
                          next[index] = { ...img, url };
                          set("images", next);
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => set("images", values.images.filter((_, i) => i !== index))}
                        aria-label="Remove image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>


      <section className="card-surface space-y-4 p-4">
        <h2 className="font-display text-base font-bold">Specifications</h2>
        <div className="space-y-2">
          {values.specifications.map((spec, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <Input
                className="min-w-[160px] flex-1"
                placeholder="Label (e.g. Wattage)"
                value={spec.label}
                onChange={(e) => {
                  const next = [...values.specifications];
                  next[index] = { ...spec, label: e.target.value };
                  set("specifications", next);
                }}
              />
              <Input
                className="min-w-[160px] flex-1"
                placeholder="Value (e.g. 12W)"
                value={spec.value}
                onChange={(e) => {
                  const next = [...values.specifications];
                  next[index] = { ...spec, value: e.target.value };
                  set("specifications", next);
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() =>
                  set("specifications", values.specifications.filter((_, i) => i !== index))
                }
                aria-label="Remove specification"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => set("specifications", [...values.specifications, { label: "", value: "" }])}
          >
            Add specification
          </Button>
        </div>
      </section>

      <section className="card-surface space-y-4 p-4">
        <h2 className="font-display text-base font-bold">Variations</h2>
        <div className="space-y-2">
          {values.variants.map((variant, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-5">
              <Input
                placeholder="Name (e.g. Warm White)"
                value={variant.name}
                onChange={(e) => {
                  const next = [...values.variants];
                  next[index] = { ...variant, name: e.target.value };
                  set("variants", next);
                }}
              />
              <Input
                placeholder="SKU"
                value={variant.sku}
                onChange={(e) => {
                  const next = [...values.variants];
                  next[index] = { ...variant, sku: e.target.value };
                  set("variants", next);
                }}
              />
              <Input
                placeholder="Price"
                inputMode="numeric"
                value={String(variant.price)}
                onChange={(e) => {
                  const next = [...values.variants];
                  next[index] = { ...variant, price: num(e.target.value) };
                  set("variants", next);
                }}
              />
              <Input
                placeholder="Stock"
                inputMode="numeric"
                value={String(variant.stockQuantity)}
                onChange={(e) => {
                  const next = [...values.variants];
                  next[index] = { ...variant, stockQuantity: Math.round(num(e.target.value)) };
                  set("variants", next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => set("variants", values.variants.filter((_, i) => i !== index))}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              set("variants", [
                ...values.variants,
                { name: "", sku: "", price: values.price, salePrice: null, stockQuantity: 0 },
              ])
            }
          >
            Add variation
          </Button>
        </div>
      </section>

      <section className="card-surface space-y-4 p-4">
        <h2 className="font-display text-base font-bold">Visibility &amp; SEO</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["isPublished", "Published"],
              ["isFeatured", "Featured"],
              ["isBestseller", "Bestseller"],
              ["isNewArrival", "New arrival"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
              {label}
              <Switch
                checked={values[key]}
                onCheckedChange={(checked) => set(key, checked)}
                aria-label={label}
              />
            </label>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input
              id="seoTitle"
              value={values.seoTitle ?? ""}
              onChange={(e) => set("seoTitle", e.target.value || null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seoDescription">Meta description</Label>
            <Input
              id="seoDescription"
              value={values.seoDescription ?? ""}
              onChange={(e) => set("seoDescription", e.target.value || null)}
            />
          </div>
        </div>
      </section>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save product"}
        </Button>
      </div>
    </form>
  );
}
