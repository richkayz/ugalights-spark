import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadProductImage } from "@/lib/admin.functions";

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

export function UploadButton({
  label = "Upload image",
  onUploaded,
}: {
  label?: string;
  onUploaded: (url: string) => void;
}) {
  const upload = useServerFn(uploadProductImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > 10 * 1024 * 1024) {
            toast.error("Image must be 10MB or smaller");
            return;
          }
          setBusy(true);
          try {
            const base64 = await toBase64(file);
            const result = await upload({
              data: { filename: file.name, contentType: file.type || "image/jpeg", base64 },
            });
            if (result.ok) {
              onUploaded(result.url);
              toast.success("Image uploaded");
            } else {
              toast.error(result.message);
            }
          } catch {
            toast.error("Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        {busy ? "Uploading..." : label}
      </Button>
    </>
  );
}
