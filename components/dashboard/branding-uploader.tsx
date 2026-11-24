"use client";

import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { removeBrandAsset, uploadBrandAsset } from "@/actions/company";
import { Button } from "@/components/ui/button";

function AssetUploader({
  kind,
  label,
  hint,
  currentUrl,
  aspect,
}: {
  kind: "logo" | "banner";
  label: string;
  hint: string;
  currentUrl: string | null;
  aspect: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setPending(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("kind", kind);
    const result = await uploadBrandAsset(formData);
    setPending(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      router.refresh();
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function remove() {
    setPending(true);
    const result = await removeBrandAsset(kind);
    setPending(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-navy">{label}</p>
          <p className="text-[11px] text-slate-400">{hint}</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Changer
          </Button>
          {currentUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={pending}>
              <Trash2 className="h-4 w-4 text-rose-500" />
            </Button>
          )}
        </div>
      </div>
      <div className={`mt-3 flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-200 bg-slate-50 ${aspect}`}>
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 py-6 text-slate-300">
            <ImageIcon className="h-6 w-6" />
            <span className="text-[11px]">Aucune image</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandingUploader({ logoUrl, bannerUrl }: { logoUrl: string | null; bannerUrl: string | null }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <AssetUploader
        kind="logo"
        label="Logo"
        hint="Affiché dans le portail client. Format carré recommandé."
        currentUrl={logoUrl}
        aspect="h-32 w-32"
      />
      <AssetUploader
        kind="banner"
        label="Bannière"
        hint="Image d'en-tête du portail. 1200×400 recommandé."
        currentUrl={bannerUrl}
        aspect="h-32 w-full"
      />
    </div>
  );
}
