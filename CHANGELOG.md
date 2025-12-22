# Changelog

All notable changes to RETRUI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of RETRUI
- RSS feed aggregation from 20+ technology news sources
- Content extraction with Mozilla Readability
- IndexedDB caching for offline support
- Retro-themed UI with dark mode support
- Category filtering (Technology, AI, Startups, Hardware, etc.)
- Search functionality
- Pagination
- Responsive design for mobile and desktop
- Real-time news updates (auto-refresh every 60 seconds)

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui, Radix UI
- **Data Fetching**: RSS Parser, custom content extractor
- **Storage**: IndexedDB for client-side caching
- **Icons**: Lucide React

### Features
- 20+ RSS feeds from major tech publications
- Smart caching (2 minutes for news, 5 minutes for RSS feeds, 24 hours for content)
- Mobile-responsive sidebar
- Blog reading mode with full article content
- Source attribution
- Dark/Light mode toggle
- Real-time updates

