import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Rss, Database, Code, Twitter, Github, ExternalLink, Clock, Trash2, RefreshCw } from 'lucide-react'
import { type Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'

interface Props {
    params: Promise<{
        locale: Locale
    }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params
    const t = messages[locale]

    return {
        title: `${t.about.title} - Retrui`,
        description: t.about.intro,
    }
}

export default async function AboutPage({ params }: Props) {
    const { locale } = await params
    const t = messages[locale]

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-30 px-4 py-3 border-b-4 border-black bg-white">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between">
                        <Link
                            href={`/${locale}`}
                            className="flex items-center gap-2 text-xs font-bold font-mono uppercase border-2 border-black px-3 py-2 hover:bg-black hover:text-white transition-all"
                            style={{ boxShadow: '3px 3px 0 #000' }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t.common.backToNews}
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
                        {t.about.title}
                    </h1>

                    {/* Introduction */}
                    <section className="mb-12">
                        <p className="text-lg font-mono leading-relaxed mb-4">
                            {t.about.intro}
                        </p>
                    </section>

                    {/* How Data is Collected */}
                    <section className="mb-12">
                        <div className="border-4 border-double border-black p-6 mb-6" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.2)' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <Rss className="w-8 h-8" />
                                <h2 className="text-2xl font-black font-mono">{t.about.dataCollection}</h2>
                            </div>
                            <div className="space-y-4 font-mono text-sm">
                                <p>{t.about.dataCollectionDesc}</p>
                            </div>
                        </div>
                    </section>

                    {/* How Data is Stored - UPDATED */}
                    <section className="mb-12">
                        <div className="border-4 border-double border-black p-6 mb-6" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.2)' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <Database className="w-8 h-8" />
                                <h2 className="text-2xl font-black font-mono">{t.about.dataStorage}</h2>
                            </div>
                            <div className="space-y-4 font-mono text-sm">
                                {/* Server Database Section - NEW */}
                                <div className="bg-green-50 p-4 border-2 border-green-600">
                                    <p className="font-bold mb-2 text-green-800">{t.about.serverDatabase}</p>
                                    <p className="text-green-700">{t.about.serverDatabaseDesc}</p>
                                </div>

                                {/* Key Features Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 border-2 border-blue-500">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                            <p className="font-bold text-blue-800">{t.about.fiveDayRetention}</p>
                                        </div>
                                        <p className="text-xs text-blue-700">{t.about.fiveDayRetentionDesc}</p>
                                    </div>
                                    <div className="bg-purple-50 p-4 border-2 border-purple-500">
                                        <div className="flex items-center gap-2 mb-2">
                                            <RefreshCw className="w-5 h-5 text-purple-600" />
                                            <p className="font-bold text-purple-800">{t.about.realTimeUpdates}</p>
                                        </div>
                                        <p className="text-xs text-purple-700">{t.about.realTimeUpdatesDesc}</p>
                                    </div>
                                    <div className="bg-red-50 p-4 border-2 border-red-500">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Trash2 className="w-5 h-5 text-red-600" />
                                            <p className="font-bold text-red-800">{t.about.autoCleanup}</p>
                                        </div>
                                        <p className="text-xs text-red-700">{t.about.autoCleanupDesc}</p>
                                    </div>
                                </div>

                                {/* Client Cache Section */}
                                <div className="bg-gray-100 p-4 border-2 border-black">
                                    <p className="font-bold mb-2">{t.about.clientCache}</p>
                                    <ul className="space-y-1 text-xs">
                                        <li>• {t.about.rssCacheTTL}</li>
                                        <li>• {t.about.newsListCacheTTL}</li>
                                        <li>• {t.about.articleCacheTTL}</li>
                                    </ul>
                                </div>
                                <p>{t.about.offlineSupport}</p>
                                <p>{t.about.privacy}</p>
                            </div>
                        </div>
                    </section>

                    {/* Technology Stack */}
                    <section className="mb-12">
                        <div className="border-4 border-double border-black p-6 mb-6" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.2)' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <Code className="w-8 h-8" />
                                <h2 className="text-2xl font-black font-mono">{t.about.techStack}</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                                <div className="bg-gray-100 p-3 border-2 border-black">
                                    <p className="font-bold">{t.about.framework}</p>
                                    <p className="text-xs">Next.js 15 (App Router)</p>
                                </div>
                                <div className="bg-gray-100 p-3 border-2 border-black">
                                    <p className="font-bold">{t.about.language}</p>
                                    <p className="text-xs">TypeScript 5</p>
                                </div>
                                <div className="bg-gray-100 p-3 border-2 border-black">
                                    <p className="font-bold">{t.about.styling}</p>
                                    <p className="text-xs">Tailwind CSS 4</p>
                                </div>
                                <div className="bg-gray-100 p-3 border-2 border-black">
                                    <p className="font-bold">{t.about.uiComponents}</p>
                                    <p className="text-xs">shadcn/ui</p>
                                </div>
                                <div className="bg-gray-100 p-3 border-2 border-black">
                                    <p className="font-bold">{t.about.database}</p>
                                    <p className="text-xs">Prisma Postgres</p>
                                </div>
                                <div className="bg-gray-100 p-3 border-2 border-black">
                                    <p className="font-bold">{t.about.rssParsing}</p>
                                    <p className="text-xs">rss-parser</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Developer */}
                    <section className="mb-12">
                        <div className="border-4 border-black p-6 bg-black text-white" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.3)' }}>
                            <h2 className="text-2xl font-black font-mono mb-4">{t.about.developer}</h2>
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
                            {t.about.openSource}
                        </p>
                        <p className="text-xs text-gray-400">
                            {t.about.builtWith}
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 z-30 border-t-4 border-black bg-white">
                <div className="max-w-3xl mx-auto px-4 py-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-4 text-xs font-mono text-gray-600">
                            <span className="hidden sm:inline">{t.footer.developedBy.toUpperCase()}</span>
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
                            <span>{t.footer.copyright}</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
