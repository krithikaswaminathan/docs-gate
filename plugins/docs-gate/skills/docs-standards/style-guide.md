# Style guide

> **Status: decided**, with one open item: [Phrasing to avoid](#phrasing-to-avoid) is still the
> generic starter list, not yet confirmed against real editorial judgment — revisit it if any
> entry turns out to be wrong. Everything else below is a real decision, not a placeholder.

## Severity model
Every finding gets one of three severities:
- **Blocker** — this doc must not ship until fixed.
- **Should-fix** — a real problem; fix it soon, but it doesn't have to hold up a release.
- **Nice-to-have** — polish, lowest priority.

## Voice
- **Imperative mood, not literal second person.** Instructions read as commands: "Click Save," not
  "You should click Save" or "You can click Save." This is the same example the active-voice
  section below already uses — imperative and active voice go together here, so there's nothing
  extra to reconcile between the two sections.
- **Exception:** an Explanation-type page, or a tolerated "why" aside inside a how-to (rubric
  dimension 2), may use "you" more conversationally ("you might wonder why…") since it isn't
  issuing an instruction.

## Tense
- **Present tense for current, described behavior:** "The API returns a 404," not "The API will
  return a 404."
- **Future tense is allowed specifically for behavior that hasn't happened yet** at the point being
  described — a later step in a sequence, or an async callback: "the callback fires once the
  upload completes" is fine as present tense, but "once you start the job, results will appear in
  the dashboard a few minutes later" is a legitimate future, not a violation. Don't force present
  tense onto something the page itself is describing as happening later.

## Structure
- **A heading must never be immediately followed by another heading.** At least one sentence of
  orienting text has to appear between any heading and the next heading that follows it, no
  exceptions. — **Blocker**

## Formatting defaults
- Sentence case for headings.
- One instruction per numbered step.
- Code, file names, and commands in `inline code` formatting, not bold or italics.
- Warnings/cautions called out in an admonition, not buried in prose.
- **Every image needs alt text.** A purely decorative image gets empty alt text (`alt=""`);
  it never gets a missing `alt` attribute. — **Blocker**

## Sentence length
- **Flag any sentence over 30 words.** Long sentences almost always carry more than one idea;
  break them up rather than trying to punctuate around the problem. — **Blocker**

## Voice: active vs. passive
- **Default to active, imperative voice** for instructions ("Click Save," not "The Save button
  should be clicked") — see [Voice](#voice) above for the full rule and its exception.
- **Flag every instance of passive voice**, even when it might be defensible (e.g., the actor
  genuinely doesn't matter, as in "The request is validated before processing"). Always flag it
  and let the writer decide whether the passive construction is justified in that instance,
  rather than trying to encode exceptions here. — **Should-fix**

## Phrasing to avoid
Carried over from the starter defaults; not yet explicitly confirmed against this docs set's
voice — revisit if any of these turn out to be wrong for you.
- "simply", "just", "easily" — usually signals the writer is minimizing a step that isn't actually
  simple for the reader.
- "obviously" / "clearly" — signals the writer assumes shared context the reader may not have.

## Abbreviations and acronyms
- **Spell out on first use, per page:** "Information Architecture (IA)" the first time it appears
  on a page, acronym alone after that. Each page is checked on its own — don't assume the reader
  already read an earlier page in the section.

## Capitalization of product and feature names
- **Match the vendor's or product's own casing exactly** (`GitHub`, `macOS`, `iPhone`), not a
  house style. This is inherently per-docs-set — there's no fixed list docs-gate can ship, the same
  way there's no fixed terminology list (see rubric dimension 5). At minimum, flag a page that's
  inconsistent with *itself* (two different castings of the same name); check against
  [terminology.md](terminology.md)'s product-names table once an install has populated it.

## Oxford comma
- **Yes, always:** "reads, writes, and deletes," not "reads, writes and deletes."

## Number formatting
- **Ordinary prose:** spell out one through nine; use numerals from 10 up.
- **Anything technical — versions, counts, limits, ports, timeouts — always gets numerals**,
  regardless of magnitude: "3 retries," not "three retries," even though 3 falls under the prose
  rule above. The technical case wins when the two rules would disagree.

## Brand voice
- No fixed brand voice, for the same reason there's no fixed terminology or capitalization list:
  docs-gate reviews whatever docs set it's pointed at, each with its own voice. This is a
  per-install concern, not a base style-guide rule — nothing to check here at the base level.
