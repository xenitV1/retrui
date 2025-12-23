'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
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

    console.log('🌐 [LanguageSwitcher] Render - currentLocale:', currentLocale, 'pathname:', pathname)

    const switchLocale = useCallback((newLocale: Locale) => {
        console.log('🔄 [LanguageSwitcher] switchLocale ÇAĞRILDI')
        console.log('  └─ Mevcut locale:', currentLocale)
        console.log('  └─ Yeni locale:', newLocale)
        console.log('  └─ Mevcut pathname:', pathname)

        // Replace current locale in pathname with new locale
        const segments = pathname.split('/')
        const oldLocale = segments[1]
        segments[1] = newLocale
        const newPath = segments.join('/')

        console.log('  └─ Eski path segmenti:', oldLocale)
        console.log('  └─ Yeni path segmenti:', newLocale)
        console.log('  └─ Oluşturulan yeni path:', newPath)

        // Set cookie for persistence
        document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
        console.log('  └─ Cookie ayarlandı: NEXT_LOCALE=', newLocale)

        console.log('  └─ router.push çağrılıyor:', newPath)
        router.push(newPath)
        console.log('✅ [LanguageSwitcher] switchLocale TAMAMLANDI')
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
