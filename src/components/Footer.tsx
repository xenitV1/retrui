'use client'

import { ExternalLink, Github, Twitter, Info } from 'lucide-react'
import Link from 'next/link'

interface FooterProps {
    darkMode?: boolean
}

export default function Footer({ darkMode = false }: FooterProps) {
    return (
        <footer className={`fixed bottom-0 left-0 right-0 z-30 border-t-4 ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-black'}`}>
            <div className="max-w-3xl mx-auto px-4 py-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                    {/* Left - Developer Credits */}
                    <div className={`flex items-center gap-4 text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className="hidden sm:inline">DEVELOPED BY</span>
                        <a
                            href="https://x.com/xenit_v0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1 hover:underline transition-all ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}
                        >
                            <Twitter className="w-3.5 h-3.5" />
                            <span className="font-bold">@xenit_v0</span>
                        </a>
                    </div>

                    {/* Center - Links */}
                    <div className={`flex items-center gap-3 sm:gap-4 text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Link
                            href="/about"
                            className={`flex items-center gap-1 hover:underline transition-all ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}
                        >
                            <Info className="w-3.5 h-3.5" />
                            <span>ABOUT</span>
                        </Link>
                        <a
                            href="https://github.com/xenitV1/retrui"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1 hover:underline transition-all ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}
                        >
                            <Github className="w-3.5 h-3.5" />
                            <span>GITHUB</span>
                        </a>
                    </div>

                    {/* Right - Copyright */}
                    <div className={`text-xs font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span>© {new Date().getFullYear()} RETRUI</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
