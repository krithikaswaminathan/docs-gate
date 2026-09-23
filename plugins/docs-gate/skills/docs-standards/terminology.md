# Terminology

> **Per-install template.** docs-gate reviews whatever docs set it's pointed at, so there's no
> fixed glossary to ship — each installing team populates these tables for their own docs set. The
> row below each table is a labeled example showing the expected format, not a real entry; replace
> it (don't just add to it) with this docs set's actual terms before treating terminology findings
> as fully meaningful. Even with these tables empty, `review-page` and `review-ia` still flag two
> different terms used for one clearly identical concept on a page — see "How review-page uses this
> file" below.

| Preferred term | Don't use | Notes |
| :-------------- | :--------- | :---- |
| _example:_ sign in | log in, login (as a verb) | "Log in" mixes verb/noun forms; "sign in" stays a verb consistently. |

## Product and feature names

| Correct form | Common mistakes | Notes |
| :------------ | :---------------- | :---- |
| _example:_ GitHub | Github, github | Match the vendor's own casing exactly (see style-guide.md). |

## How review-page uses this file

A page fails the terminology dimension when it uses a "Don't use" term for a concept that has a
preferred term listed here, or mixes two different terms for what is clearly the same thing (even
if neither is listed yet — flag that as a gap in this file too, not just a page defect).
