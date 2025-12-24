use axum::{routing::post, Router};
use std::net::SocketAddr;
use tower_http::{timeout::TimeoutLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod models;
mod routes;
mod security;
mod services;
mod utils;

#[tokio::main]
async fn main() {
    // Initialize tracing/logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                // Default log level: info
                "rust_api=debug,tower_http=debug,axum=debug,info".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables from .env file if present
    dotenvy::dotenv().ok();

    // Get port from environment variable or use default
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .expect("PORT must be a valid u16 number");

    tracing::info!("Starting Rust API server...");
    tracing::info!(
        "Environment: {}",
        std::env::var("RUST_ENV").unwrap_or_else(|_| "development".to_string())
    );

    // Build CORS layer
    let cors = security::cors::get_cors_layer();

    // Build application router with all routes
    let app = Router::new()
        // API endpoints
        .route("/api/fetch-rss", post(routes::fetch_rss::handler))
        .route("/api/fetch-content", post(routes::fetch_content::handler))
        // Health check endpoint
        .route(
            "/health",
            axum::routing::get(|| async { "OK" }),
        )
        // Add middleware layers
        .layer(cors)
        .layer(TimeoutLayer::new(std::time::Duration::from_secs(60))) // Global 60s timeout
        .layer(TraceLayer::new_for_http());

    // Bind server to address
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Listening on http://{}", addr);
    tracing::info!("Health check: http://{}/health", addr);
    tracing::info!("RSS endpoint: http://{}/api/fetch-rss", addr);
    tracing::info!("Content endpoint: http://{}/api/fetch-content", addr);

    // Start server
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind to address");

    axum::serve(listener, app)
        .await
        .expect("Server failed to start");
}
