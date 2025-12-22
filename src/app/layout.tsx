import { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Viewport configuration for mobile
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://retrui.vercel.app"),
  title: {
    default: "Retrui - Latest Technology News & Updates",
    template: "%s | Retrui",
  },
  description:
    "Stay updated with the latest technology news from top sources including TechCrunch, The Verge, Wired, Ars Technica, and more. Real-time tech news aggregation with full article content.",
  keywords: [
    "tech news",
    "technology news",
    "tech updates",
    "AI news",
    "startups",
    "gadgets",
    "hardware",
    "software",
    "TechCrunch",
    "The Verge",
    "Wired",
    "Ars Technica",
    "VentureBeat",
    "technology",
    "innovation",
    "mobile",
    "programming",
    "developer news",
    "retrui",
    "news aggregator",
  ],
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
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://retrui.vercel.app",
    siteName: "Retrui",
    title: "Retrui - Latest Technology News & Updates",
    description:
      "Stay updated with the latest technology news from top sources. Real-time tech news aggregation with a beautiful retro interface.",
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
    title: "Retrui - Latest Technology News",
    description:
      "Stay updated with the latest technology news from top sources.",
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
    canonical: "/",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Retrui",
              description:
                "Stay updated with the latest technology news from top sources.",
              url: "https://retrui.vercel.app",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://retrui.vercel.app/?search={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
