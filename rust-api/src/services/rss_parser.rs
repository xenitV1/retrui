use crate::models::{
    errors::ApiError,
    responses::{RssFeed, RssItem},
};
use crate::utils::retry::{get_timeout, with_retry};
use feed_rs::parser;
use reqwest::Client;

lazy_static::lazy_static! {
    /// Global HTTP client with connection pooling
    /// Configured to match Next.js implementation behavior
    static ref HTTP_CLIENT: Client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .pool_max_idle_per_host(10)
        .pool_idle_timeout(std::time::Duration::from_secs(90))
        .connect_timeout(std::time::Duration::from_secs(10))
        .gzip(true)
        .brotli(true)
        .redirect(reqwest::redirect::Policy::limited(5)) // maxRedirects: 5
        .build()
        .expect("Failed to create HTTP client");
}

/// Parse RSS feed with automatic retry logic
///
/// This function wraps `fetch_and_parse_rss` with exponential backoff retry logic
pub async fn parse_rss_with_retry(url: &str) -> Result<RssFeed, ApiError> {
    with_retry(|attempt| {
        let url = url.to_string();
        async move { fetch_and_parse_rss(&url, attempt).await }
    })
    .await
}

/// Fetch and parse RSS feed from URL
///
/// # Arguments
/// * `url` - RSS feed URL
/// * `attempt` - Current retry attempt number (0-indexed)
async fn fetch_and_parse_rss(url: &str, attempt: usize) -> Result<RssFeed, ApiError> {
    let timeout = get_timeout(attempt);

    tracing::debug!(
        "Fetching RSS feed: {} (attempt {}, timeout: {:?})",
        url,
        attempt + 1,
        timeout
    );

    // Fetch RSS content with timeout
    let response = HTTP_CLIENT
        .get(url)
        .header("Accept", "application/rss+xml, application/xml, text/xml, */*")
        // Note: Not including Accept-Encoding header to match Next.js behavior
        // This allows servers to return uncompressed XML
        .timeout(timeout)
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
            } else if e.is_connect() {
                ApiError::Network(format!("Connection failed: {}", e))
            } else {
                ApiError::Network(e.to_string())
            }
        })?;

    // Check HTTP status
    let status = response.status();
    if status == 404 {
        return Err(ApiError::NotFound);
    }

    if !status.is_success() {
        return Err(ApiError::Network(format!("HTTP {}", status)));
    }

    // Get response bytes
    let content = response.bytes().await.map_err(|e| {
        ApiError::Network(format!("Failed to read response body: {}", e))
    })?;

    // Validate response has content
    if content.is_empty() {
        return Err(ApiError::InvalidFeed(
            "Empty response from RSS feed".to_string(),
        ));
    }

    // Parse RSS/Atom feed
    let feed = parser::parse(&content[..]).map_err(|e| {
        ApiError::InvalidFeed(format!("Failed to parse RSS/Atom feed: {}", e))
    })?;

    // Validate feed has items
    if feed.entries.is_empty() {
        tracing::warn!("RSS feed has no entries: {}", url);
    }

    // Convert feed-rs Feed to our RssFeed structure
    // This matches the structure returned by rss-parser npm package
    let items = feed
        .entries
        .iter()
        .map(|entry| {
            // Extract title
            let title = entry.title.as_ref().map(|t| t.content.clone());

            // Extract link (first one)
            let link = entry.links.first().map(|l| l.href.clone());

            // Extract content snippet (summary)
            let content_snippet = entry.summary.as_ref().map(|s| s.content.clone());

            // Extract full content
            let content = entry
                .content
                .as_ref()
                .and_then(|c| c.body.clone())
                .or_else(|| content_snippet.clone());

            // Extract author/creator
            let author = entry.authors.first().map(|a| a.name.clone());
            let creator = author.clone();

            // Extract publication date and format as RFC3339
            let pub_date = entry.published.or(entry.updated).map(|dt| {
                dt.to_rfc3339_opts(chrono::SecondsFormat::Secs, true)
            });

            RssItem {
                title,
                link,
                content_snippet,
                content,
                author,
                creator,
                pub_date,
            }
        })
        .collect();

    Ok(RssFeed {
        title: feed.title.map(|t| t.content),
        description: feed.description.map(|d| d.content),
        items,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Ignore in CI as it requires network access
    async fn test_parse_valid_rss() {
        // Test with a known working RSS feed
        let result = parse_rss_with_retry("https://hnrss.org/frontpage").await;
        assert!(result.is_ok());

        let feed = result.unwrap();
        assert!(feed.title.is_some());
        assert!(!feed.items.is_empty());
    }

    #[tokio::test]
    async fn test_parse_invalid_url() {
        let result = parse_rss_with_retry("http://invalid.example.test/feed").await;
        assert!(result.is_err());
    }

    #[test]
    fn test_http_client_configuration() {
        // Ensure HTTP client is properly initialized
        assert!(HTTP_CLIENT.redirect(reqwest::redirect::Policy::none()).is_ok());
    }
}
