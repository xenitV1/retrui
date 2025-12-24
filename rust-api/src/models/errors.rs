use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

/// API error types matching the current Next.js implementation
#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("Invalid URL format")]
    InvalidUrl,

    #[error("Access to internal resources is not allowed")]
    SsrfBlocked,

    #[error("Feed not found")]
    NotFound,

    #[error("Request timeout")]
    Timeout,

    #[error("Invalid RSS feed format: {0}")]
    InvalidFeed(String),

    #[error("Network error: {0}")]
    Network(String),

    #[error("Internal server error")]
    Internal,
}

impl ApiError {
    /// Get HTTP status code for each error type
    /// Matches the status codes from the Next.js API implementation
    fn status_code(&self) -> StatusCode {
        match self {
            Self::InvalidUrl => StatusCode::BAD_REQUEST,  // 400
            Self::SsrfBlocked => StatusCode::FORBIDDEN,   // 403
            Self::NotFound => StatusCode::NOT_FOUND,      // 404
            Self::Timeout => StatusCode::GATEWAY_TIMEOUT, // 504
            Self::InvalidFeed(_) => StatusCode::UNPROCESSABLE_ENTITY, // 422
            Self::Network(_) => StatusCode::BAD_GATEWAY,  // 502
            Self::Internal => StatusCode::INTERNAL_SERVER_ERROR, // 500
        }
    }
}

/// Convert ApiError to HTTP response
/// Returns JSON with structure matching Next.js API: { success: false, error: string, statusCode: number }
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = self.status_code();
        let error_message = self.to_string();

        // Log errors for debugging
        tracing::error!(
            error = %error_message,
            status_code = status.as_u16(),
            "API error occurred"
        );

        let body = Json(json!({
            "success": false,
            "error": error_message,
            "statusCode": status.as_u16(),
        }));

        (status, body).into_response()
    }
}

/// Convert from anyhow::Error
impl From<anyhow::Error> for ApiError {
    fn from(_err: anyhow::Error) -> Self {
        Self::Internal
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_status_codes() {
        assert_eq!(ApiError::InvalidUrl.status_code(), StatusCode::BAD_REQUEST);
        assert_eq!(ApiError::SsrfBlocked.status_code(), StatusCode::FORBIDDEN);
        assert_eq!(ApiError::NotFound.status_code(), StatusCode::NOT_FOUND);
        assert_eq!(ApiError::Timeout.status_code(), StatusCode::GATEWAY_TIMEOUT);
        assert_eq!(
            ApiError::InvalidFeed("test".to_string()).status_code(),
            StatusCode::UNPROCESSABLE_ENTITY
        );
    }

    #[test]
    fn test_error_messages() {
        assert_eq!(ApiError::InvalidUrl.to_string(), "Invalid URL format");
        assert_eq!(
            ApiError::SsrfBlocked.to_string(),
            "Access to internal resources is not allowed"
        );
        assert_eq!(ApiError::NotFound.to_string(), "Feed not found");
    }
}
