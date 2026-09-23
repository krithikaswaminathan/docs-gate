# Style guide

> **Status: in progress.** The rules below reflect real editorial judgment. Sections still marked
> `TODO` haven't been decided yet — fill them in before relying on the plugin's judgment there.

## Severity model
Every finding gets one of three severities:
- **Blocker** — this doc must not ship until fixed.
- **Should-fix** — a real problem; fix it soon, but it doesn't have to hold up a release.
- **Nice-to-have** — polish, lowest priority.

## Voice
- TODO: second person ("you") vs. imperative vs. first-person-plural — pick one and state
  exceptions.

## Tense
- TODO: present tense for described behavior is a common default; state whether this docs set
  follows that and how to handle async/eventual behavior.

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
- **Default to active voice.** Address the reader directly as "you" for instructions
  ("Click Save," not "The Save button should be clicked").
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

## TODO
- Voice and tense (above).
- Abbreviations/acronyms on first use.
- Capitalization of product/feature names.
- Oxford comma.
- Number formatting.
- Anything specific to this docs set's brand voice.
