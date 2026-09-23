---
name: docs-standards
description: Background knowledge for docs-gate — the rubric, style guide, terminology list, and content-type (Diataxis) definitions the review skills apply. Use when you need to know what "good documentation" means for this plugin, when a review skill asks you to apply the rubric, or when asked what docs-gate's standards are.
---

> **Status: mixed.** [rubric.md](rubric.md) and [style-guide.md](style-guide.md) reflect real
> editorial judgment, though each still has individual `TODO`s left to fill in.
> [terminology.md](terminology.md) is still a placeholder end to end — populate it before treating
> terminology findings as meaningful. [diataxis.md](diataxis.md) is a plain summary of the public
> Diataxis framework, kept as-is unless this docs set uses different categories.

# docs-standards

This skill is the shared standard the review skills (`review-page`, `verify-samples`,
`review-ia`) and the `fact-checker` agent apply. It holds no logic of its own — it's reference
material, loaded on demand rather than kept in context every turn.

## Rubric dimensions

A page is judged on these ten dimensions. See [rubric.md](rubric.md) for the criteria under each
one:

1. Audience fit
2. Content-type consistency (tutorial, how-to, reference, explanation — see [diataxis.md](diataxis.md))
3. Requirements section (connector pages only) — technical, credential, and permissions
4. Steps complete and ordered
5. Terminology consistency (see [terminology.md](terminology.md))
6. Code samples labeled, complete, and verifiable
7. Links and cross-references
8. Scannability
9. Factual claims that need verification
10. Judgment calls without a mechanical check

## Reference files

| File | Holds |
| :--- | :--- |
| [rubric.md](rubric.md) | Pass/fail criteria for each dimension above |
| [style-guide.md](style-guide.md) | Voice, tense, formatting, and phrasing rules |
| [terminology.md](terminology.md) | Preferred terms, banned terms, and product/feature names |
| [diataxis.md](diataxis.md) | What distinguishes a tutorial, how-to, reference, and explanation page |

Read the specific reference file(s) a task needs rather than all four — that's the point of
keeping them separate from this file.

## Using this skill from another skill

`review-page`, `verify-samples`, and `review-ia` read these reference files directly (for
example `${CLAUDE_PLUGIN_ROOT}/skills/docs-standards/rubric.md`) rather than invoking this skill
first. Invoke `docs-standards` directly yourself only when you need the standards without doing a
review — for example, if the user asks "what does docs-gate check for?"
