<!-- SYNTHETIC FIXTURE: written for docs-gate testing only. Not real product documentation.
     Seeded claims (for checking fact-checker's output against):
     1. "100 requests per minute" -- SUPPORTED (source/api-reference.md states this exactly)
     2. "time out after 30 seconds" -- CONTRADICTED (source says 60 seconds)
     3. "batch requests up to 500 items" -- UNVERIFIABLE (source never mentions batching) -->

# Acme Widget API: limits and timeouts

The Widget API enforces a default rate limit of 100 requests per minute per API key.

Requests that don't complete in time are dropped: the API times out after 30 seconds.

For high-volume use cases, the API supports batch requests of up to 500 items per call, which can
significantly reduce the number of round trips your integration needs to make.
