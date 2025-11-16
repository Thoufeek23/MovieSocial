# OMDb API Error Handling

## What is the 522 Error?

The 522 Connection Timed Out error occurs when Cloudflare (which protects the OMDb API) cannot connect to the origin server. This is typically a temporary issue on OMDb's side.

## Implemented Solutions

### 1. Exponential Backoff Retry

- Automatically retries failed requests up to 3 times
- Uses exponential backoff (1s, 2s, 4s delays)
- Respects `Retry-After` headers when present
- Maximum retry delay capped at 10 seconds

### 2. Circuit Breaker Pattern

- Temporarily stops making OMDb calls after 5 consecutive failures
- Prevents overwhelming a failing service
- Automatically resets after 5 minutes
- Configurable via environment variables

### 3. Graceful Fallback

- Always falls back to TMDb ratings when OMDb is unavailable
- App continues to function normally without OMDb data
- Users still get movie ratings from TMDb

## Configuration Options

Add these to your `.env` file:

```bash
# OMDb API Configuration
OMDB_API_KEY=your-api-key-here
OMDB_CONCURRENCY=3                    # Concurrent requests (default: 3)
OMDB_CIRCUIT_BREAKER_THRESHOLD=5      # Failures before circuit opens (default: 5)
OMDB_CIRCUIT_BREAKER_TIMEOUT=5        # Minutes before retry (default: 5)
```

## Error Types Handled

- **522**: Connection timed out (Cloudflare)
- **520-529**: Cloudflare 5xx errors
- **ETIMEDOUT**: Request timeout
- **ECONNABORTED**: Connection aborted
- **ENOTFOUND**: DNS resolution failed
- **ECONNRESET**: Connection reset

## Monitoring

The system logs detailed information about OMDb failures:

- HTTP status codes
- Retry attempts
- Circuit breaker state changes
- Fallback usage

## Manual Recovery

If OMDb issues persist:

1. **Check OMDb Status**: Visit https://www.omdbapi.com/
2. **Verify API Key**: Ensure your OMDb API key is valid
3. **Restart Server**: This resets the circuit breaker
4. **Temporary Disable**: Set `OMDB_API_KEY=` to disable OMDb calls

## Best Practices

- Keep OMDb API key valid and within usage limits
- Monitor logs for persistent issues
- Consider upgrading to OMDb paid plans for better reliability
- TMDb provides good fallback ratings for most movies
