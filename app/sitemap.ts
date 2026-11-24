import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/demo"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/login"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/signup"), lastModified: now, changeFrequency: "yearly", priority: 0.6 },
  ];
}
