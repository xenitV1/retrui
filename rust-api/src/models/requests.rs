use serde::Deserialize;
use validator::Validate;

/// Request body for RSS feed fetching endpoint
#[derive(Debug, Deserialize, Validate)]
pub struct FetchRssRequest {
    /// RSS feed URL to fetch
    #[validate(url)]
    pub url: String,
}

/// Request body for content extraction endpoint
#[derive(Debug, Deserialize, Validate)]
pub struct FetchContentRequest {
    /// Article URL to extract content from
    #[validate(url)]
    pub url: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_rss_request() {
        let req = FetchRssRequest {
            url: "https://example.com/feed".to_string(),
        };
        assert!(req.validate().is_ok());
    }

    #[test]
    fn test_invalid_rss_request() {
        let req = FetchRssRequest {
            url: "not a url".to_string(),
        };
        assert!(req.validate().is_err());
    }

    #[test]
    fn test_valid_content_request() {
        let req = FetchContentRequest {
            url: "https://example.com/article".to_string(),
        };
        assert!(req.validate().is_ok());
    }
}
