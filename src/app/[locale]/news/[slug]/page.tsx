import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { type Locale } from '@/i18n/config'
import { NewsListSchema } from '@/components/news-schema'

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
  const news = await prisma.news.findUnique({
    where: { slug }
  })

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

  const news = await prisma.news.findUnique({
    where: { slug }
  })

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <NewsListSchema items={[schemaData]} />

      <article className="prose prose-invert lg:prose-xl mx-auto border-2 border-primary/20 p-6 rounded-lg bg-black/40 backdrop-blur-sm">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-primary mb-2">
            <span className="uppercase tracking-tighter border border-primary px-2">{news.category}</span>
            <span>•</span>
            <time dateTime={news.publishedAt.toISOString()}>
              {new Date(news.publishedAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight text-white tracking-tighter uppercase italic italic-gradient">
            {news.title}
          </h1>
          {news.author && (
            <p className="text-secondary font-mono italic">Source: {news.source} | By {news.author}</p>
          )}
        </header>

        <div className="text-lg leading-relaxed text-gray-300 font-mono space-y-4">
          {news.content ? (
            <div dangerouslySetInnerHTML={{ __html: news.content }} />
          ) : (
            <p>{news.description}</p>
          )}
        </div>

        <footer className="mt-12 pt-6 border-t border-primary/20">
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-primary text-black font-bold uppercase tracking-tighter hover:bg-white transition-colors"
          >
            Read Original Article
          </a>
        </footer>
      </article>
    </div>
  )
}
