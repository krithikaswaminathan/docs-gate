# Rubric

> **Status: in progress.** Some dimensions below reflect real editorial judgment; others are
> still the generic starter criteria, marked `TODO`. Replace each remaining `TODO` before treating
> that dimension's findings as meaningful.

Every finding gets one of three severities (see [style-guide.md](style-guide.md) for the full
definitions): **Blocker**, **Should-fix**, or **Nice-to-have**. Cite the specific heading or line
that triggered the finding — never a bare "the terminology dimension failed."

## 1. Audience fit
- The page states or clearly implies who it's for (skill level, role) within its first few
  paragraphs.
- TODO: name the audience tiers this docs set actually targets, and what signals fit vs. mismatch.

## 2. Content-type consistency
- The page is recognizably one Diataxis type (see [diataxis.md](diataxis.md)) throughout — a
  tutorial doesn't drift into reference material, a reference page doesn't narrate a workflow.
- TODO: name any locally-tolerated exceptions (e.g., a short "why" aside inside a how-to).

## 3. Requirements section (connector pages)
This dimension applies only to a page that walks the reader through connecting to an external
service, account, or integration — a **connector page**. A tutorial, how-to, or setup page that
doesn't connect the reader to anything external (a purely local walkthrough, a conceptual page, a
reference page) doesn't need this section at all: don't apply this dimension to it, and don't
report a finding for its absence, not even a Nice-to-have. Not-a-connector-page means don't block.

A connector page needs a `## Requirements` section with three named subsections, stated up front
rather than left for the reader to discover mid-task:

- **Technical** — software versions, environment setup, dependencies the reader must already
  have. Missing this subsection: **Should-fix** (an inconvenience; the reader can often recover
  by trial and error).
- **Credential** — what credential is needed and exactly how to obtain or configure it. A code
  sample must never silently assume a credential the page hasn't explained. Missing this
  subsection: **Blocker** (the reader can't proceed at all without knowing what's needed).
- **Permissions** — what access level, role, or account tier is required to complete the task.
  Missing this subsection: **Blocker** (the reader can get silently locked out mid-setup with no
  explanation of why).

This pattern generalizes beyond any one docs set: most connector-page failures trace back to one
of these three gaps, so it's worth checking even on a docs set that doesn't yet use this exact
heading convention — flag the gap and suggest the convention rather than skipping the check. But
the gate is real: confirm the page is a connector page first, and if it isn't, this dimension is
not assessed, not passed.

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
- **Missing credentials.** A sample that references a credential, token, or key must show where
  it comes from (a link to the auth/setup section, an env var name) or explicitly mark it as a
  placeholder (`YOUR_API_KEY`) called out in the surrounding text — never silently assumed.
  — **Blocker**
- **Missing prerequisites.** A sample whose success depends on unstated setup (a prior step, a
  resource that must already exist) is incomplete — the page must state what has to be true
  before the sample will work, not leave the reader to discover it via an error. — **Blocker**
- **Invalid JSON.** Any JSON in a sample must parse cleanly: no trailing commas, no comments,
  correct quoting. This is a mechanical check (does it parse), not a judgment call — hand it to
  `verify-samples` directly rather than the model. — **Blocker**
- TODO: state any other project-specific sample conventions (e.g., required comment headers,
  redaction rules for real credentials in examples).

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

## 10. Judgment calls without a mechanical check
Doc-type mismatches, weak explanations, and inconsistent terminology don't reduce to a yes/no
check the way the items above do. Use the same three-tier severity model, decided case by case:
- A doc-type mismatch or missing explanation that would actually strand a reader mid-task is a
  **Blocker**.
- A real but non-blocking weakness (an explanation that's technically correct but hard to follow,
  inconsistent terminology that a reader could still work out from context) is **Should-fix**.
- Everything else worth mentioning is **Nice-to-have**.
