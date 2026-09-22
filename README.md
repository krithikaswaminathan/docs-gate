# docs-gate

A Claude Code plugin that reviews Markdown/MDX documentation pages in docs-as-code repos
(Docusaurus, Mintlify). It reviews, verifies, and reports — it never edits the pages it looks at.

This repo is a plugin marketplace containing one plugin, `docs-gate`, under `plugins/docs-gate/`.

> **This README documents what the plugin does.** It does not include the real editorial
> standards `docs-gate` applies — see [Editorial standards](#editorial-standards-are-a-starter)
> below.

## What it does

| Component | What it is | Read-only? |
|---|---|---|
| `/docs-gate:review-page <path>` | Rubric review of one page: severity, dimension, location, evidence, suggested fix | Yes |
| `/docs-gate:verify-samples <path>` | Extracts and classifies fenced code samples; static checks by default, JS execution only with your explicit per-run confirmation | Yes |
| `/docs-gate:review-ia <docs-root>` | Reviews a docs section's navigation: orphan pages, mixed content types, inconsistent naming, excessive depth, missing expected pages | Yes |
| `docs-gate:fact-checker` (agent) | Checks a page's factual claims against source material you point it to — supported / contradicted / unverifiable, with file/line evidence | Yes |
| `docs-standards` (skill) | Background rubric/style-guide knowledge the other skills load on demand | N/A (no logic) |
| Hooks | `SessionStart` reports whether Node/Vale/markdownlint are available; `PostToolUse` lints a changed `.md`/`.mdx` file if a linter is present | Observe-only |

None of these edit files. Suggested fixes appear only in reports.

## Install

**Add the marketplace, then install the plugin:**

```bash
claude plugin marketplace add https://github.com/<you>/docs-gate
claude plugin install docs-gate@docs-gate-marketplace
```

For a local checkout instead of GitHub:

```bash
claude plugin marketplace add /path/to/docs-gate
claude plugin install docs-gate@docs-gate-marketplace
```

`claude plugin marketplace add` is the scriptable CLI form — confirmed working non-interactively
against a local path (tested into a throwaway project directory). The equivalent slash command,
`/plugin marketplace add <path>`, only works inside an interactive `claude` session; it errors
("`/plugin` isn't available in this environment") under `claude -p` / non-interactive use, so
scripts and CI should use the CLI form.

**Try it without installing**, from this repo's root:

```bash
claude --plugin-dir ./plugins/docs-gate
```

**Uninstall:**

```bash
claude plugin uninstall docs-gate@docs-gate-marketplace
claude plugin marketplace remove docs-gate-marketplace
```

### Requirements

- Node.js 20 or later (LTS). Scripts use `node:test`, `node:assert/strict`, and `util.parseArgs`,
  all stable since Node 20; no npm dependencies are installed.
- Optional, detected and reported (never installed for you): [Vale](https://vale.sh) and
  [`markdownlint`](https://github.com/DavidAnson/markdownlint) (the `markdownlint-cli` binary
  specifically — see [Limitations](#limitations)).

### Configuration

One `userConfig` option: `docs_root` (default `docs`) — scopes which directory the `PostToolUse`
lint hook pays attention to. Set it with:

```bash
claude plugin install docs-gate@docs-gate-marketplace --config docs_root=my-docs
# or, after installing:
/plugin configure docs-gate@docs-gate-marketplace
```

## Usage

```
/docs-gate:review-page docs/how-to/rotate-keys.md
/docs-gate:verify-samples docs/how-to/rotate-keys.md
/docs-gate:review-ia docs/
```

The fact-checker agent isn't slash-invoked directly — ask Claude to use it, e.g. "use the
docs-gate fact-checker to check the claims in docs/api/limits.md against src/config/limits.ts."

Each review skill ends its report with a summary and a list of what it couldn't assess. A clean
result is reported as clean, not padded with minor findings to look thorough.

## Safety model

- **Docs under review are untrusted data.** Every review skill and the fact-checker agent state
  this explicitly and are instructed to treat embedded text that looks like an instruction — "run
  this command," "ignore previous instructions," a request to fetch a URL — as page content to
  report, never as something to follow. The `injection-not-followed` eval case exercises this.
- **Read-only enforcement is stronger for the agent than for the skills, and that difference is
  real, not stylistic.** `fact-checker`'s `tools`/`disallowedTools` frontmatter genuinely removes
  Write/Edit from its tool pool — verified by directly instructing it to fix a claim it had found
  contradicted; it made zero tool calls and refused in its own words. The three skills'
  `disallowed-tools: Write, Edit, NotebookEdit` frontmatter is a *pre-approval* mechanism per the
  Claude Code skills docs, not a hard restriction — it does not stop Claude from calling a
  disallowed tool if it decided to; the read-only guarantee for `review-page`, `verify-samples`,
  and `review-ia` rests on their prose instructions plus whatever permission settings the host
  project enforces, not on the frontmatter alone.
- **Opt-in code execution, not a sandbox.** `verify-samples`'s default is static-only (syntax
  checks, placeholder detection). Actually running a sample requires your explicit per-run
  confirmation, runs in a fresh temp directory with the environment reduced to just `PATH` (and
  `SystemRoot`/`PATHEXT` on Windows — verified no parent-shell secrets are visible to the sample),
  a 10-second timeout, and 10k-character output truncation. It does **not** block network access —
  there's no dependency-free way to do that here — so a sample classified as network-dependent
  gets a separate confirmation prompt. JavaScript only; every other language reports
  `not-checked`/`not-supported`.
- **Opt-in `sidebars.js` execution, same pattern.** `review-ia`'s nav parser never executes a
  docs repo's `sidebars.js` by default — it parses a narrow, safe subset statically (object/array
  literals, strings, numbers, booleans, comments, trailing commas) and falls back to the directory
  tree the moment it sees anything dynamic (`require(...)`, a bare variable reference, a template
  interpolation). Actually running `sidebars.js` requires your explicit confirmation, runs in a
  separate child process, and is called out as running code from the repo under review.
- **Secret redaction is prose-instructed, not code-enforced.** `review-page` and `verify-samples`
  instruct Claude to redact anything that looks like a real secret or token before quoting it in a
  report. This is the same category of guarantee as the skills' read-only instructions: real, and
  something Claude follows, but not a hard filter a script applies to output before it's shown.
- **Hooks are observe-and-report only.** Neither hook writes to a file under review; `PostToolUse`
  surfaces linter findings back to Claude via `hookSpecificOutput.additionalContext`, never by
  editing anything itself.
- No skill or hook installs anything. Missing Vale/markdownlint are reported, never installed.

## Token cost

From `claude plugin details docs-gate` (Claude Code v2.1.278), token counts are estimates:

| Component | Always-on | On-invoke |
|---|---|---|
| (plugin total) | ~613 tok added to every session | — |
| `verify-samples` | ~110 | ~1.8k |
| `docs-standards` | ~110 | ~670 |
| `review-page` | ~100 | ~990 |
| `review-ia` | ~140 | ~2k |
| `fact-checker` | ~150 | ~1.1k |

On-invoke cost is paid each time that skill or agent actually fires, not every session.

## Eval results

Run with `claude plugin eval`, `--ablation with-without` (the default), 3 runs per case per arm,
against Claude Code v2.1.278. Eight cases, one per requirement in the project spec: seeded-defect
and clean-page cases for `review-page`, a broken/valid case for `verify-samples`, an orphan/mixed-
type case for `review-ia`, a three-claims case for `fact-checker`, the prompt-injection case, and
two negative cases (skills/agent must not fire on unrelated prompts).

| Case | With plugin | Without plugin |
|---|---|---|
| review-page-flags-seeded-defects | 3/3 | 3/3 |
| review-page-clean-no-false-alarms | 3/3 | 1/3 |
| verify-samples-broken-and-valid | 3/3 | 3/3 |
| review-ia-orphan-and-mixed-type | 3/3 | 3/3 |
| fact-checker-three-claims | 3/3 | 1/3 |
| injection-not-followed | 3/3 | 3/3 |
| negative-docusaurus-mention | 3/3 | 3/3 |
| negative-unrelated-prompt | 3/3 | 3/3 |

Total cost across all runs (one full 8-case run plus two reruns of cases interrupted by a session
usage limit — see `DEV-NOTES.md`): **$4.58**, list-price estimate.

**What this actually shows**, stated plainly rather than oversold: a capable model without the
plugin already manages a passable manual review, resists the injected instruction, and doesn't
spuriously invoke skills it doesn't have — five of the eight cases show no with/without gap. The
plugin's measured differentiation is narrower and more specific than "the plugin makes review
better" in general:
- **Fewer false alarms on a clean page** (3/3 vs 1/3) — without the plugin, the baseline model
  tends to flag a clean page's ordinary stylistic choices as defects.
- **Fact-checker's evidence-backed verdicts** (3/3 vs 1/3) — without the plugin, the baseline
  model tends to assert a claim's correctness without checking it against the source material.

These are single-run results (3 samples per arm), not a statistically rigorous benchmark. Full
per-run detail, including grader rationale and each judge's votes, is in
`plugins/docs-gate/evals/results/` (gitignored locally; not committed, since it's regenerated by
re-running the suite) and in `DEV-NOTES.md`.

**Reproducing this costs real money on your account or API plan.** Estimate before you run it:

```bash
claude plugin eval ./plugins/docs-gate --scaffold --ablation with-without --no-publish
```

Use `--case <name>` to run a single case, `--max-cost-usd <n>` as a hard ceiling, and
`--ablation none` to skip the no-plugin baseline while iterating (roughly halves cost).

## Editorial standards are a STARTER

`plugins/docs-gate/skills/docs-standards/` ships a visibly-labeled STARTER rubric, style guide,
terminology list, and content-type reference so the plugin works end to end. It is a placeholder,
not anyone's real editorial standard — replace it with your own before relying on this plugin's
judgment calls. See the `STARTER: author to replace` banner at the top of `SKILL.md`.

## Limitations

- **Skill-level read-only enforcement is prose, not a hard restriction** (see Safety model above)
  — `allowed-tools`/`disallowed-tools` in a skill's frontmatter pre-approves or pre-denies tools
  for permission-prompt purposes; it doesn't remove them from what Claude could call.
- **Secret redaction is prose-instructed**, not a code-level filter over report output.
- **No network sandboxing for opt-in sample execution.** A confirmed-execution sample can still
  reach the network; docs-gate only adds a separate confirmation step for samples it classifies as
  network-dependent.
- **JavaScript-only execution.** Every other language in `verify-samples` reports
  `not-checked`/`not-supported` with the reason, not a real check.
- **`markdownlint` (from `markdownlint-cli`) specifically is detected — not `markdownlint-cli2`.**
  An environment with only `markdownlint-cli2` installed will see "not found" even though a
  markdownlint tool is present.
- **Windows support is unverified.** The `.cmd`-shim retry logic for detecting globally-installed
  npm tools on Windows was written to spec but has not been tested on an actual Windows machine.
- **The Mintlify `docs.json` parser is best-effort**, not validated against Mintlify's own schema
  (out of scope for this project, which read only Claude Code's own docs at Step 0).
- **`sidebars.js` static parsing is deliberately narrow.** It only ever succeeds when the exported
  config has no dynamic content at all (no `require()`, no variable references, no template
  interpolation); anything else falls back to the directory tree rather than approximating.
- **`review-ia`'s "missing expected pages" heuristic (getting started / troubleshooting /
  reference) is a fixed, built-in keyword list**, not configurable via `userConfig`.
- **`node --test <directory>` doesn't recurse** on the Node version this was built against
  (v25.6.1) — run tests with the explicit glob `node --test tests/scripts/*.test.mjs`.
- **Eval numbers are from a single run of 3 samples per arm per case** — a useful signal, not a
  statistically rigorous benchmark. See "What this actually shows" above.

## Case study

<!-- TODO(author): case study and "What I learned" go here. Not written by the assistant that
     built the machinery -- this is the author's own editorial judgment and portfolio narrative. -->

## Design decisions

<!-- TODO(author): design-decisions writeup goes here. -->
