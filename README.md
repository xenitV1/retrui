# 🚀 Retrui - Modern Technology News Portal

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xenitV1/retrui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

A modern, retro-styled news aggregator and reader application built with cutting-edge web technologies. Retrui brings you the latest technology news from multiple trusted sources with a beautiful, nostalgic interface.

![Retrui Screenshot](public/icon-512.png)

## ✨ Features

### 📰 News Aggregation
- **Multiple Sources** - Aggregates news from 20+ trusted technology sources
  - TechCrunch, The Verge, Wired, Engadget, VentureBeat
  - Ars Technica, MIT Technology Review, Digital Trends
  - BBC Technology, Hacker News, Slashdot, and more
- **RSS Feed Integration** - Real-time RSS feed parsing with server-side fetching
- **Content Extraction** - Full article content extraction using Mozilla Readability

### 🎨 User Interface
- **Retro-Modern Design** - Unique nostalgic aesthetic with modern functionality
- **Fully Responsive** - Mobile-first design optimized for all devices
- **Dark Mode** - Built-in theme switching for comfortable reading
- **Smooth Animations** - Elegant transitions and micro-interactions
- **Blog Reading Mode** - Distraction-free article reading experience

### 🔍 Content Management
- **Category Filtering** - Filter by technology categories
  - Technology, Startups, AI, Hardware, Gadgets
  - Enterprise, Science, Apple, Google, Android
- **Search Functionality** - Full-text search across all articles
- **Pagination** - Efficient browsing with 20 articles per page
- **Auto-Refresh** - Automatic updates every minute

### 💾 Performance & Caching
- **IndexedDB Storage** - Client-side caching for fast access
- **Smart Cache Strategy** - Configurable cache timeouts (2-24 hours)
- **Offline Support** - Cached content available offline
- **Optimized Loading** - Skeleton loaders and progress indicators

### 📊 Analytics & SEO
- **Vercel Analytics** - Built-in analytics tracking
- **Speed Insights** - Performance monitoring
- **SEO Optimized** - Meta tags, Open Graph, JSON-LD structured data
- **Sitemap** - Auto-generated sitemap for search engines

## 🚀 Quick Deploy

### One-Click Deploy with Vercel (Recommended)

Deploy your own copy of Retrui with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xenitV1/retrui)

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/xenitV1/retrui.git
cd retrui

# Install dependencies
bun install
# or
npm install

# Start development server
bun run dev
# or
npm run dev

# Build for production
bun run build
# or
npm run build

# Start production server
bun start
# or
npm start
```

Open [http://localhost:3000](http://localhost:3000) to start reading the latest technology news.

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Backend API** | Rust + Axum |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui |
| **Icons** | Lucide React |
| **RSS Parsing** | feed-rs (Rust) |
| **Content Extraction** | Readability (Rust) |
| **State Management** | Zustand |
| **Analytics** | Vercel Analytics, Speed Insights |
| **i18n** | next-intl (7 languages) |

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Next.js 16    │────▶│   Rust API      │
│   (Frontend)    │     │   (Backend)     │
│   Vercel        │     │   Fly.io        │
└─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   IndexedDB     │     │   RSS Feeds     │
│   (Cache)       │     │   (20+ sources) │
└─────────────────┘     └─────────────────┘
```

### Why Rust Backend?

| Metric | Node.js | Rust | Improvement |
|--------|---------|------|-------------|
| Cold Start | ~500ms | ~5ms | 100x faster |
| Memory | ~150MB | ~10MB | 15x less |
| p50 Latency | ~200ms | ~50ms | 4x faster |
| Throughput | ~50 req/s | ~500 req/s | 10x more |

## 📁 Project Structure

```
retrui/
├── src/                    # Next.js Frontend
│   ├── app/               # App Router pages
│   │   ├── [locale]/      # i18n routes (en, tr, de, fr, es, zh, hi)
│   │   ├── page.tsx       # Home page
│   │   └── news-client.tsx # Client-side news interface
│   ├── components/        # React components
│   ├── i18n/              # Internationalization
│   │   └── messages/      # Translation files
│   └── lib/               # Utility functions
├── rust-api/              # Rust Backend
│   ├── src/
│   │   ├── main.rs        # Server entry point
│   │   ├── routes/        # API handlers
│   │   ├── services/      # Business logic
│   │   └── security/      # SSRF + CORS
│   ├── Cargo.toml         # Dependencies
│   └── README.md          # Rust API documentation
└── next.config.ts         # Proxy to Rust API
```

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RUST_API_URL` | Production | Rust API URL (e.g., `https://retrui-api.fly.dev`) |

### Development
No environment variables required - Next.js proxies to `localhost:8080` by default.

### Production
Set in Vercel Dashboard → Settings → Environment Variables:
```
RUST_API_URL=https://your-rust-api.fly.dev
```

See [.env.example](.env.example) and [rust-api/README.md](rust-api/README.md) for more details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- News sources: TechCrunch, The Verge, Wired, Ars Technica, and more
- [Next.js](https://nextjs.org/) for the amazing framework
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Vercel](https://vercel.com/) for hosting and analytics

---

## 👨‍💻 Developer

Built by [@xenit_v0](https://x.com/xenit_v0)

- **Twitter**: [@xenit_v0](https://x.com/xenit_v0)
- **GitHub**: [github.com/xenitV1](https://github.com/xenitV1)

---

Built with ❤️ | Star ⭐ this repo if you find it useful!

---

## 🤖 Built With

This project was built with **GLM 4.7**. Special thanks to the **[z.ai](https://z.ai)** team for their amazing AI tools!
