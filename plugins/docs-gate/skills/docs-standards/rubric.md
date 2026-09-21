# Rubric

> **STARTER: author to replace.** These are generic, placeholder pass/fail criteria so
> `review-page` has something concrete to check. They are not a real editorial rubric. Replace
> each `TODO` with your own criteria before treating a review's output as meaningful.

For each dimension, a page either meets the criteria, partially meets them (flag as `major` or
`minor`), or fails them (flag as `critical`). Cite the specific heading or line that triggered the
finding — never a bare "the terminology dimension failed."

## 1. Audience fit
- The page states or clearly implies who it's for (skill level, role) within its first few
  paragraphs.
- TODO: name the audience tiers this docs set actually targets, and what signals fit vs. mismatch.

## 2. Content-type consistency
- The page is recognizably one Diataxis type (see [diataxis.md](diataxis.md)) throughout — a
  tutorial doesn't drift into reference material, a reference page doesn't narrate a workflow.
- TODO: name any locally-tolerated exceptions (e.g., a short "why" aside inside a how-to).

## 3. Prerequisites and outcomes stated
- Tutorials and how-tos state what the reader needs before starting and what they'll have after
  finishing, near the top of the page.
- TODO: specify the expected phrasing/section name, if this docs set has a convention.

## 4. Steps complete and ordered
- Every step in a sequence is present, in the order a reader must perform them, with no skipped
  or merged steps that hide a decision point.
- TODO: define how to treat optional/conditional steps.

## 5. Terminology consistency
- Terms match [terminology.md](terminology.md): no undefined synonyms for the same concept, no
  banned terms.
- TODO: populate terminology.md with this docs set's real preferred/banned terms.

## 6. Code samples labeled, complete, and verifiable
- Every fenced code block has a language tag.
- A sample that claims to be runnable includes its imports/prerequisites and doesn't silently
  depend on state from a step that was skipped.
- TODO: state any project-specific sample conventions (e.g., required comment headers, redaction
  rules for real credentials).

## 7. Links and cross-references
- Internal links point to a page that plausibly exists in this docs set; anchor text describes the
  destination.
- TODO: define the target link style (e.g., relative vs. absolute) if this docs set has one.

## 8. Scannability
- Headings, lists, and short paragraphs are used where a wall of prose would bury the key point.
- TODO: set a rough guideline (e.g., paragraph length, heading depth) if this docs set has one.

## 9. Factual claims that need verification
- Flag any claim about behavior, limits, defaults, or API shape that isn't obviously true from the
  page itself — hand these to `verify-samples` (for code) or the `fact-checker` agent (for prose
  claims) rather than guessing.
- TODO: name the source-of-truth repos/specs this docs set's claims should be checked against.
