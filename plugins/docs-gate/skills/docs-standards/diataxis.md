# Content types (Diataxis)

> **STARTER: author to replace.** This is a plain summary of the public Diataxis framework
> (diataxis.fr), included so `review-page` and `review-ia` have a working definition of "content
> type" out of the box. Replace or extend it if this docs set uses different categories or
> boundaries.

Diataxis groups documentation into four types, split along two axes: whether the reader is
**studying** or **working**, and whether the content is **practical** (steps) or
**theoretical** (understanding).

| | Practical | Theoretical |
| :--- | :--- | :--- |
| **Studying** | Tutorial | Explanation |
| **Working** | How-to guide | Reference |

## Tutorial
Learning-oriented. Takes a newcomer through a complete, working exercise, step by step, with a
guaranteed outcome. Not the place for options, edge cases, or "why" digressions.

## How-to guide
Goal-oriented. Shows how to solve a specific, real-world problem for a reader who already has
basic competence. Assumes prerequisites; doesn't re-teach fundamentals.

## Reference
Information-oriented. Describes the thing (API, config, CLI) accurately and completely, in a
structure a reader can scan and look up, not narrate.

## Explanation
Understanding-oriented. Discusses background, context, and why things are the way they are. Not
required to be actionable.

## How review-page and review-ia use this

`review-page` checks that a single page stays inside one type instead of drifting (rubric
dimension 2). `review-ia` checks that a *section* of a docs set has a plausible spread across
types rather than, say, no reference pages at all (see the review-ia skill for what "missing
expected pages" means).
