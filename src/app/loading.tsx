/**
 * Loading component shown while page is being generated
 * This provides immediate visual feedback during SSR
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center retro-initial-loading px-4">
      <div className="text-center space-y-3 sm:space-y-4 animate-fade-in retro-loading-container">
        {/* Retro Logo */}
        <div className="inline-block w-16 h-16 sm:w-24 sm:h-24 border-4 sm:border-8 border-double border-black bg-black flex items-center justify-center retro-initial-logo animate-pulse">
          <span className="text-white font-black font-mono text-3xl sm:text-5xl">R</span>
        </div>

        {/* Retro Title */}
        <h1 className="text-3xl sm:text-5xl font-black font-mono text-black tracking-widest retro-initial-title animate-slide-up">
          RETRUI
        </h1>
        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest animate-slide-up" style={{ animationDelay: '0.1s' }}>
          News Portal
        </p>

        {/* Retro Loading Indicator */}
        <div className="mt-6 sm:mt-8 retro-initial-loader">
          <div className="text-sm font-mono font-bold text-black animate-blink">INITIALIZING_</div>
          <div className="space-y-1 mt-2">
            <div className="h-1.5 sm:h-2 bg-black animate-loading-bar" style={{ animationDelay: '0s' }}></div>
            <div className="h-1.5 sm:h-2 bg-black animate-loading-bar" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-1.5 sm:h-2 bg-black animate-loading-bar" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
