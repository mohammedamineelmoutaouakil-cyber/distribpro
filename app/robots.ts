import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/portal", "/superadmin", "/api", "/auth", "/invite"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
