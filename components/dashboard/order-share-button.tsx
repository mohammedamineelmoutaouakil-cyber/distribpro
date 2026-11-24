"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrderShareButton({
  phone,
  message,
  label = "Partager sur WhatsApp",
}: {
  phone: string | null;
  message: string;
  label?: string;
}) {
  function share() {
    const normalized = phone?.replace(/[^\d+]/g, "").replace(/^\+/, "") ?? "";
    const international = normalized.startsWith("212")
      ? normalized
      : normalized.startsWith("0")
        ? `212${normalized.slice(1)}`
        : normalized;
    const url = international
      ? `https://wa.me/${international}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={share}>
      <MessageCircle className="h-4 w-4 text-emerald-600" /> {label}
    </Button>
  );
}
