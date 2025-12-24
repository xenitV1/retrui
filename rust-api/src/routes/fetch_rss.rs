use axum::Json;
use validator::Validate;

use crate::models::{errors::ApiError, requests::FetchRssRequest, responses::RssResponse};
use crate::security::ssrf::validate_url;
use crate::services::rss_parser::parse_rss_with_retry;

/// POST /api/fetch-rss endpoint handler
///
/// Fetches and parses an RSS feed from the provided URL
/// with retry logic and SSRF protection
pub async fn handler(Json(payload): Json<FetchRssRequest>) -> Result<Json<RssResponse>, ApiError> {
    tracing::info!("RSS fetch request for URL: {}", payload.url);

    // Validate request using validator
    payload
        .validate()
        .map_err(|_| ApiError::InvalidUrl)?;

    // Security validation (SSRF protection)
    let url = validate_url(&payload.url)?;

    // Fetch and parse RSS feed with retry logic
    let feed = parse_rss_with_retry(url.as_str()).await?;

    tracing::info!(
        "Successfully fetched RSS feed: {} ({} items)",
        url.as_str(),
        feed.items.len()
    );

    // Return successful response
    Ok(Json(RssResponse {
        success: true,
        data: Some(feed),
        error: None,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_handler_invalid_url() {
        let request = FetchRssRequest {
            url: "not a url".to_string(),
        };

        let result = handler(Json(request)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_handler_blocked_url() {
        let request = FetchRssRequest {
            url: "http://localhost/feed".to_string(),
        };

        let result = handler(Json(request)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    #[ignore] // Requires network access
    async fn test_handler_valid_url() {
        let request = FetchRssRequest {
            url: "https://hnrss.org/frontpage".to_string(),
        };

        let result = handler(Json(request)).await;
        assert!(result.is_ok());
    }
}
