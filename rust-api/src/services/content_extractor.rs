use crate::models::{errors::ApiError, responses::ExtractedContent};
use readability::extractor;
use reqwest::Client;
// scraper is available if needed for custom HTML parsing

lazy_static::lazy_static! {
    /// Global HTTP client for content fetching
    static ref HTTP_CLIENT: Client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .timeout(std::time::Duration::from_secs(30))
        .gzip(true)
        .brotli(true)
        .build()
        .expect("Failed to create HTTP client");
}

/// Extract article content from URL using Mozilla Readability algorithm
pub async fn extract_article(url: &str) -> Result<ExtractedContent, ApiError> {
    tracing::debug!("Extracting content from: {}", url);

    // Fetch HTML content
    let html = HTTP_CLIENT
        .get(url)
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                ApiError::Timeout
            } else if e.is_status() {
                if let Some(status) = e.status() {
                    if status == 404 {
                        ApiError::NotFound
                    } else {
                        ApiError::Network(format!("HTTP {}", status))
                    }
                } else {
                    ApiError::Network(e.to_string())
                }
            } else {
                ApiError::Network(e.to_string())
            }
        })?
        .text()
        .await
        .map_err(|e| ApiError::Network(format!("Failed to read response: {}", e)))?;

    // Parse URL for readability extractor
    let parsed_url = url::Url::parse(url).map_err(|_| ApiError::InvalidUrl)?;

    // Extract article content using readability
    let product = extractor::extract(&mut html.as_bytes(), &parsed_url).map_err(|e| {
        tracing::error!("Readability extraction failed: {:?}", e);
        ApiError::InvalidFeed("Failed to extract article content".to_string())
    })?;

    // Clean text (remove excessive whitespace, normalize)
    let text = clean_text(&product.text);

    // Calculate token estimate: Math.ceil(text.length / 4)
    // In Rust: (text.len() + 3) / 4 is equivalent to Math.ceil(text.len() / 4)
    let tokens_used = (text.len() + 3) / 4;

    tracing::info!(
        "Successfully extracted content from {}: {} chars, {} tokens",
        url,
        text.len(),
        tokens_used
    );

    Ok(ExtractedContent {
        title: product.title,
        url: url.to_string(),
        html: product.content,
        text,
        published_time: None, // Readability crate doesn't extract this
        author: None,         // Would require custom extraction
        tokens_used,
    })
}

/// Clean extracted text
///
/// - Trims lines
/// - Removes empty lines
/// - Normalizes multiple consecutive newlines to maximum 2
fn clean_text(text: &str) -> String {
    text.lines()
        .map(|line| line.trim())
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
        .replace("\n\n\n", "\n\n") // Replace 3+ newlines with 2
        .trim()
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clean_text() {
        let input = "  Line 1  \n\n  Line 2  \n\n\n\n  Line 3  \n  ";
        let expected = "Line 1\n\nLine 2\n\nLine 3";
        assert_eq!(clean_text(input), expected);
    }

    #[test]
    fn test_clean_text_empty_lines() {
        let input = "Line 1\n\n\n\nLine 2\n\n";
        let expected = "Line 1\n\nLine 2";
        assert_eq!(clean_text(input), expected);
    }

    #[test]
    fn test_token_calculation() {
        let text = "This is a test";
        let tokens = (text.len() + 3) / 4;
        // 14 chars -> (14 + 3) / 4 = 4 tokens
        assert_eq!(tokens, 4);

        // Verify it matches Math.ceil(14 / 4) = Math.ceil(3.5) = 4
        let expected = (text.len() as f64 / 4.0).ceil() as usize;
        assert_eq!(tokens, expected);
    }

    #[tokio::test]
    #[ignore] // Requires network access
    async fn test_extract_article_real_url() {
        // Test with a real article (this might be flaky due to network)
        let result = extract_article("https://example.com").await;
        // We just check it doesn't panic; result might be Ok or Err depending on network
        let _ = result;
    }

    #[test]
    fn test_http_client_initialization() {
        // Ensure HTTP client is properly created
        assert!(HTTP_CLIENT.get("https://example.com").build().is_ok());
    }
}
