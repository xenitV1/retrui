# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-12-24

### Added
- **Rust API Backend** - High-performance Rust backend using Axum framework
  - `POST /api/fetch-rss` - RSS feed parsing with retry logic
  - `POST /api/fetch-content` - Article content extraction
  - `GET /health` - Health check endpoint
- **SSRF Protection** - Comprehensive security against internal resource access
- **Connection Pooling** - Optimized HTTP client performance
- **Exponential Backoff** - Progressive timeout retry strategy (15s → 30s → 45s → 60s)

### Changed
- Next.js now proxies API requests to Rust backend via `next.config.ts` rewrites
- RSS parsing moved from `rss-parser` (Node.js) to `feed-rs` (Rust)
- Content extraction moved from `@extractus/article-extractor` to Rust `readability`

### Performance Improvements
| Metric | Before (Node.js) | After (Rust) | Improvement |
|--------|------------------|--------------|-------------|
| Cold Start | ~500ms | ~5ms | 100x faster |
| Memory | ~150MB | ~10MB | 15x less |
| p50 Latency | ~200ms | ~50ms | 4x faster |
| Throughput | ~50 req/s | ~500 req/s | 10x more |

### Environment Variables
- Added `RUST_API_URL` for production Rust API endpoint
- Added `ALLOWED_ORIGINS` for Rust CORS configuration

## [0.1.1] - 2025-12-23

### Added
- Custom RSS feed management with drag-and-drop support
- Column layout system for customizable news display
- Feed preferences management with user settings
- RSS feeds configuration support
- API security utilities
- Feed settings panel component
- Column settings panel component
- Next.js middleware for request handling
- Loading component for better UX
- Feed health monitoring utilities
- **Multi-language RSS support** (English, Turkish, German, French, Spanish, Chinese, Hindi)
- **i18n internationalization system** with 7 language translations
- **Language switcher component** for UI locale changes
- **24-hour news filter** - only shows articles from the last 24 hours

### Improved
- News client component with enhanced features
- Fetch-rss API route optimizations
- Fetch-content API route improvements
- Home page performance
- IndexedDB utilities
- Toast hook functionality
- TypeScript configuration
- UI components (resizable, dialog, chart)
- Package dependencies updated

### Fixed
- Claude AI configuration directory setup
- Line ending normalization (LF to CRLF)
- **RSS language filter now works correctly in sidebar**
- **Race condition in news fetching** - stale requests are now ignored
- **Multi-column layout now respects sidebar language selection**
- **Duplicate language filtering removed** - was causing news to disappear

### Removed
- Unused skills directory and related files
- Deprecated script result files

### Technical
- Next.js updated to 16.1.1
- React updated to 19.2.3
- Tailwind CSS updated to 4.x
- TypeScript configuration optimized
- Build configuration improvements
- **fetchIdRef mechanism** for race condition prevention
- **defaultLanguage dependency** added to columnNewsData useEffect

## [0.1.0] - 2025-12-22

### Added
- Initial release of Retrui Technology News Portal
- RSS feed aggregation from multiple sources
- Article content extraction using @extractus/article-extractor
- Client-side caching with IndexedDB
- Responsive design with Tailwind CSS
- Dark mode support
- shadcn/ui components integration
- About page with project information
- Site footer with metadata

[Unreleased]: https://github.com/xenitV1/retrui/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/xenitV1/retrui/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/xenitV1/retrui/releases/tag/v0.1.0
