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
  const now = new Date().toISOString()

  // Build XML sitemap
  // Google mostly ignores changefreq and priority, focusing on lastmod
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${locales.map(locale => `
  <url>
    <loc>${baseUrl}/${locale}</loc>
    <lastmod>${now}</lastmod>
    ${locales.map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${baseUrl}/${l}"/>`).join('\n    ')}
  </url>
  <url>
    <loc>${baseUrl}/${locale}/about</loc>
    <lastmod>${now}</lastmod>
    ${locales.map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${baseUrl}/${l}/about"/>`).join('\n    ')}
  </url>`).join('')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
