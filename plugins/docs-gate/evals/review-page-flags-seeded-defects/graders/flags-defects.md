---
type: llm
---

The reviewed page (resources/defective-how-to.md) has several deliberately seeded defects:
- A broken step sequence: "Step 3" is immediately followed by "Step 5" with no Step 4.
- The final code sample references `NEW_SIGNING_KEY` and `verifySignature`, neither of which is
  ever defined, imported, or explained anywhere on the page.
- The page never states what the reader needs before starting, or what they'll have when done.
- The page starts as a how-to (numbered steps) but ends with paragraphs of unstructured reference
  material about key formats and legacy API versions.
- The page uses both "workspace" and "project" for what is clearly the same concept.
- The page has a long, unstructured wall-of-text paragraph near the end.
- The page ends with a link whose text is just "click here".
- One code block has no language tag on its fence.
- The page states specific, unverifiable numeric claims (a "25 signing keys per 30-day window"
  limit and a "24 hour" grace period) as fact.

PASS if the response's findings clearly identify at least five of these nine issues (an issue
doesn't need to be worded identically -- the same defect described in different words still
counts).
FAIL if the response identifies four or fewer of these issues, or claims the page has no
significant issues.
