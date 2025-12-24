import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { type Locale } from '@/i18n/config'
import { NewsListSchema } from '@/components/news-schema'
import { ShareButtons } from '@/components/share-buttons'

interface Props {
  params: Promise<{
    locale: Locale
    slug: string
  }>
}

/**
 * SEO: Generate dynamic metadata for each news item
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  let news = await prisma.news.findUnique({
    where: { slug }
  })

  // Fallback: If not found by exact slug, try finding by matching the title part of the slug
  if (!news) {
    // Slug format is: title-slug-hash (e.g., "some-title-ab123")
    // Retrieve the base part (title-slug) by removing the last segment
    const slugParts = slug.split('-')
    if (slugParts.length > 1) {
      // Remove the hash part
      slugParts.pop()
      const titleSlug = slugParts.join('-')

      // Try to find a news item that starts with this title slug
      // This is a "fuzzy" match to recover from mismatched hashes
      const potentialMatch = await prisma.news.findFirst({
        where: {
          slug: {
            startsWith: titleSlug
          }
        }
      })

      if (potentialMatch) {
        news = potentialMatch
      }
    }
  }

  if (!news) return { title: 'News Not Found' }

  const baseUrl = 'https://retrui.vercel.app'

  return {
    title: `${news.title} | Retrui News`,
    description: news.description?.substring(0, 160),
    openGraph: {
      title: news.title,
      description: news.description?.substring(0, 160) || '',
      url: `${baseUrl}/${news.language}/news/${news.slug}`,
      type: 'article',
      publishedTime: news.publishedAt.toISOString(),
      authors: news.author ? [news.author] : [],
      section: news.category,
    },
    alternates: {
      canonical: `${baseUrl}/${news.language}/news/${news.slug}`,
    }
  }
}

/**
 * News Detail Page (Permalink)
 */
export default async function NewsDetailPage({ params }: Props) {
  const { slug, locale } = await params

  let news = await prisma.news.findUnique({
    where: { slug }
  })

  // Fallback: If not found by exact slug, try finding by matching the title part of the slug
  if (!news) {
    const slugParts = slug.split('-')
    if (slugParts.length > 1) {
      slugParts.pop()
      const titleSlug = slugParts.join('-')

      const potentialMatch = await prisma.news.findFirst({
        where: {
          slug: {
            startsWith: titleSlug
          }
        }
      })

      if (potentialMatch) {
        news = potentialMatch
      }
    }
  }

  if (!news) {
    notFound()
  }

  // Schema data for SEO
  const schemaData = {
    title: news.title,
    url: news.url,
    position: 1
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href={`/${locale}`} className="flex items-center gap-3 group">
              <div className="w-12 h-12 border-4 border-double border-black bg-black flex items-center justify-center group-hover:bg-white transition-colors">
                <span className="text-white font-black font-mono text-2xl group-hover:text-black transition-colors">R</span>
              </div>
              <div>
                <h1 className="text-2xl font-black font-mono text-black tracking-widest">RETRUI</h1>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">NEWS PORTAL</p>
              </div>
            </a>

            {/* Back to Home */}
            <a
              href={`/${locale}`}
              className="px-4 py-2 border-2 border-black text-black font-mono font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors"
            >
              ← Back to News
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <NewsListSchema items={[schemaData]} />

        <article className="border-4 border-black bg-white">
          {/* Category & Date Bar */}
          <div className="bg-black text-white px-4 py-2 flex items-center justify-between">
            <span className="font-mono font-bold uppercase text-sm tracking-wider">{news.category}</span>
            <time className="font-mono text-sm" dateTime={news.publishedAt.toISOString()}>
              {new Date(news.publishedAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>

          {/* Article Content */}
          <div className="p-6 md:p-8">
            {/* Title */}
            <h1 className="text-2xl md:text-4xl font-black font-mono text-black leading-tight uppercase tracking-tight mb-4">
              {news.title}
            </h1>

            {/* Source & Author */}
            <div className="flex items-center gap-2 text-sm font-mono text-gray-600 mb-6 pb-4 border-b-2 border-gray-200">
              <span className="font-bold">SOURCE:</span>
              <span>{news.source}</span>
              {news.author && (
                <>
                  <span className="text-gray-400">|</span>
                  <span className="font-bold">BY:</span>
                  <span>{news.author}</span>
                </>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none font-mono text-gray-800 leading-relaxed">
              {news.content ? (
                <div dangerouslySetInnerHTML={{ __html: news.content }} />
              ) : (
                <p className="text-lg">{news.description}</p>
              )}
            </div>

            {/* Share & Read Original */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <ShareButtons url={`/${locale}/news/${news.slug}`} title={news.title} />
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-black text-white font-mono font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                  Read Original Article →
                </a>
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-2 border-black bg-black flex items-center justify-center">
                <span className="text-white font-black font-mono text-sm">R</span>
              </div>
              <span className="font-mono font-bold text-black">RETRUI NEWS PORTAL</span>
            </div>
            <div className="font-mono text-sm text-gray-600">
              © {new Date().getFullYear()} Retrui. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
