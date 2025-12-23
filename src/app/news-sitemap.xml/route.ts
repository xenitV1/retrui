/**
 * Dynamic News Sitemap
 * 
 * Generates a sitemap with the latest news articles for Google News.
 * This sitemap is refreshed every 5 minutes via ISR.
 * 
 * Google News Sitemap Guidelines:
 * - Max 1000 URLs
 * - Only include articles from last 2 days
 * - Include publication date
 */

import { fetchInitialNews } from '@/lib/server-news'
import { locales, defaultLocale } from '@/i18n/config'

// Revalidate every 5 minutes for fresh news
export const revalidate = 300

export async function GET() {
    const baseUrl = 'https://retrui.vercel.app'

    // Fetch news from server
    const news = await fetchInitialNews(defaultLocale)

    // Build XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <!-- Main pages for each locale -->
  ${locales.map(locale => `
  <url>
    <loc>${baseUrl}/${locale}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>${locale === 'en' ? '1.0' : '0.9'}</priority>
  </url>`).join('')}
  
  <!-- News articles -->
  ${news.slice(0, 50).map(item => `
  <url>
    <loc>${escapeXml(item.url)}</loc>
    <lastmod>${new Date(item.publishedAt).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(item.source)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(item.publishedAt).toISOString()}</news:publication_date>
      <news:title>${escapeXml(item.title)}</news:title>
    </news:news>
  </url>`).join('')}
</urlset>`

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
    })
}

/**
 * Escape special XML characters
 */
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}
