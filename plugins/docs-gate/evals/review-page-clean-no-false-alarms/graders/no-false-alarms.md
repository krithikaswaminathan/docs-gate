---
type: llm
---

The reviewed page (resources/clean-tutorial.md) is a well-formed, complete tutorial with no
seeded defects: it states its audience, prerequisites, and outcome; every code block has a
language tag and complete, consistent code; steps are complete and correctly ordered; links have
descriptive text.

PASS if the response reports no critical or major issues. Minor stylistic suggestions or notes
about things it couldn't verify (like whether the SDK package name is real) are fine and expected.
FAIL if the response reports a critical or major issue, or fabricates a defect the page doesn't
actually have (for example claiming a step is missing, a code block lacks a language tag, or a
prerequisite is unstated, when none of that is true of this page).
