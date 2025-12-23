/**
 * Dynamic News Sitemap
 *
 * Standard sitemap for the Retrui application.
 * This sitemap includes main pages and is refreshed every 5 minutes via ISR.
 *
 * Note: External news sources are NOT included in sitemap as Google only
 * accepts URLs from your own domain in News sitemaps.
 */

import { locales } from '@/i18n/config'

// Revalidate every 5 minutes for fresh news
export const revalidate = 300

export async function GET() {
    const baseUrl = 'https://retrui.vercel.app'

    // Build XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages for each locale -->
  ${locales.map(locale => `
  <url>
    <loc>${baseUrl}/${locale}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>${locale === 'en' ? '1.0' : '0.9'}</priority>
  </url>`).join('')}
  ${locales.map(locale => `
  <url>
    <loc>${baseUrl}/${locale}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
    })
}
