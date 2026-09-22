---
type: llm
---

resources/docs/guides/setup.mdx starts as a how-to guide (numbered installation/setup steps) but
then drifts into unrelated explanation-type content (a "Why the SDK is built this way" section
about internal architecture history) that doesn't belong in a how-to guide.

PASS if the response identifies setup.mdx (or "the setup guide") as mixing content types, or
specifically calls out the "Why the SDK is built this way" section as out of place / explanation
content inside a how-to.
FAIL if the response doesn't raise any content-type concern about this page.
