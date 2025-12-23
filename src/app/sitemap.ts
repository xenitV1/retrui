import { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://retrui.vercel.app";

    const entries: MetadataRoute.Sitemap = [];

    // Generate entries for each locale
    for (const locale of locales) {
        // Home page
        entries.push({
            url: `${baseUrl}/${locale}`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: locale === "en" ? 1 : 0.9,
        });

        // About page
        entries.push({
            url: `${baseUrl}/${locale}/about`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        });
    }

    return entries;
}
