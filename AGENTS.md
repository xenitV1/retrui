# AGENTS.md - AI Agent Development Guidelines

> **Version**: 1.0.0  
> **Last Updated**: December 2024  
> **Project**: Retrui - Technology News Portal

---

## 📋 Overview

This document provides comprehensive guidelines for AI agents (Gemini, Claude, Cursor, etc.) working on this codebase. All AI assistants should read and follow these guidelines to ensure consistent, high-quality contributions.

---

## 🏗️ Project Architecture

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js (App Router) | 16.x |
| **Backend API** | Rust + Axum | Latest |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | shadcn/ui | Latest |
| **State Management** | React Hooks + IndexedDB | - |
| **i18n** | next-intl | 4.x |
| **Package Manager** | npm / bun | - |

### Directory Structure

```
retrui/
├── src/                       # Next.js Frontend
│   ├── app/                   # App Router
│   │   ├── [locale]/          # i18n routes
│   │   ├── layout.tsx         # Root layout
│   │   └── news-client.tsx    # Main client component
│   ├── components/            # React components
│   ├── i18n/                  # Internationalization
│   │   └── messages/          # Translation files (7 langs)
│   └── lib/                   # Utilities
├── rust-api/                  # Rust Backend
│   ├── src/
│   │   ├── main.rs            # Server entry
│   │   ├── routes/            # API handlers
│   │   │   ├── fetch_rss.rs   # RSS endpoint
│   │   │   └── fetch_content.rs # Content endpoint
│   │   ├── services/          # Business logic
│   │   └── security/          # SSRF + CORS
│   └── Cargo.toml             # Rust dependencies
└── next.config.ts             # Proxy to Rust API
```

---

## 📐 Coding Standards

### TypeScript Guidelines

```typescript
// ✅ DO: Use explicit types
interface NewsItem {
  id: string
  title: string
  description: string
  publishedAt: string
}

// ❌ DON'T: Use 'any' type
const data: any = fetchData() // Avoid this

// ✅ DO: Use proper async/await
async function fetchNews(): Promise<NewsItem[]> {
  const response = await fetch('/api/news')
  return response.json()
}
```

### Component Structure

```tsx
// ✅ Recommended component structure
'use client' // Only if needed

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ComponentProps {
  title: string
  onAction?: () => void
}

export default function Component({ title, onAction }: ComponentProps) {
  const [state, setState] = useState(false)
  
  return (
    <div className="...">
      {/* Component content */}
    </div>
  )
}
```

### Styling Guidelines

1. **Use Tailwind CSS** for all styling
2. **Mobile-first approach**: Start with mobile styles, add `sm:`, `md:`, `lg:` for larger screens
3. **Consistent spacing**: Use Tailwind's spacing scale (e.g., `p-4`, `gap-2`)
4. **Dark mode support**: Include dark mode variants when applicable

```tsx
// ✅ Mobile-first responsive design
<div className="px-3 sm:px-4 py-2 sm:py-3">
  <h1 className="text-xl sm:text-2xl lg:text-3xl">
    {title}
  </h1>
</div>
```

---

## 🔄 Data Flow

### RSS Feed Aggregation (Rust API)

```
User Request → Next.js Proxy → Rust API → feed-rs → Response
                                   ↓
                          External RSS Feeds
                          (20+ sources)
                                   ↓
                            IndexedDB Cache
```

### Content Extraction (Rust API)

```
User Clicks Article → Next.js Proxy → Rust API → Readability → Cache → Display
                                           ↓
                                   Original Article URL
```

### API Proxy Configuration (next.config.ts)

```typescript
async rewrites() {
  const rustApiUrl = process.env.RUST_API_URL || 'http://localhost:8080';
  return [
    { source: '/api/fetch-rss', destination: `${rustApiUrl}/api/fetch-rss` },
    { source: '/api/fetch-content', destination: `${rustApiUrl}/api/fetch-content` },
  ];
}
```

### Caching Strategy

| Cache Type | TTL | Storage |
|------------|-----|---------|
| RSS Feed | 5 minutes | IndexedDB |
| News List | 2 minutes | IndexedDB |
| Article Content | 24 hours | IndexedDB |

---

## ✅ Quality Checklist

Before submitting changes, ensure:

### Code Quality
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Code is formatted properly
- [ ] No unused imports or variables

### Functionality
- [ ] Feature works on mobile devices
- [ ] Feature works in dark mode
- [ ] No console errors in browser

### Documentation
- [ ] Complex functions have comments
- [ ] README updated if needed
- [ ] CHANGELOG updated for significant changes

---

## 🧪 Testing Commands

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# TypeScript type check
npx tsc --noEmit

# Build production
npm run build

# Start development server
npm run dev
```

---

## 🚫 Prohibited Actions

1. **DO NOT** delete or modify `.env` files without explicit permission
2. **DO NOT** push directly to `main` branch without review
3. **DO NOT** install new dependencies without justification
4. **DO NOT** disable ESLint rules globally
5. **DO NOT** use `any` type in TypeScript
6. **DO NOT** commit sensitive data (API keys, passwords)

---

## 📁 Important Files

| File | Purpose | Modify With Care |
|------|---------|------------------|
| `package.json` | Dependencies & scripts | ⚠️ Yes |
| `tsconfig.json` | TypeScript config | ⚠️ Yes |
| `tailwind.config.ts` | Tailwind config | ⚠️ Yes |
| `next.config.ts` | Next.js config + API proxy | ⚠️ Yes |
| `rust-api/Cargo.toml` | Rust dependencies | ⚠️ Yes |
| `rust-api/.env` | Rust API config | ⚠️ Yes |
| `.env.example` | Environment template | ✅ Safe |
| `README.md` | Documentation | ✅ Safe |
| `src/proxy.ts` | i18n middleware | ⚠️ Yes |

---

## 🔗 Related Documents

- **[GEMINI.md](./GEMINI.md)** - Gemini-specific guidelines and configurations
- **[CLAUDE.md](./CLAUDE.md)** - Claude-specific guidelines and configurations

---

## 📞 Contact

- **Developer**: [@xenit_v0](https://x.com/xenit_v0)
- **Repository**: [github.com/xenitV1/retrui](https://github.com/xenitV1/retrui)

---

*Last updated: December 2024*
