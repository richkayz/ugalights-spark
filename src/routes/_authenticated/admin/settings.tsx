import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminSettings, updateAdminSetting } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Store Settings | UGALights Admin" },
      { name: "description", content: "Manage UGALights store contact details and delivery fees." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const fetchSettings = useServerFn(getAdminSettings);
  const saveSetting = useServerFn(updateAdminSetting);
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => fetchSettings({}),
  });

  const mutation = useMutation({
    mutationFn: (input: { key: string; value: string }) => saveSetting({ data: input }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Setting saved");
        void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  return (
    <AdminLayout title="Store settings">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      ) : (
        <div className="card-surface divide-y divide-border">
          {(data?.settings ?? []).map((setting) => (
            <div
              key={setting.key}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <label
                htmlFor={`setting-${setting.key}`}
                className="w-56 shrink-0 text-sm font-medium"
              >
                {setting.key.replace(/_/g, " ")}
              </label>
              <Input
                id={`setting-${setting.key}`}
                value={drafts[setting.key] ?? setting.value}
                onChange={(e) => setDrafts({ ...drafts, [setting.key]: e.target.value })}
              />
              <Button
                variant="secondary"
                onClick={() =>
                  mutation.mutate({
                    key: setting.key,
                    value: drafts[setting.key] ?? setting.value,
                  })
                }
              >
                Save
              </Button>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
