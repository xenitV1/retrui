use axum::Json;
use validator::Validate;

use crate::models::{
    errors::ApiError, requests::FetchContentRequest, responses::ContentResponse,
};
use crate::security::ssrf::validate_url;
use crate::services::content_extractor::extract_article;

/// POST /api/fetch-content endpoint handler
///
/// Extracts article content from the provided URL
/// with SSRF protection
pub async fn handler(
    Json(payload): Json<FetchContentRequest>,
) -> Result<Json<ContentResponse>, ApiError> {
    tracing::info!("Content extraction request for URL: {}", payload.url);

    // Validate request using validator
    payload
        .validate()
        .map_err(|_| ApiError::InvalidUrl)?;

    // Security validation (SSRF protection)
    let url = validate_url(&payload.url)?;

    // Extract article content
    let content = extract_article(url.as_str()).await?;

    tracing::info!(
        "Successfully extracted content from {}: {} tokens",
        url.as_str(),
        content.tokens_used
    );

    // Return successful response
    Ok(Json(ContentResponse {
        success: true,
        data: Some(content),
        error: None,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_handler_invalid_url() {
        let request = FetchContentRequest {
            url: "not a url".to_string(),
        };

        let result = handler(Json(request)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_handler_blocked_url() {
        let request = FetchContentRequest {
            url: "http://127.0.0.1/article".to_string(),
        };

        let result = handler(Json(request)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_handler_ssrf_protection() {
        let request = FetchContentRequest {
            url: "http://metadata.google.internal/".to_string(),
        };

        let result = handler(Json(request)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    #[ignore] // Requires network access
    async fn test_handler_valid_url() {
        let request = FetchContentRequest {
            url: "https://example.com".to_string(),
        };

        let result = handler(Json(request)).await;
        // Result might be Ok or Err depending on whether example.com has extractable content
        let _ = result;
    }
}
