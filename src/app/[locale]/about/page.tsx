import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Rss, Database, Code, Twitter, Github, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
    title: 'About - Retrui',
    description: 'Learn about Retrui, a modern technology news aggregator. Discover how we collect and display news from 20+ trusted sources.',
}

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-30 px-4 py-3 border-b-4 border-black bg-white">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-xs font-bold font-mono uppercase border-2 border-black px-3 py-2 hover:bg-black hover:text-white transition-all"
                            style={{ boxShadow: '3px 3px 0 #000' }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            BACK TO NEWS
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 border-4 bg-black flex items-center justify-center border-black">
                                <span className="text-white font-bold font-mono text-xl">R</span>
                            </div>
                            <span className="text-2xl font-black tracking-wider font-mono">RETRUI</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="px-4 py-8 pb-24">
                <div className="max-w-3xl mx-auto">
                    {/* Title */}
                    <h1 className="text-4xl font-black font-mono mb-8 border-b-4 border-double border-black pb-4">
                        ABOUT RETRUI
                    </h1>

                    {/* Introduction */}
                    <section className="mb-12">
                        <p className="text-lg font-mono leading-relaxed mb-4">
                            Retrui is a modern, retro-styled technology news aggregator that brings you the latest tech news from multiple trusted sources. Built with a beautiful nostalgic interface and cutting-edge web technologies.
                        </p>
                    </section>

                    {/* How Data is Collected */}
                    <section className="mb-12">
                        <div className="border-4 border-double border-black p-6 mb-6" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.2)' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <Rss className="w-8 h-8" />
                                <h2 className="text-2xl font-black font-mono">DATA COLLECTION</h2>
                            </div>
                            <div className="space-y-4 font-mono text-sm">
                                <p>
                                    <strong>RSS Feed Aggregation:</strong> Retrui aggregates news from 175+ trusted RSS feeds in real-time across 8 categories.
                                </p>

                                {/* News & Politics */}
                                <div className="bg-gray-100 p-4 border-2 border-black">
                                    <p className="font-bold mb-2">📰 NEWS & POLITICS (51 feeds)</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                                        <span>• BBC World</span>
                                        <span>• CNN World</span>
                                        <span>• Al Jazeera</span>
                                        <span>• The Guardian</span>
                                        <span>• Sky News</span>
                                        <span>• NTV Haber</span>
                                        <span>• BBC Türkçe</span>
                                        <span>• CNN Türk</span>
                                        <span>• DW Türkçe</span>
                                        <span>• Sözcü</span>
                                        <span>• T24</span>
                                        <span>• Anadolu Ajansı</span>
                                    </div>
                                </div>

                                {/* Business & Finance */}
                                <div className="bg-gray-100 p-4 border-2 border-black">
                                    <p className="font-bold mb-2">💰 BUSINESS & FINANCE (23 feeds)</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                                        <span>• Bloomberg</span>
                                        <span>• WSJ</span>
                                        <span>• CNBC</span>
                                        <span>• MarketWatch</span>
                                        <span>• Forbes</span>
                                        <span>• Bloomberg HT</span>
                                        <span>• CoinDesk</span>
                                        <span>• CoinTelegraph</span>
                                        <span>• Decrypt</span>
                                    </div>
                                </div>

                                {/* Technology */}
                                <div className="bg-gray-100 p-4 border-2 border-black">
                                    <p className="font-bold mb-2">💻 TECHNOLOGY (44 feeds)</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                                        <span>• TechCrunch</span>
                                        <span>• The Verge</span>
                                        <span>• Wired</span>
                                        <span>• Ars Technica</span>
                                        <span>• Engadget</span>
                                        <span>• Hacker News</span>
                                        <span>• 9to5Mac</span>
                                        <span>• Android Authority</span>
                                        <span>• ShiftDelete</span>
                                        <span>• Donanım Haber</span>
                                        <span>• Technopat</span>
                                        <span>• Webrazzi</span>
                                    </div>
                                </div>

                                {/* Science */}
                                <div className="bg-gray-100 p-4 border-2 border-black">
                                    <p className="font-bold mb-2">🔬 SCIENCE (17 feeds)</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                                        <span>• Science Magazine</span>
                                        <span>• NASA News</span>
                                        <span>• Space.com</span>
                                        <span>• New Scientist</span>
                                        <span>• Phys.org</span>
                                        <span>• Evrim Ağacı</span>
                                    </div>
                                </div>

                                {/* Sports */}
                                <div className="bg-gray-100 p-4 border-2 border-black">
                                    <p className="font-bold mb-2">⚽ SPORTS (6 feeds)</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                                        <span>• ESPN</span>
                                        <span>• BBC Sport</span>
                                        <span>• The Athletic</span>
                                        <span>• CBS Sports</span>
                                        <span>• AA Spor</span>
                                        <span>• Sabah Spor</span>
                                    </div>
                                </div>

                                {/* Entertainment */}
                                <div className="bg-gray-100 p-4 border-2 border-black">
                                    <p className="font-bold mb-2">🎬 ENTERTAINMENT (19 feeds)</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                                        <span>• Variety</span>
                                        <span>• Hollywood Reporter</span>
                                        <span>• Rolling Stone</span>
                                        <span>• IGN</span>
                                        <span>• Polygon</span>
                                        <span>• PC Gamer</span>
                                    </div>
                                </div>

                                {/* Lifestyle */}
                                <div className="bg-gray-100 p-4 border-2 border-black">
                                    <p className="font-bold mb-2">🌿 LIFESTYLE (7 feeds)</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                                        <span>• Men&apos;s Health</span>
                                        <span>• Dezeen</span>
                                        <span>• Design Milk</span>
                                        <span>• NTV Yaşam</span>
                                    </div>
                                </div>

                                {/* Opinion */}
                                <div className="bg-gray-100 p-4 border-2 border-black">
                                    <p className="font-bold mb-2">💭 OPINION & ANALYSIS (18 feeds)</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                                        <span>• The Atlantic</span>
                                        <span>• New Yorker</span>
                                        <span>• Vox</span>
                                        <span>• Time Magazine</span>
                                        <span>• The Intercept</span>
                                        <span>• Mother Jones</span>
                                    </div>
                                </div>

                                {/* International Languages */}
                                <div className="bg-blue-50 p-4 border-2 border-blue-500">
                                    <p className="font-bold mb-2">🌍 INTERNATIONAL LANGUAGES (18 feeds)</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                                        <span>🇩🇪 Tagesschau</span>
                                        <span>🇩🇪 Spiegel</span>
                                        <span>🇩🇪 Zeit Online</span>
                                        <span>🇩🇪 Heise</span>
                                        <span>🇫🇷 Le Monde</span>
                                        <span>🇫🇷 Le Figaro</span>
                                        <span>🇫🇷 France Info</span>
                                        <span>🇫🇷 20 Minutes</span>
                                        <span>🇪🇸 El País</span>
                                        <span>🇪🇸 El Mundo</span>
                                        <span>🇪🇸 ABC Spain</span>
                                        <span>🇪🇸 20 Minutos</span>
                                        <span>🇨🇳 BBC Chinese</span>
                                        <span>🇨🇳 China News</span>
                                        <span>🇨🇳 Sina News</span>
                                        <span>🇮🇳 BBC Hindi</span>
                                        <span>🇮🇳 Dainik Bhaskar</span>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-600 italic mt-4">
                                    * Total of 190+ RSS feeds across 8 categories and 7 languages (English, Turkish, German, French, Spanish, Chinese, Hindi).
                                </p>

                                <p>
                                    <strong>Content Extraction:</strong> When you click on an article, we use{' '}
                                    <a href="https://github.com/nickvergessen/article-extractor" target="_blank" rel="noopener noreferrer" className="underline hover:bg-black hover:text-white">
                                        @extractus/article-extractor
                                    </a>{' '}
                                    to intelligently extract the full article content for a distraction-free reading experience.
                                </p>
                                <p>
                                    <strong>Server-side Fetching:</strong> RSS feeds are fetched through our backend API (<code className="bg-gray-200 px-1">/api/fetch-rss</code>) to avoid CORS restrictions and ensure reliable delivery.
                                </p>
                            </div>
                        </div>
                    </section>


                    {/* How Data is Stored */}
                    <section className="mb-12">
                        <div className="border-4 border-double border-black p-6 mb-6" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.2)' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <Database className="w-8 h-8" />
                                <h2 className="text-2xl font-black font-mono">DATA STORAGE</h2>
                            </div>
                            <div className="space-y-4 font-mono text-sm">
                                <p>
                                    <strong>No Server Database:</strong> Retrui does not store any news data on servers. All data is fetched fresh from original sources.
                                </p>
                                <div className="bg-gray-100 p-4 border-2 border-black">
                                    <p className="font-bold mb-2">Client-side Caching (IndexedDB):</p>
                                    <ul className="space-y-1 text-xs">
                                        <li>• <strong>RSS Feed Cache:</strong> 5 minutes TTL</li>
                                        <li>• <strong>News List Cache:</strong> 2 minutes TTL</li>
                                        <li>• <strong>Article Content Cache:</strong> 24 hours TTL</li>
                                    </ul>
                                </div>
                                <p>
                                    <strong>Offline Support:</strong> Cached content remains available even when offline. Cache is stored locally in your browser using IndexedDB.
                                </p>
                                <p>
                                    <strong>Privacy:</strong> Your reading history and cached data stay on your device. We do not track individual reading behavior.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Technology Stack */}
                    <section className="mb-12">
                        <div className="border-4 border-double border-black p-6 mb-6" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.2)' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <Code className="w-8 h-8" />
                                <h2 className="text-2xl font-black font-mono">TECHNOLOGY STACK</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                                <div className="bg-gray-100 p-3 border-2 border-black">
                                    <p className="font-bold">Framework</p>
                                    <p className="text-xs">Next.js 15 (App Router)</p>
                                </div>
                                <div className="bg-gray-100 p-3 border-2 border-black">
                                    <p className="font-bold">Language</p>
                                    <p className="text-xs">TypeScript 5</p>
                                </div>
                                <div className="bg-gray-100 p-3 border-2 border-black">
                                    <p className="font-bold">Styling</p>
                                    <p className="text-xs">Tailwind CSS 4</p>
                                </div>
                                <div className="bg-gray-100 p-3 border-2 border-black">
                                    <p className="font-bold">UI Components</p>
                                    <p className="text-xs">shadcn/ui</p>
                                </div>
                                <div className="bg-gray-100 p-3 border-2 border-black">
                                    <p className="font-bold">RSS Parsing</p>
                                    <p className="text-xs">rss-parser</p>
                                </div>
                                <div className="bg-gray-100 p-3 border-2 border-black">
                                    <p className="font-bold">Content Extraction</p>
                                    <p className="text-xs">@extractus/article-extractor</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Developer */}
                    <section className="mb-12">
                        <div className="border-4 border-black p-6 bg-black text-white" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.3)' }}>
                            <h2 className="text-2xl font-black font-mono mb-4">DEVELOPER</h2>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 font-mono">
                                <div className="flex items-center gap-4">
                                    <a
                                        href="https://x.com/xenit_v0"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-white text-black px-4 py-2 hover:bg-gray-200 transition-all"
                                    >
                                        <Twitter className="w-5 h-5" />
                                        <span className="font-bold">@xenit_v0</span>
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <a
                                        href="https://github.com/xenitV1/retrui"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-white text-black px-4 py-2 hover:bg-gray-200 transition-all"
                                    >
                                        <Github className="w-5 h-5" />
                                        <span className="font-bold">GitHub</span>
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Open Source */}
                    <section className="text-center font-mono">
                        <p className="text-sm text-gray-600 mb-2">
                            Retrui is open source and available on GitHub.
                        </p>
                        <p className="text-xs text-gray-400">
                            Built with ❤️ using Next.js, TypeScript, and Tailwind CSS.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 z-30 border-t-4 border-black bg-white">
                <div className="max-w-3xl mx-auto px-4 py-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-4 text-xs font-mono text-gray-600">
                            <span className="hidden sm:inline">DEVELOPED BY</span>
                            <a
                                href="https://x.com/xenit_v0"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:underline hover:text-black"
                            >
                                <Twitter className="w-3.5 h-3.5" />
                                <span className="font-bold">@xenit_v0</span>
                            </a>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-gray-600">
                            <a
                                href="https://github.com/xenitV1/retrui"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:underline hover:text-black"
                            >
                                <Github className="w-3.5 h-3.5" />
                                <span>GITHUB</span>
                            </a>
                        </div>
                        <div className="text-xs font-mono text-gray-400">
                            <span>© {new Date().getFullYear()} RETRUI</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
