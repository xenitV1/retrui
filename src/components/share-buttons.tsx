'use client'

import { useState } from 'react'
import { Share2, Twitter, Copy, Check, Linkedin, Facebook } from 'lucide-react'

interface ShareButtonsProps {
    url: string
    title: string
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false)

    const shareUrl = `https://retrui.vercel.app${url}`
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(title)

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea')
            textArea.value = shareUrl
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const shareLinks = {
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500 uppercase mr-2">
                <Share2 className="w-4 h-4 inline-block mr-1" />
                Share:
            </span>

            {/* Twitter/X */}
            <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors"
                title="Share on X (Twitter)"
            >
                <Twitter className="w-4 h-4" />
            </a>

            {/* LinkedIn */}
            <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center border-2 border-blue-600 bg-blue-600 text-white hover:bg-white hover:text-blue-600 transition-colors"
                title="Share on LinkedIn"
            >
                <Linkedin className="w-4 h-4" />
            </a>

            {/* Facebook */}
            <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center border-2 border-blue-800 bg-blue-800 text-white hover:bg-white hover:text-blue-800 transition-colors"
                title="Share on Facebook"
            >
                <Facebook className="w-4 h-4" />
            </a>

            {/* Copy Link */}
            <button
                onClick={copyToClipboard}
                className={`w-8 h-8 flex items-center justify-center border-2 transition-all ${copied
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-400 bg-white text-gray-600 hover:border-black hover:text-black'
                    }`}
                title={copied ? 'Copied!' : 'Copy Link'}
            >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
    )
}
