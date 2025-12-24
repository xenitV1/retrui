import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { locales } from "@/i18n/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://retrui.vercel.app";

    const entries: MetadataRoute.Sitemap = [];

    // 1. Static Pages (Home, About) for each locale
    for (const locale of locales) {
        const alternates = {
            languages: Object.fromEntries(
                locales.map((l) => [l, `${baseUrl}/${l}`])
            ),
        };

        // Home page
        entries.push({
            url: `${baseUrl}/${locale}`,
            lastModified: new Date(),
            alternates,
        });

        // About page
        entries.push({
            url: `${baseUrl}/${locale}/about`,
            lastModified: new Date(),
            alternates: {
                languages: Object.fromEntries(
                    locales.map((l) => [l, `${baseUrl}/${l}/about`])
                ),
            },
        });
    }

    // 2. Dynamic News Permalink Pages (from DB)
    try {
        const newsItems = await prisma.news.findMany({
            orderBy: { publishedAt: 'desc' },
            take: 1000, // Google typically limits single sitemap to 50k
        });

        for (const news of newsItems) {
            entries.push({
                url: `${baseUrl}/${news.language}/news/${news.slug}`,
                lastModified: news.publishedAt,
            });
        }
    } catch (error) {
        console.error("[Sitemap] Failed to fetch news from DB:", error);
    }

    return entries;
}
