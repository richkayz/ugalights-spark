import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { deleteProduct, getAdminProduct, getCatalogueOptions, saveProduct } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  head: () => ({
    meta: [
      { title: "Edit Product | UGALights Admin" },
      { name: "description", content: "Edit a UGALights product." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const fetchProduct = useServerFn(getAdminProduct);
  const fetchOptions = useServerFn(getCatalogueOptions);
  const save = useServerFn(saveProduct);
  const remove = useServerFn(deleteProduct);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => fetchProduct({ data: { id } }),
  });
  const { data: options } = useQuery({
    queryKey: ["admin", "catalogue-options"],
    queryFn: () => fetchOptions({}),
  });

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => save({ data: { ...values, id } as any }),
    onSuccess: (result) => {
      if (result.ok) toast.success("Product saved");
      else toast.error(result.message);
    },
    onError: () => toast.error("Could not save the product"),
  });

  const deletion = useMutation({
    mutationFn: () => remove({ data: { id } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Product deleted");
        void navigate({ to: "/admin/products" });
      } else {
        toast.error(result.message);
      }
    },
  });

  const product = data?.product as any;
  const initial: ProductFormValues | null = product
    ? {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku ?? "",
        shortDescription: product.short_description ?? "",
        description: product.description ?? "",
        price: Number(product.price),
        salePrice: product.sale_price == null ? null : Number(product.sale_price),
        costPrice: product.cost_price == null ? null : Number(product.cost_price),
        stockQuantity: Number(product.stock_quantity),
        lowStockThreshold: Number(product.low_stock_threshold),
        categoryId: product.category_id ?? null,
        subcategoryId: product.subcategory_id ?? null,
        brandId: product.brand_id ?? null,
        mainImageUrl: product.main_image_url ?? null,
        tags: (product.tags ?? []) as string[],
        isPublished: product.is_published,
        isFeatured: product.is_featured,
        isBestseller: product.is_bestseller,
        isNewArrival: product.is_new_arrival,
        seoTitle: product.seo_title ?? null,
        seoDescription: product.seo_description ?? null,
        images: (data?.images ?? []).map((img: any) => ({ url: img.url, altText: img.alt_text ?? "" })),
        specifications: (data?.specifications ?? []).map((spec: any) => ({
          label: spec.label,
          value: spec.value,
        })),
        variants: (data?.variants ?? []).map((variant: any) => ({
          name: variant.name,
          sku: variant.sku ?? "",
          price: Number(variant.price),
          salePrice: variant.sale_price == null ? null : Number(variant.sale_price),
          stockQuantity: Number(variant.stock_quantity),
        })),
      }
    : null;

  return (
    <AdminLayout
      title={product ? `Edit: ${product.name}` : "Edit product"}
      actions={
        product ? (
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm("Delete this product permanently?")) deletion.mutate();
            }}
          >
            Delete
          </Button>
        ) : null
      }
    >
      {isLoading && <p className="text-sm text-muted-foreground">Loading product...</p>}
      {!isLoading && !initial && <p className="text-sm text-muted-foreground">Product not found.</p>}
      {initial && (
        <ProductForm
          key={initial.id}
          initial={initial}
          categories={(options?.categories ?? []) as { id: string; name: string }[]}
          brands={(options?.brands ?? []) as { id: string; name: string }[]}
          saving={mutation.isPending}
          onSubmit={(values) => mutation.mutate(values)}
        />
      )}
    </AdminLayout>
  );
}
