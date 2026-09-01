import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductForm, emptyProduct, type ProductFormValues } from "@/components/admin/ProductForm";
import { getCatalogueOptions, saveProduct } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  head: () => ({
    meta: [
      { title: "New Product | UGALights Admin" },
      { name: "description", content: "Add a new product to the UGALights catalogue." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewProduct,
});

function NewProduct() {
  const fetchOptions = useServerFn(getCatalogueOptions);
  const create = useServerFn(saveProduct);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["admin", "catalogue-options"],
    queryFn: () => fetchOptions({}),
  });

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => create({ data: values as any }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Product created");
        void navigate({ to: "/admin/products" });
      } else {
        toast.error(result.message);
      }
    },
    onError: () => toast.error("Could not save the product"),
  });

  return (
    <AdminLayout title="New product">
      <ProductForm
        initial={emptyProduct}
        categories={(data?.categories ?? []) as { id: string; name: string }[]}
        brands={(data?.brands ?? []) as { id: string; name: string }[]}
        saving={mutation.isPending}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </AdminLayout>
  );
}
