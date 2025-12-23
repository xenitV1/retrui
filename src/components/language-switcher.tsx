'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { locales, localeNames, type Locale } from '@/i18n/config'
import { Globe } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface LanguageSwitcherProps {
    currentLocale: Locale
    darkMode?: boolean
}

export function LanguageSwitcher({ currentLocale, darkMode = false }: LanguageSwitcherProps) {
    const router = useRouter()
    const pathname = usePathname()

    const switchLocale = useCallback((newLocale: Locale) => {
        if (newLocale === currentLocale) return

        // Replace current locale in pathname with new locale
        const segments = pathname.split('/')
        segments[1] = newLocale
        const newPath = segments.join('/')

        // Set cookie for persistence
        document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`

        router.push(newPath)
    }, [currentLocale, pathname])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs font-mono border-2 ${darkMode
                            ? 'text-white border-gray-600 bg-gray-800 hover:bg-white hover:text-black'
                            : 'text-black border-black bg-white hover:bg-black hover:text-white'
                        }`}
                >
                    <Globe className="w-3 h-3 mr-1" />
                    {localeNames[currentLocale]}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-mono">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale}
                        onClick={() => switchLocale(locale)}
                        className={`text-xs ${locale === currentLocale ? 'font-bold bg-gray-100' : ''
                            }`}
                    >
                        <span className="mr-2">
                            {locale === 'en' && '🇬🇧'}
                            {locale === 'tr' && '🇹🇷'}
                            {locale === 'de' && '🇩🇪'}
                            {locale === 'fr' && '🇫🇷'}
                            {locale === 'es' && '🇪🇸'}
                            {locale === 'zh' && '🇨🇳'}
                            {locale === 'hi' && '🇮🇳'}
                        </span>
                        {localeNames[locale]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
