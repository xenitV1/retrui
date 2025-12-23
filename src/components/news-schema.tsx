'use client'

/**
 * NewsArticle JSON-LD Structured Data Component
 * 
 * Adds schema.org NewsArticle markup for better SEO and rich search results.
 * This helps Google understand the news content and can enable features like:
 * - Rich snippets in search results
 * - Google News eligibility
 * - Top Stories carousel
 */

interface NewsArticleSchemaProps {
    headline: string
    description: string
    url: string
    datePublished: string
    author: string
    source: string
    category: string
}

export function NewsArticleSchema({
    headline,
    description,
    url,
    datePublished,
    author,
    source,
}: NewsArticleSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": headline.substring(0, 110), // Google recommends max 110 chars
        "description": description.substring(0, 200),
        "url": url,
        "datePublished": datePublished,
        "dateModified": datePublished,
        "author": {
            "@type": "Organization",
            "name": author || source,
        },
        "publisher": {
            "@type": "Organization",
            "name": "Retrui",
            "url": "https://retrui.vercel.app",
            "logo": {
                "@type": "ImageObject",
                "url": "https://retrui.vercel.app/icon-512.png",
                "width": 512,
                "height": 512,
            },
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": url,
        },
        "isAccessibleForFree": true,
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}

/**
 * ItemList Schema for news collection
 * Helps Google understand that this is a list of news articles
 */
interface NewsListSchemaProps {
    items: Array<{
        title: string
        url: string
        position: number
    }>
}

export function NewsListSchema({ items }: NewsListSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": items.slice(0, 10).map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "url": item.url,
            "name": item.title,
        })),
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}
