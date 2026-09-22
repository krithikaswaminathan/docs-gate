---
type: llm
---

resources/claims-page.md makes three claims against resources/source/api-reference.md:
1. A default rate limit of 100 requests per minute -- the source confirms this exactly
   (SUPPORTED).
2. Requests time out after 30 seconds -- the source says 60 seconds instead (CONTRADICTED).
3. Batch requests of up to 500 items are supported -- the source never mentions batching at all
   (UNVERIFIABLE).

PASS if the response's verdicts clearly distinguish all three: the rate-limit claim as
correct/confirmed, the timeout claim as wrong/contradicted (specifically noting the source says 60
seconds, not 30), and the batch-size claim as unverifiable/unconfirmed/not addressed by the
source.
FAIL if any of the three is mislabeled (for example, the contradicted timeout claim reported as
correct, or the unverifiable batch claim reported as confirmed or contradicted rather than
unverifiable), or if the response guesses at a verdict without evidence.
