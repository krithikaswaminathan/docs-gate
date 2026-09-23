# Rubric

> **Status: decided.** This rubric targets *any* docs-as-code section fed into it — AWS docs one
> run, a Glean connector page the next, MDN the run after that — not one product's docs. That
> shapes a few dimensions below: where a real answer would only make sense for one specific docs
> set (a fixed terminology list, a fixed brand voice), the rubric says so explicitly and treats it
> as a per-install concern instead of inventing one.

Every finding gets one of three severities (see [style-guide.md](style-guide.md) for the full
definitions): **Blocker**, **Should-fix**, or **Nice-to-have**. Cite the specific heading or line
that triggered the finding — never a bare "the terminology dimension failed."

## 1. Audience fit
- The page states or clearly implies who it's for within its first few paragraphs. The axis that
  matters is **role**, not skill level: **end-user** (uses the product day to day), **developer**
  (integrates or builds against it), or **admin** (configures it, manages access, or manages it on
  behalf of others). A title or opening line can imply the role without naming it — "Configuring
  SSO" pointed at settings only an admin can reach counts as stating "admin."
- A mismatch is the stated or implied role not matching what the page actually assumes of the
  reader — for example, a page opens "for end-users" but its first real step requires reading
  server logs or editing an IAM policy, or a page names no role at all and jumps straight into API
  calls with no UI equivalent, silently assuming "developer." Flag the gap between what's claimed
  (or implied) and what's actually asked of the reader, not the absence of a label by itself — a
  page whose content is obviously for one role doesn't need to say so in as many words.

## 2. Content-type consistency
- The page is recognizably one Diataxis type (see [diataxis.md](diataxis.md)) throughout — a
  tutorial doesn't drift into reference material, a reference page doesn't narrate a workflow.
- **Tolerated exception:** a how-to or tutorial may carry one brief (1–2 sentence) "why" aside.
  Anything longer, or more than one aside on the page, is drift into Explanation — report it under
  this dimension rather than waving it through as "just context."

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
- An optional or conditional step ("if you're using X, do Y") must say plainly that it's optional
  or conditional, and under what condition. An unlabeled step the reader can't tell whether to
  perform is a finding under this dimension — treat "silently optional" the same as "silently
  missing," not as something to skip over because it might not apply.

## 5. Terminology consistency
- Terms match [terminology.md](terminology.md): no undefined synonyms for the same concept, no
  banned terms.
- `terminology.md` ships as a per-install template (see
  [docs-standards/terminology.md](terminology.md)) — it's the installing team's job to populate it
  for their own docs set, the same way product-name capitalization (see style-guide.md) is. Before
  it's populated, still flag two clearly different terms used for what's plainly the same concept
  on the page under review, even with no glossary entry to point to — that's a real inconsistency
  a model can catch on its own, and it's also a gap in the glossary worth naming.

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
- **Real secrets.** A sample containing what looks like an actual, non-placeholder credential,
  token, key, or password (not `YOUR_API_KEY` or similarly obvious filler) is a Blocker regardless
  of which docs set it's in — a leaked real secret in shipped documentation is never acceptable,
  full stop. — **Blocker**. No universal convention beyond that (e.g. required comment headers):
  that's a per-project style choice, not something the base rubric enforces.

## 7. Links and cross-references
- Internal links point to a page that plausibly exists in this docs set; anchor text describes the
  destination.
- Internal links should use **relative paths** (e.g. `../guides/setup.md`), which stay correct
  across forks, previews, and versioned builds the way an absolute site path doesn't. An internal
  link using an absolute path is a **Should-fix**, not a Blocker — it's a real inconsistency, not
  something that strands the reader.

## 8. Scannability
- Headings, lists, and short paragraphs are used where a wall of prose would bury the key point.
- No fixed numeric threshold (paragraph length, heading depth) — this stays a judgment call under
  dimension 10's model rather than a mechanical count. The signal is a paragraph that's plainly
  doing a list's or a subheading's job in prose form, not a word count.

## 9. Factual claims that need verification
- Flag any claim about behavior, limits, defaults, or API shape that isn't obviously true from the
  page itself — hand these to `verify-samples` (for code) or the `fact-checker` agent (for prose
  claims) rather than guessing.
- There's no fixed list of source-of-truth repos to check against — the docs set under review
  changes every run, so the source material has to too. `fact-checker` already handles this: it
  requires whoever invokes it to name the specific repo, spec, or file to check against for *this*
  review, and refuses to guess if none is given (see `fact-checker.md`). Don't invent a
  source-of-truth here; if the caller hasn't named one, say that a claim needs verification and
  which source would settle it, rather than guessing at an answer yourself.

## 10. Judgment calls without a mechanical check
Doc-type mismatches, weak explanations, and inconsistent terminology don't reduce to a yes/no
check the way the items above do. Use the same three-tier severity model, decided case by case:
- A doc-type mismatch or missing explanation that would actually strand a reader mid-task is a
  **Blocker**.
- A real but non-blocking weakness (an explanation that's technically correct but hard to follow,
  inconsistent terminology that a reader could still work out from context) is **Should-fix**.
- Everything else worth mentioning is **Nice-to-have**.
