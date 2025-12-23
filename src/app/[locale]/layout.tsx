import { Metadata } from "next";
import { locales, localeNames, type Locale } from "@/i18n/config";

// Import messages
import en from "@/i18n/messages/en.json";
import tr from "@/i18n/messages/tr.json";
import de from "@/i18n/messages/de.json";
import fr from "@/i18n/messages/fr.json";
import es from "@/i18n/messages/es.json";
import zh from "@/i18n/messages/zh.json";
import hi from "@/i18n/messages/hi.json";

const messages: Record<Locale, typeof en> = { en, tr, de, fr, es, zh, hi };

// Generate static params for all locales
export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

// Dynamic metadata based on locale
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale: rawLocale } = await params;
    const locale = rawLocale as Locale;
    const t = messages[locale] || messages.en;
    const baseUrl = "https://retrui.vercel.app";

    // Generate hreflang alternates for all locales
    const languages: Record<string, string> = {};
    locales.forEach((loc) => {
        languages[loc] = `${baseUrl}/${loc}`;
    });

    return {
        metadataBase: new URL(baseUrl),
        title: {
            default: t.meta.title,
            template: `%s | Retrui`,
        },
        description: t.meta.description,
        keywords: t.meta.keywords.split(", "),
        authors: [{ name: "xenit", url: "https://x.com/xenit_v0" }],
        creator: "xenit",
        publisher: "Retrui",
        formatDetection: {
            email: false,
            address: false,
            telephone: false,
        },
        icons: {
            icon: [
                { url: "/favicon.ico", sizes: "any" },
                { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
                { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
            ],
            apple: [
                { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
            ],
        },
        manifest: "/manifest.json",
        openGraph: {
            type: "website",
            locale: locale === "en" ? "en_US" : locale,
            url: `${baseUrl}/${locale}`,
            siteName: "Retrui",
            title: t.meta.title,
            description: t.meta.description,
            images: [
                {
                    url: "/icon-512.png",
                    width: 512,
                    height: 512,
                    alt: "Retrui Logo",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: t.meta.title,
            description: t.meta.description,
            creator: "@xenit_v0",
            images: ["/icon-512.png"],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
        alternates: {
            canonical: `/${locale}`,
            languages,
        },
        category: "technology",
    };
}

export default async function LocaleLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    // Return only children - no html/body tags!
    // RootLayout already has them
    return children;
}
