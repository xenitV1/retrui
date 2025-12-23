import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocale, getLocaleFromHeader, isValidLocale, type Locale } from '@/i18n/config'

// Paths that should not be localized
const PUBLIC_FILE = /\.(.*)$/
const IGNORED_PATHS = ['_next', 'api', 'favicon.ico', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'manifest.json', 'robots.txt', 'sitemap.xml']

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip public files and API routes
    if (
        PUBLIC_FILE.test(pathname) ||
        IGNORED_PATHS.some(path => pathname.startsWith(`/${path}`))
    ) {
        return NextResponse.next()
    }

    // Check if pathname already has a locale
    const pathnameHasLocale = locales.some(
        locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    if (pathnameHasLocale) {
        // Extract locale from pathname
        const locale = pathname.split('/')[1] as Locale

        // Set locale cookie for future visits
        const response = NextResponse.next()
        response.cookies.set('NEXT_LOCALE', locale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
        })
        return response
    }

    // Determine locale from cookie, Accept-Language header, or default
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
    let locale: Locale

    if (cookieLocale && isValidLocale(cookieLocale)) {
        // Use cookie locale if valid
        locale = cookieLocale
    } else {
        // Detect from Accept-Language header
        const acceptLanguage = request.headers.get('Accept-Language')
        locale = getLocaleFromHeader(acceptLanguage)
    }

    // Redirect to localized path
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${pathname}`

    const response = NextResponse.redirect(url)
    response.cookies.set('NEXT_LOCALE', locale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return response
}

export const config = {
    matcher: [
        // Match all paths including root, except static files and api
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|manifest.json|robots.txt|sitemap.xml).*)',
        // Also explicitly match root path
        '/',
    ],
}
