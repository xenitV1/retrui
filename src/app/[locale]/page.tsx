/**
 * Home Page - Server Component
 * Uses streaming SSR for instant initial render
 * News is loaded progressively on the client side
 */
import { Suspense } from 'react'
import NewsClient from '../news-client'
import { type Locale } from '@/i18n/config'

export default async function Home({
    params,
}: {
    params: Promise<{ locale: Locale }>
}) {
    const { locale } = await params

    return (
        <Suspense fallback={<LoadingFallback locale={locale} />}>
            <NewsClient key={locale} initialNews={[]} currentLocale={locale} />
        </Suspense>
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
