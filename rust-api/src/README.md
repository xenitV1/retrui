# Rust API - High-Performance Backend for Retrui

This is a high-performance Rust backend implementation that replaces Next.js API routes (`/api/fetch-rss` and `/api/fetch-content`) with Axum framework.

## Features

- **RSS Feed Parsing**: With retry logic, exponential backoff, and progressive timeouts
- **Content Extraction**: Mozilla Readability-based article extraction
- **SSRF Protection**: Comprehensive security against internal resource access
- **CORS**: Configured for Next.js frontend integration
- **Connection Pooling**: Optimized HTTP client performance
- **Structured Logging**: Detailed tracing with `tracing` crate

## Prerequisites

- Rust 1.70+ (install from https://rustup.rs/)
- Cargo (comes with Rust)

## Windows Build Issue & Solutions

If you encounter file locking errors during build (Error 32: "Dosya başka bir işlem tarafından kullanıldığından..."):

### Solution 1: Windows Defender Exception (Recommended)
1. Open Windows Security
2. Go to "Virus & threat protection" → "Manage settings"
3. Scroll to "Exclusions" → "Add or remove exclusions"
4. Add folder: `C:\Users\Mehmet\Desktop\tech\rust-api`
5. Retry build: `cargo build --release`

### Solution 2: Use WSL (Windows Subsystem for Linux)
```bash
# In WSL terminal
cd /mnt/c/Users/Mehmet/Desktop/tech/rust-api
cargo build --release
```

### Solution 3: Build on Different Path
Move project to C:\temp or another location without long paths:
```bash
move C:\Users\Mehmet\Desktop\tech\rust-api C:\temp\rust-api
cd C:\temp\rust-api
cargo build --release
```

### Solution 4: Disable Incremental Compilation
```bash
set CARGO_INCREMENTAL=0
cargo build --release
```

## Installation

1. Build the project:
```bash
cd rust-api
cargo build --release
```

2. Create `.env` file (already exists):
```env
PORT=8080
RUST_LOG=info
RUST_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,https://retrui.vercel.app
```

## Running Locally

### Development Mode (with hot reload):
```bash
cargo run
```

### Production Mode:
```bash
cargo run --release
```

The server will start on `http://localhost:8080`

## Testing

### Health Check:
```bash
curl http://localhost:8080/health
```

### RSS Feed Endpoint:
```bash
curl -X POST http://localhost:8080/api/fetch-rss \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://hnrss.org/frontpage\"}"
```

### Content Extraction Endpoint:
```bash
curl -X POST http://localhost:8080/api/fetch-content \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://example.com\"}"
```

### Run Unit Tests:
```bash
cargo test
```

### Run Tests with Output:
```bash
cargo test -- --nocapture
```

## Integration with Next.js

The Next.js config has been updated (`next.config.ts`) to proxy requests to Rust API.

### Development Setup:
1. Start Rust API: `cargo run` (in rust-api directory)
2. Start Next.js: `npm run dev` (in main directory)
3. Next.js will proxy `/api/fetch-rss` and `/api/fetch-content` to `http://localhost:8080`

### Environment Variables (Next.js `.env.local`):
```env
RUST_API_URL=http://localhost:8080
```

## Deployment

### Option 1: Fly.io (Recommended)
```bash
# Install flyctl
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login
fly auth login

# Launch app
fly launch --name retrui-api --region iad

# Deploy
fly deploy

# Set secrets
fly secrets set ALLOWED_ORIGINS=https://retrui.vercel.app

# Monitor
fly logs
```

### Option 2: Docker
```bash
# Build image
docker build -t retrui-api .

# Run container
docker run -p 8080:8080 -e PORT=8080 retrui-api
```

### Update Vercel Environment Variables:
- Add `RUST_API_URL=https://retrui-api.fly.io` (or your deployment URL)
- Redeploy Next.js on Vercel

## Performance Expectations

| Metric | Node.js | Rust | Improvement |
|--------|---------|------|-------------|
| Cold Start | ~500ms | ~5ms | 100x faster |
| Memory | ~150MB | ~10MB | 15x less |
| p50 Latency | ~200ms | ~50ms | 4x faster |
| p99 Latency | ~2s | ~500ms | 4x faster |
| Throughput | ~50 req/s | ~500 req/s | 10x more |

## Project Structure

```
rust-api/
├── src/
│   ├── main.rs                # Server entry point
│   ├── routes/                # API endpoint handlers
│   │   ├── fetch_rss.rs
│   │   └── fetch_content.rs
│   ├── services/              # Business logic
│   │   ├── rss_parser.rs
│   │   └── content_extractor.rs
│   ├── security/              # SSRF + CORS
│   │   ├── ssrf.rs
│   │   └── cors.rs
│   ├── models/                # Request/Response types
│   │   ├── requests.rs
│   │   ├── responses.rs
│   │   └── errors.rs
│   └── utils/
│       └── retry.rs           # Exponential backoff
├── Cargo.toml                 # Dependencies
├── .env                       # Environment config
└── README.md
```

## Security Features

### SSRF Protection
Blocks access to:
- Private IP ranges (127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x)
- IPv6 private ranges (::1, fc00:, fe80:)
- Cloud metadata endpoints (metadata.google.internal, metadata.azure.com, 169.254.169.254)
- Dangerous ports (SSH, MySQL, Redis, MongoDB, etc.)

### CORS
- Whitelist-based origin validation
- Configurable via `ALLOWED_ORIGINS` environment variable
- Includes `Vary: Origin` header for proper caching

## Troubleshooting

### Build Fails with "OS Error 32"
- See "Windows Build Issue & Solutions" above

### Port Already in Use
```bash
# Change PORT in .env or:
PORT=8081 cargo run
```

### CORS Errors
- Ensure Next.js frontend is in `ALLOWED_ORIGINS` environment variable
- Check that `RUST_API_URL` in Next.js matches Rust server address

### Dependency Issues
```bash
# Update dependencies
cargo update

# Clean and rebuild
cargo clean && cargo build --release
```

## License

Same as parent project (Retrui)
