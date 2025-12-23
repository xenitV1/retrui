/**
 * i18n Configuration
 * Supported languages for the application
 */

export const locales = ['en', 'tr', 'de', 'fr', 'es', 'zh', 'hi'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

// Locale display names (in their native language)
export const localeNames: Record<Locale, string> = {
    en: 'English',
    tr: 'Türkçe',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
    zh: '中文',
    hi: 'हिन्दी',
}

// Map Accept-Language codes to our locales
export const languageMapping: Record<string, Locale> = {
    'en': 'en',
    'en-US': 'en',
    'en-GB': 'en',
    'tr': 'tr',
    'tr-TR': 'tr',
    'de': 'de',
    'de-DE': 'de',
    'de-AT': 'de',
    'de-CH': 'de',
    'fr': 'fr',
    'fr-FR': 'fr',
    'fr-CA': 'fr',
    'fr-BE': 'fr',
    'es': 'es',
    'es-ES': 'es',
    'es-MX': 'es',
    'es-AR': 'es',
    'zh': 'zh',
    'zh-CN': 'zh',
    'zh-TW': 'zh',
    'zh-HK': 'zh',
    'hi': 'hi',
    'hi-IN': 'hi',
}

/**
 * Get locale from Accept-Language header
 */
export function getLocaleFromHeader(acceptLanguage: string | null): Locale {
    if (!acceptLanguage) return defaultLocale

    // Parse Accept-Language header and find first matching locale
    const languages = acceptLanguage.split(',').map(lang => {
        const [code] = lang.trim().split(';')
        return code.trim()
    })

    for (const lang of languages) {
        // Try exact match
        if (languageMapping[lang]) {
            return languageMapping[lang]
        }
        // Try base language (e.g., 'en' from 'en-US')
        const base = lang.split('-')[0]
        if (languageMapping[base]) {
            return languageMapping[base]
        }
    }

    return defaultLocale
}

/**
 * Check if a locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
    return locales.includes(locale as Locale)
}
