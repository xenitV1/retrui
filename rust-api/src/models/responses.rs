use serde::Serialize;

/// Response for RSS feed endpoint
#[derive(Debug, Serialize)]
pub struct RssResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<RssFeed>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// RSS feed data structure
#[derive(Debug, Serialize)]
pub struct RssFeed {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub items: Vec<RssItem>,
}

/// Individual RSS feed item
/// Field names match the rss-parser npm package output
#[derive(Debug, Serialize)]
pub struct RssItem {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub link: Option<String>,
    /// Short description/summary
    #[serde(rename = "contentSnippet", skip_serializing_if = "Option::is_none")]
    pub content_snippet: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub creator: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    /// Publication date in RFC3339 format (e.g., "2024-01-15T10:30:00Z")
    #[serde(rename = "pubDate", skip_serializing_if = "Option::is_none")]
    pub pub_date: Option<String>,
}

/// Response for content extraction endpoint
#[derive(Debug, Serialize)]
pub struct ContentResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<ExtractedContent>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Extracted article content
#[derive(Debug, Serialize)]
pub struct ExtractedContent {
    pub title: String,
    pub url: String,
    pub html: String,
    pub text: String,
    #[serde(rename = "publishedTime", skip_serializing_if = "Option::is_none")]
    pub published_time: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    /// Token usage estimate (text.length / 4)
    #[serde(rename = "tokensUsed")]
    pub tokens_used: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rss_response_serialization() {
        let response = RssResponse {
            success: true,
            data: Some(RssFeed {
                title: Some("Test Feed".to_string()),
                description: None,
                items: vec![RssItem {
                    title: Some("Test Item".to_string()),
                    link: Some("https://example.com".to_string()),
                    content_snippet: Some("Snippet".to_string()),
                    content: None,
                    creator: Some("Author".to_string()),
                    author: Some("Author".to_string()),
                    pub_date: Some("2024-01-01T00:00:00Z".to_string()),
                }],
            }),
            error: None,
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("Test Feed"));
        assert!(json.contains("contentSnippet"));
        assert!(json.contains("pubDate"));
    }

    #[test]
    fn test_content_response_serialization() {
        let response = ContentResponse {
            success: true,
            data: Some(ExtractedContent {
                title: "Test Article".to_string(),
                url: "https://example.com".to_string(),
                html: "<p>Content</p>".to_string(),
                text: "Content".to_string(),
                published_time: None,
                author: None,
                tokens_used: 100,
            }),
            error: None,
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("Test Article"));
        assert!(json.contains("tokensUsed"));
    }

    #[test]
    fn test_token_calculation() {
        let text = "This is a test article with some content";
        let tokens_used = (text.len() + 3) / 4; // Matches Math.ceil(length / 4)
        assert_eq!(tokens_used, 11);
    }
}
