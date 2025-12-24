use rand::Rng;
use std::fmt::Display;
use std::time::Duration;
use tokio::time::sleep;

/// Maximum number of retry attempts (total 4 attempts: initial + 3 retries)
const MAX_RETRIES: usize = 4;

/// Progressive timeouts for each attempt (in seconds)
/// Attempt 0: 15s, Attempt 1: 30s, Attempt 2: 45s, Attempt 3: 60s
const TIMEOUTS: [u64; 4] = [15, 30, 45, 60];

/// Base delays for exponential backoff (in milliseconds)
/// Between attempts: 1s, 2s, 4s
const BASE_DELAYS: [u64; 3] = [1000, 2000, 4000];

/// Jitter range in milliseconds (±200ms)
const JITTER_MS: i64 = 200;

/// Add random jitter to delay to prevent thundering herd problem
fn add_jitter(base_delay_ms: u64) -> Duration {
    let mut rng = rand::thread_rng();
    let jitter = rng.gen_range(-JITTER_MS..=JITTER_MS);
    let total_ms = (base_delay_ms as i64 + jitter).max(0) as u64;
    Duration::from_millis(total_ms)
}

/// Check if error should not be retried (permanent errors)
/// Matches the logic from Next.js implementation
pub fn should_not_retry(error_msg: &str) -> bool {
    let lower = error_msg.to_lowercase();
    lower.contains("not found")
        || lower.contains("404")
        || lower.contains("enotfound") // DNS resolution error
        || lower.contains("invalid url")
        || lower.contains("unsupported protocol")
}

/// Execute an operation with retry logic and exponential backoff with jitter
///
/// # Arguments
/// * `operation` - Async function that takes attempt number and returns Result
///
/// # Returns
/// * `Ok(T)` if operation succeeds
/// * `Err(E)` if all retries are exhausted or permanent error occurs
///
/// # Example
/// ```
/// use std::time::Duration;
///
/// async fn fetch_data(attempt: usize) -> Result<String, String> {
///     // Your fetch logic here
///     Ok("data".to_string())
/// }
///
/// let result = with_retry(fetch_data).await;
/// ```
pub async fn with_retry<F, Fut, T, E>(mut operation: F) -> Result<T, E>
where
    F: FnMut(usize) -> Fut,
    Fut: std::future::Future<Output = Result<T, E>>,
    E: Display,
{
    let mut last_error = None;

    for attempt in 0..MAX_RETRIES {
        match operation(attempt).await {
            Ok(result) => return Ok(result),
            Err(err) => {
                let err_msg = err.to_string();

                // Log error (only in development or on final attempt)
                let is_dev = std::env::var("RUST_ENV")
                    .unwrap_or_else(|_| "development".to_string())
                    == "development";

                if is_dev || attempt == MAX_RETRIES - 1 {
                    tracing::error!(
                        "Retry attempt {}/{}: {}",
                        attempt + 1,
                        MAX_RETRIES,
                        err_msg
                    );
                }

                // Don't retry on permanent errors
                if should_not_retry(&err_msg) {
                    tracing::warn!("Permanent error detected, skipping retries: {}", err_msg);
                    return Err(err);
                }

                last_error = Some(err);

                // Wait before retry (not on last attempt)
                if attempt < MAX_RETRIES - 1 {
                    let delay_idx = attempt.min(BASE_DELAYS.len() - 1);
                    let delay = add_jitter(BASE_DELAYS[delay_idx]);
                    tracing::debug!(
                        "Waiting {:?} before retry attempt {}",
                        delay,
                        attempt + 2
                    );
                    sleep(delay).await;
                }
            }
        }
    }

    // All retries exhausted
    Err(last_error.unwrap())
}

/// Get timeout duration for a specific attempt
pub fn get_timeout(attempt: usize) -> Duration {
    let idx = attempt.min(TIMEOUTS.len() - 1);
    Duration::from_secs(TIMEOUTS[idx])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_should_not_retry() {
        assert!(should_not_retry("404 Not Found"));
        assert!(should_not_retry("Resource not found"));
        assert!(should_not_retry("ENOTFOUND getaddrinfo"));
        assert!(should_not_retry("Invalid URL format"));
        assert!(should_not_retry("Unsupported protocol"));
    }

    #[test]
    fn test_should_retry() {
        assert!(!should_not_retry("Timeout"));
        assert!(!should_not_retry("Connection refused"));
        assert!(!should_not_retry("Network error"));
    }

    #[test]
    fn test_get_timeout() {
        assert_eq!(get_timeout(0), Duration::from_secs(15));
        assert_eq!(get_timeout(1), Duration::from_secs(30));
        assert_eq!(get_timeout(2), Duration::from_secs(45));
        assert_eq!(get_timeout(3), Duration::from_secs(60));
        assert_eq!(get_timeout(10), Duration::from_secs(60)); // Clamps to last value
    }

    #[test]
    fn test_add_jitter() {
        let base = 1000;
        let duration = add_jitter(base);
        let ms = duration.as_millis() as i64;

        // Should be within base ± JITTER_MS
        assert!(ms >= (base as i64 - JITTER_MS));
        assert!(ms <= (base as i64 + JITTER_MS));
    }

    #[tokio::test]
    async fn test_with_retry_success_first_attempt() {
        let mut call_count = 0;
        let result = with_retry(|_attempt| async {
            call_count += 1;
            Ok::<_, String>("success")
        })
        .await;

        assert!(result.is_ok());
        assert_eq!(call_count, 1);
    }

    #[tokio::test]
    async fn test_with_retry_success_after_failures() {
        let mut call_count = 0;
        let result = with_retry(|attempt| async move {
            call_count += 1;
            if attempt < 2 {
                Err("temporary error".to_string())
            } else {
                Ok::<_, String>("success")
            }
        })
        .await;

        assert!(result.is_ok());
        assert_eq!(call_count, 3);
    }

    #[tokio::test]
    async fn test_with_retry_permanent_error() {
        let mut call_count = 0;
        let result = with_retry(|_attempt| async {
            call_count += 1;
            Err::<String, _>("404 Not Found")
        })
        .await;

        assert!(result.is_err());
        assert_eq!(call_count, 1); // Should not retry on 404
    }

    #[tokio::test]
    async fn test_with_retry_all_attempts_fail() {
        let mut call_count = 0;
        let result = with_retry(|_attempt| async {
            call_count += 1;
            Err::<String, _>("temporary error")
        })
        .await;

        assert!(result.is_err());
        assert_eq!(call_count, MAX_RETRIES);
    }
}
