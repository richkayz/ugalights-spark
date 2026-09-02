import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Upload } from "lucide-react";
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

/** Uploads picked files one by one and reports each resulting URL. */
function useUploader(onUploaded: (url: string) => void) {
  const upload = useServerFn(uploadProductImage);
  const [busy, setBusy] = useState(false);

  async function handleFiles(list: FileList | File[] | null) {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setBusy(true);
    let done = 0;
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`);
        continue;
      }
      try {
        const base64 = await toBase64(file);
        const result = await upload({
          data: { filename: file.name, contentType: file.type || "image/jpeg", base64 },
        });
        if (result.ok) {
          onUploaded(result.url);
          done += 1;
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error(`Could not upload ${file.name}`);
      }
    }
    setBusy(false);
    if (done) toast.success(done === 1 ? "Image uploaded" : `${done} images uploaded`);
  }

  return { busy, handleFiles };
}

export function UploadButton({
  label = "Choose from device",
  multiple = false,
  onUploaded,
}: {
  label?: string;
  multiple?: boolean;
  onUploaded: (url: string) => void;
}) {
  const { busy, handleFiles } = useUploader(onUploaded);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={async (e) => {
          const files = e.target.files;
          await handleFiles(files);
          e.target.value = "";
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

/** Click-or-drag area for picking images straight off a phone or computer. */
export function ImageDropzone({
  label = "Drag images here, or click to pick from your device",
  multiple = true,
  onUploaded,
}: {
  label?: string;
  multiple?: boolean;
  onUploaded: (url: string) => void;
}) {
  const { busy, handleFiles } = useUploader(onUploaded);
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setOver(false);
        await handleFiles(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        over ? "border-primary bg-primary/5" : "border-border bg-muted/40 hover:border-primary/60"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={async (e) => {
          const files = e.target.files;
          await handleFiles(files);
          e.target.value = "";
        }}
      />
      <ImagePlus className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm font-medium">{busy ? "Uploading..." : label}</p>
      <p className="text-xs text-muted-foreground">JPG, PNG or WEBP up to 10MB each</p>
    </div>
  );
}
