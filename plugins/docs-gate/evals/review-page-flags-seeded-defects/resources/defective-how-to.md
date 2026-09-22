<!-- SYNTHETIC FIXTURE: written for docs-gate testing only. Not real product documentation. -->
<!-- Seeded defects (for checking review-page's output against, don't read this comment as part
     of the "page" — it exists only so a human can grade the review):
     1. No prerequisites or stated outcome
     2. Content-type drift: a how-to that becomes reference-style mid-page
     3. Steps skip from "3" to "5" with no step 4 — an incomplete/broken sequence
     4. Terminology inconsistency: "workspace" and "project" used for the same concept
     5. A code block with no language tag
     6. A code block that references a variable never defined in any earlier step
     7. A cross-reference with non-descriptive anchor text ("click here")
     8. A wall-of-text paragraph with no structure
     9. An unverifiable factual claim about a rate limit -->

# Rotating your workspace's signing key

Signing keys are used to verify webhook payloads. This guide covers key rotation.

## Step 1: Open the dashboard

Go to the dashboard and select your project from the top nav.

## Step 2: Navigate to Security settings

Click **Security**, then **Signing keys**.

## Step 3: Generate a new key

Click **Generate new key**. The old key stays valid for 24 hours so in-flight webhook deliveries
using it still verify.

## Step 5: Update your webhook handler

Update your handler to use `NEW_SIGNING_KEY` for verification going forward. Every workspace can
have at most 25 signing keys generated per rolling 30-day window, though most teams never come
close to that.

```
const isValid = verifySignature(payload, NEW_SIGNING_KEY);
```

The signing key system supports HMAC-SHA256 and, for legacy projects created before API version
2019-01, HMAC-SHA1. New workspaces are created on the current key format automatically, and the
project settings page shows which format your workspace currently uses along with a migration
path if you're still on the legacy format, which most long-lived accounts should check periodically
since legacy format support may be deprecated in a future API version without much additional
notice beyond what's already been communicated through the usual channels teams are expected to
monitor.

For more on webhook delivery guarantees, click here.
