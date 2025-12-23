/**
 * Home Page - Server Component with SSR for SEO
 * 
 * IMPORTANT: This page fetches initial news on the server side
 * so that Google can crawl and index the content.
 * 
 * Uses ISR (Incremental Static Regeneration) to refresh every 5 minutes.
 */
import { Suspense } from 'react'
import NewsClient from '../news-client'
import { type Locale } from '@/i18n/config'
import { fetchInitialNews } from '@/lib/server-news'
import { NewsListSchema } from '@/components/news-schema'

// ISR: Revalidate every 5 minutes for fresh news
export const revalidate = 300

export default async function Home({
    params,
}: {
    params: Promise<{ locale: Locale }>
}) {
    const { locale } = await params

    // Fetch initial news on the server for SEO
    // This ensures Google can see the content without JavaScript
    const initialNews = await fetchInitialNews(locale)

    // Prepare news items for structured data
    const schemaItems = initialNews.slice(0, 10).map((news, index) => ({
        title: news.title,
        url: news.url,
        position: index + 1,
    }))

    return (
        <>
            {/* Structured Data for SEO */}
            <NewsListSchema items={schemaItems} />

            <Suspense fallback={<LoadingFallback locale={locale} />}>
                <NewsClient key={locale} initialNews={initialNews} currentLocale={locale} />
            </Suspense>
        </>
    )
}


/**
 * Loading fallback shown during SSR streaming
 * Provides immediate visual feedback while page hydrates
 */
function LoadingFallback({ locale }: { locale: Locale }) {
    const loadingTexts: Record<Locale, string> = {
        en: 'Loading News Portal...',
        tr: 'Haber Portalı Yükleniyor...',
        de: 'Nachrichten-Portal wird geladen...',
        fr: 'Chargement du portail...',
        es: 'Cargando portal de noticias...',
        zh: '加载新闻门户...',
        hi: 'समाचार पोर्टल लोड हो रहा है...',
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="text-center space-y-4">
                {/* Logo */}
                <div className="inline-block w-20 h-20 border-4 border-double border-black bg-black flex items-center justify-center animate-pulse mx-auto">
                    <span className="text-white font-black font-mono text-4xl">R</span>
                </div>

                {/* Title */}
                <h1 className="text-4xl font-black font-mono text-black tracking-widest">
                    RETRUI
                </h1>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                    {loadingTexts[locale] || loadingTexts.en}
                </p>

                {/* Loading indicator */}
                <div className="mt-6">
                    <div className="text-sm font-mono font-bold text-black animate-pulse">PREPARING_</div>
                    <div className="space-y-1 mt-2">
                        <div className="h-2 bg-black animate-loading-bar" style={{ animationDelay: '0s' }}></div>
                        <div className="h-2 bg-black animate-loading-bar" style={{ animationDelay: '0.2s' }}></div>
                        <div className="h-2 bg-black animate-loading-bar" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
