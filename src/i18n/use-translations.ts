'use client'

import { Locale } from './config'
import translations from './messages'

type Translations = typeof translations.en

/**
 * Get translations for a specific locale
 * Falls back to English if translation is missing
 */
export function useTranslations(locale: Locale) {
  const t = translations[locale] || translations.en

  return {
    t: (key: keyof Translations | string): string => {
      const keys = (key as string).split('.')
      let value: any = t

      for (const k of keys) {
        value = value?.[k]
      }

      return value || key
    },
    locale
  }
}
