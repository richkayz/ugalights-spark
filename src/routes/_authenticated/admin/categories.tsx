import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/format";
import { deleteCategory, listAdminCategories, saveCategory } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({
    meta: [
      { title: "Categories | UGALights Admin" },
      { name: "description", content: "Manage UGALights product categories." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCategories,
});

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
};

const blank: Draft = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  parentId: "",
  sortOrder: 0,
  isActive: true,
  isFeatured: false,
};

function AdminCategories() {
  const fetchCategories = useServerFn(listAdminCategories);
  const save = useServerFn(saveCategory);
  const remove = useServerFn(deleteCategory);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(blank);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => fetchCategories({}),
  });

  const mutation = useMutation({
    mutationFn: (values: Draft) =>
      save({
        data: {
          ...(values.id ? { id: values.id } : {}),
          name: values.name,
          slug: values.slug || slugify(values.name),
          description: values.description,
          imageUrl: values.imageUrl || null,
          parentId: values.parentId || null,
          sortOrder: values.sortOrder,
          isActive: values.isActive,
          isFeatured: values.isFeatured,
        } as any,
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Category saved");
        setDraft(blank);
        void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const deletion = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Category deleted");
        void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  const categories = (data?.categories ?? []) as any[];

  return (
    <AdminLayout title="Categories">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Loading categories...
                  </td>
                </tr>
              )}
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-muted/60">
                  <td className="px-4 py-3">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">/{category.slug}</p>
                  </td>
                  <td className="px-4 py-3">{data?.counts?.[category.id] ?? 0}</td>
                  <td className="px-4 py-3">{category.sort_order}</td>
                  <td className="px-4 py-3">{category.is_active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setDraft({
                          id: category.id,
                          name: category.name,
                          slug: category.slug,
                          description: category.description ?? "",
                          imageUrl: category.image_url ?? "",
                          parentId: category.parent_id ?? "",
                          sortOrder: category.sort_order ?? 0,
                          isActive: category.is_active,
                          isFeatured: category.is_featured,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Delete ${category.name}?`)) deletion.mutate(category.id);
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          className="card-surface h-fit space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(draft);
          }}
        >
          <h2 className="font-display text-base font-bold">
            {draft.id ? "Edit category" : "Add category"}
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              placeholder={slugify(draft.name)}
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-parent">Parent category</Label>
            <select
              id="cat-parent"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.parentId}
              onChange={(e) => setDraft({ ...draft, parentId: e.target.value })}
            >
              <option value="">Top level</option>
              {categories
                .filter((c) => c.id !== draft.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-image">Image URL</Label>
            <Input
              id="cat-image"
              value={draft.imageUrl}
              onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-order">Sort order</Label>
            <Input
              id="cat-order"
              inputMode="numeric"
              value={String(draft.sortOrder)}
              onChange={(e) =>
                setDraft({ ...draft, sortOrder: Number(e.target.value.replace(/[^0-9]/g, "") || 0) })
              }
            />
          </div>
          <label className="flex items-center justify-between text-sm">
            Active
            <Switch
              checked={draft.isActive}
              onCheckedChange={(checked) => setDraft({ ...draft, isActive: checked })}
              aria-label="Active"
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            Featured on homepage
            <Switch
              checked={draft.isFeatured}
              onCheckedChange={(checked) => setDraft({ ...draft, isFeatured: checked })}
              aria-label="Featured"
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={mutation.isPending}>
              {draft.id ? "Save changes" : "Add category"}
            </Button>
            {draft.id && (
              <Button type="button" variant="ghost" onClick={() => setDraft(blank)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
