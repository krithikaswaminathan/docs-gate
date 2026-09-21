<!-- SYNTHETIC FIXTURE: written for docs-gate testing only. Not real product documentation.
     This stands in for the "source of truth" fact-checker verifies claims-page.md against. -->

# Acme Widget API reference

## Rate limits

The default rate limit is 100 requests per minute per API key. Contact support to request a
higher limit for your account.

## Timeouts

Requests time out after 60 seconds by default. There is currently no way to configure a longer
timeout per request.

## Authentication

All requests require an `Authorization: Bearer <token>` header. Tokens are issued from the
dashboard and do not expire automatically.
