/**
 * Home Page - Server Component
 * Uses streaming SSR for instant initial render
 * News is loaded progressively on the client side
 */
import { Suspense } from 'react'
import NewsClient from './news-client'

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewsClient initialNews={[]} />
    </Suspense>
  )
}

/**
 * Loading fallback shown during SSR streaming
 * Provides immediate visual feedback while page hydrates
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        {/* Logo */}
        <div className="inline-block w-20 h-20 border-4 border-double border-black bg-black flex items-center justify-center animate-pulse mx-auto">
          <span className="text-white font-black font-mono text-4xl">R</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black font-mono text-black tracking-widest">
          RETRUI
        </h1>
        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
          Loading News Portal...
        </p>

        {/* Loading indicator */}
        <div className="mt-6">
          <div className="text-sm font-mono font-bold text-black animate-pulse">PREPARING_</div>
          <div className="space-y-1 mt-2">
            <div className="h-2 bg-black animate-loading-bar" style={{ animationDelay: '0s' }}></div>
            <div className="h-2 bg-black animate-loading-bar" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-2 bg-black animate-loading-bar" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
