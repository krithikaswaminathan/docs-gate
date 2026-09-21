# DEV-NOTES

Notes from reading the current Claude Code plugin docs (code.claude.com/docs, fetched 2026-09-20)
before designing docs-gate. Where the original prompt disagreed with the docs, the docs win; those
cases are called out below. This file is not shipped to plugin users.

## Environment

- Installed Claude Code was 2.1.267 (Homebrew `claude-code` cask), below the v2.1.269 minimum for
  `claude plugin eval`. Switched to the `claude-code@latest` cask per user approval, now on 2.1.278.
  Re-run `claude --version` periodically; `claude plugin eval` refuses to run below v2.1.269.
- Node: v25.6.1 installed. Target/minimum supported version still TBD — pick the current LTS when
  we write the README (Node 22 LTS as of this writing; confirm at Milestone 8).

## Re-checking the prompt's "already verified" facts

- **Plugin-shipped agents don't support `hooks`, `mcpServers`, or `permissionMode` frontmatter** —
  CONFIRMED. Subagents reference page: these three fields are explicitly "Ignored for plugin
  subagents." Workaround (not needed here) is copying the agent into `.claude/agents/`.
- **`claude plugin validate [--strict]` checks structure; `claude plugin details <name>` shows
  always-on token cost; `claude plugin eval` runs cases with/without the plugin and costs real
  model usage** — CONFIRMED via `--help` output. `plugin details` wasn't in the prose CLI summary
  the reference page rendered for me, but `claude plugin --help` lists it directly:
  "Show a plugin's component inventory and projected token cost."
- **Plugins can't bundle external binaries (Vale, markdownlint); detect them and degrade
  gracefully** — MOSTLY CONFIRMED, one nuance. A plugin *can* ship a `bin/` directory of
  executables added to the Bash tool's `PATH` while the plugin is enabled — so technically a
  plugin could vendor a binary. But: (a) `bin/` can't be used at all in a plugin distributed
  through claude.ai organization settings, (b) vendoring Vale/markdownlint binaries would mean
  per-platform binaries checked into the repo, which conflicts with the "plain .mjs, no npm
  dependencies, same behavior on macOS/Linux/Windows" requirement regardless of what the plugin
  system technically permits. Decision: keep detect-and-degrade. Don't use `bin/`.
- **A CLAUDE.md at a plugin's root is NOT loaded as context. Ship standards inside a skill** —
  NOT explicitly confirmed or contradicted by the pages fetched (Plugins, Plugins reference,
  Skills, Subagents, Hooks, Plugin marketplaces, Test-plugins-with-evals). None of those pages
  documents a plugin-root `CLAUDE.md` as a recognized plugin component at all — the plugin
  directory structure table lists `.claude-plugin/`, `skills/`, `commands/`, `agents/`, `hooks/`,
  `.mcp.json`, `.lsp.json`, `monitors/`, `bin/`, `settings.json`, but no `CLAUDE.md`. That absence
  is consistent with the prompt's claim (nothing suggests Claude Code scans a plugin root for
  CLAUDE.md), so proceeding on the stated assumption: standards go in the `docs-standards` skill,
  not a plugin-root CLAUDE.md. Flagging as inferred-from-absence rather than directly stated.

## Facts that change or firm up the design

### plugin.json / manifest
- Only `name` is strictly required. `version`, `author`, `description`, `homepage`, `repository`,
  `license`, `keywords` etc. are optional metadata.
- Component path fields (`skills`, `commands`, `agents`, `hooks`, `mcpServers`, etc.) are only
  needed if we deviate from the default directory names — we won't, so `plugin.json` stays small.
- `experimental.evals` can point `claude plugin eval` at a non-default eval directory. We're using
  the default `evals/`, so no need to set this.
- Unknown/unrecognized fields are warnings, not errors, unless `--strict` is passed.

### Skills
- Frontmatter fields confirmed: `name`, `description`, `disable-model-invocation`,
  `user-invocable`, `allowed-tools`, `disallowed-tools`, `context`, `agent`, `background`,
  `paths`, `arguments`.
- `allowed-tools` is a **pre-approval mechanism**, not a restriction mechanism — it just skips
  permission prompts for listed tools during the skill's turn; it does NOT prevent Claude from
  calling other tools. Read-only enforcement for review-page / verify-samples / review-ia has to
  come from (a) writing the skill instructions to never call Write/Edit and explicitly refuse if
  asked, plus (b) the project's own permission settings if we want a hard backstop. This matters
  for the "Security requirements" section: the skills docs' `allowed-tools` is not itself a
  sandboton its own — plan the review skills' prose accordingly and note the limitation in
  DEV-NOTES / README rather than overclaiming enforcement.
- `disable-model-invocation: true` is the right setting for skills with side effects; our
  review/verify/review-ia skills are read-only and user-invoked via `/docs-gate:review-page <path>`
  etc., so they should probably keep model-invocation available too (Claude may want to run a
  review proactively) — decide per-skill at Milestone 2.
- Reference files (rubric.md, style-guide.md, terminology.md, diataxis.md) load on demand, not
  into every session — matches the "keep SKILL.md short" requirement directly.
- Skill invocation names for plugin skills: directory name is the default, frontmatter `name`
  overrides it, and the effective slash command is namespaced `/docs-gate:review-page` etc.

### Agents (fact-checker)
- Confirmed frontmatter for read-only bounded agent: `tools: Read, Grep, Glob` (or similar
  allowlist) plus `disallowedTools: Write, Edit` as a belt-and-suspenders read-only setup, and
  `maxTurns: <n>` for bounded turns. `model`, `effort`, `skills` also available.
- Confirmed (see above): `hooks`, `mcpServers`, `permissionMode` in the agent's own frontmatter are
  ignored for plugin agents. Not a problem for fact-checker, which needs none of them.
- Agent naming: file `agents/fact-checker.md` → invoked/displayed as `docs-gate:fact-checker`.

### Hooks
- Plugin hooks live in `hooks/hooks.json` (a top-level `hooks` object keyed by event name), same
  schema as project/user hooks.
- **Exec form** for invoking scripts safely: `{"type": "command", "command": "node", "args": [...]}`
  — no shell involved, so this is what we use for the PostToolUse linter hook and any others,
  per the "do not build shell command strings from file paths or page content" requirement.
  Shell form (`"command": "a string"`, optionally with `"shell": "bash"`) is for pipes/redirection
  and is NOT what we want here.
- SessionStart hook (Node/Vale/markdownlint check): matcher values for `SessionStart` are
  `startup`, `resume`, `clear`, `compact`, `fork`. We want ours to fire on session start generally,
  so use an empty/omitted matcher or explicitly list `startup|resume`. Confirm behavior when
  building Milestone 3.
- PostToolUse hook: matcher `"Edit|Write"` (or `"Edit, Write"` on v2.1.191+) fires on those two
  tools; script still has to check the file extension itself (`.md`/`.mdx`) since the matcher only
  filters by tool name, not by file type.
- Feedback mechanism: hook exits 0 and prints a JSON object with
  `hookSpecificOutput.additionalContext` (or, per event, other fields) to surface findings back to
  Claude without blocking. For PostToolUse specifically, exit-0 JSON is parsed but PostToolUse
  isn't in the "Claude sees plain stdout" list (that's UserPromptSubmit/UserPromptExpansion/
  SessionStart/PostModelSwitch) — for PostToolUse we should use `hookSpecificOutput.additionalContext`
  (kept from every hook, passed to Claude) and/or the top-level `decision`/reason pattern rather
  than relying on plain stdout text. Confirm exact PostToolUse JSON shape against
  code.claude.com/docs/en/hooks#posttooluse at Milestone 3 (not fully covered in the pages
  fetched at Step 0 — the hooks reference page covered PreToolUse in most depth).
- `disallowedTools` at the hook/skill/agent level and the plugin's own read-only requirements are
  enforced by prose + tool restriction, never by the hook rewriting files — hooks here are
  observe-and-report only, matching "no skill or hook modifies files under review."
- Plugin userConfig values reach hook processes as `$CLAUDE_PLUGIN_OPTION_<KEY>` environment
  variables (e.g. `docs_root` → `CLAUDE_PLUGIN_OPTION_DOCS_ROOT`). Shell-form hooks can't use
  `${user_config.*}` substitution directly; exec-form + env var is required, which is what we're
  doing anyway.

### Marketplace
- `.claude-plugin/marketplace.json` at repo root, required fields `name`, `owner` (object with
  `name` required), `plugins` (array). Plugin entries need `name` + `source`; `source` can be a
  relative path like `"./plugins/docs-gate"`.
- Confirmed repo layout (marketplace repo containing one plugin under `plugins/<name>/`) matches
  what the prompt specifies.
- Install/test commands confirmed:
  - Local dev, no install: `claude --plugin-dir ./plugins/docs-gate`
  - Add local marketplace: `/plugin marketplace add ./` (from repo root) or
    `claude plugin marketplace add <path>` — CLI vs slash-command form both exist; use whichever
    the docs show under "Add a Marketplace" when we write the README, and actually test both.
  - Validate: `claude plugin validate ./plugins/docs-gate [--strict]` and
    `claude plugin validate .` for the marketplace itself.

### Evals (`claude plugin eval`)
This is the part of the prompt that was most under-specified ("evals per the evals docs") and the
docs give a full, different-from-guessed format:

- Directory: `evals/` at the plugin root (not the repo root) by default. Each case is a
  subdirectory: `evals/<case-name>/prompt.md` (frontmatter: `max_turns`, `timeout_seconds`,
  `allowed_tools`, `model`, `tags`, `runs`, etc.; body: the literal prompt) plus
  `evals/<case-name>/graders/<grader-name>.md` (frontmatter `type: regex|tool_used|tool_order|
  file_exists|llm|baseline` + type-specific options; body is the rubric for `llm`/`baseline`).
  `case.yaml` is optional/alternate, mainly for `context.scaffold_script`, `context.add_dirs`,
  `context.history_file`.
- **No custom-code graders exist.** Only the six types above. This constrains how we grade e.g.
  "all N seeded defects were flagged" — likely an `llm` grader with a rubric enumerating the
  defects, or several `regex`/`tool_used` graders if the defects can be pattern-matched from the
  final reply or transcript instead. Design this concretely at Milestone 7, not before.
- Runs default to 3 per case per arm; a "case" by default runs twice as many times as `runs` once
  the no-plugin baseline (`--ablation with-without`, the default when a plugin resolves) is
  included — cases × runs agent runs WITH the plugin, and the same again WITHOUT, plus 3 judge
  calls per `llm`/`baseline` grader per run. This is the number to base the cost estimate on
  before Milestone 7's run.
- `tool_used: Skill` graders (checking a specific skill fired) are automatically excluded from the
  score in two-arm runs (can't pass without the plugin) and reported as pass/fail indicators only
  — relevant for our "negative cases: unrelated prompts must not trigger the skills" eval, which
  wants `min: 0, max: 0` and should be marked `arm: both` so it's scored in both arms (a "must not
  fire" check is meaningful in the without-arm too).
- Cost control flags: `--max-cost-usd <usd>` (hard ceiling, checked before each run starts),
  `--ablation none` (skip the no-plugin baseline, halves cost, use while iterating), `--runs 1`
  for cheap single-arm iteration, `--case <glob>` / `--tag <tag>` to scope a run. Use
  `--max-cost-usd` plus a stated estimate for the Milestone 7 run per the working agreement to
  "tell me the estimated cost before running any eval suite."
- Trust prompt: first run against an untrusted plugin directory asks `Trust this plugin directory?`
  in an interactive terminal; `--trust-plugin` skips it (for CI; we should NOT pass this by default
  in local development so the trust gate stays meaningful).
- CI: run evals only on manual trigger per the prompt's requirement — this is a deliberate choice,
  not a docs default (the docs assume many teams do gate CI on evals). `.github/workflows/` should
  have `validate` + script tests on `pull_request`, and a separate `workflow_dispatch`-only
  workflow for evals, matching "Run evals only on manual trigger, not on every PR."
- The prompt-injection eval fixture (embedded instruction must not be followed) fits naturally as
  a case with an `llm` grader (rubric: "FAIL if the response follows/acknowledges the embedded
  instruction rather than treating it as page content") plus a `regex`/`tool_used` grader checking
  no unexpected tool (e.g. Bash, WebFetch) was invoked as a result.
- Report: `aggregate-result.json` (schemaVersion 1, camelCase, forward-compatible) plus
  `report.html` (self-contained, may auto-publish as a claude.ai artifact if signed in — use
  `--no-publish` unless we intend to share it).

### CLI command names double-checked directly (not just from doc prose)
Ran `claude plugin --help`, `claude plugin details --help`, `claude plugin validate --help`
directly against the installed 2.1.278 binary to cross-check the fetched docs:
- `claude plugin details <name>` — confirmed, "Show a plugin's component inventory and projected
  token cost."
- `claude plugin validate <path> [--strict] [--json]` — confirmed.
- `claude plugin eval [options] [target]` — confirmed, help text matches the docs page closely
  (mentions `evals/` default dir, `case.yaml`/`prompt.md` + `graders/*.md`, `--trust-plugin`,
  no-plugin baseline arm, sandboxing caveat).

## Resolved at Milestone 3

- **PostToolUse JSON output shape**, confirmed with a focused fetch of hooks.md: use
  `{"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": "..."}}`.
  `additionalContext` on PostToolUse reaches **Claude only** (added to context), not shown
  directly to the user in the transcript — PostToolUse is not in the small list of events
  (`UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, `PostModelSwitch`) where plain stdout
  is shown to Claude either; for those, plain text works too, but we use the same JSON shape on
  both hooks for consistency. Confirmed end-to-end: after a real Write to a file under `docs/`,
  Claude correctly reported "neither check ran" (Vale/markdownlint absent) — the injected context
  reached it.
- **Windows `.cmd` shim resolution**: `spawnSync("vale", ...)` without `shell: true` won't find a
  globally-installed npm CLI tool on Windows, since those install as `.cmd` shims. Didn't want
  `shell: true` (a file path from `tool_input.file_path` could contain shell metacharacters, and
  the "no shell command strings" rule exists for exactly this reason), so `lib/external-tools.mjs`
  retries once with a `.cmd` suffix on `win32`, still via `spawnSync`'s argument array, never a
  shell. Untested on an actual Windows machine — flag this as a real gap for Milestone 8's
  clean-install pass if a Windows environment becomes available; otherwise document it as an
  unverified-on-Windows limitation in the README.
- **`markdownlint` vs `markdownlint-cli2`**: the prompt names "markdownlint" singular, so
  `check-environment.mjs`/`lint-changed-file.mjs` only look for the `markdownlint` binary
  (from `markdownlint-cli`), not `markdownlint-cli2`. Someone with only `markdownlint-cli2`
  installed will see "markdownlint: not found" even though a markdownlint tool is present. Note
  this as a known limitation in the README at Milestone 8 rather than silently supporting both.

## Resolved at Milestone 4

- **`disallowed-tools` collides with staging a sample to execute.** First cut of
  `run-sample.mjs` took a file path argument, so the skill had to Write a temp file before running
  anything — but `verify-samples` sets `disallowed-tools: Write, Edit, NotebookEdit` to keep the
  review read-only, so the Write was denied and opt-in execution could never work. Caught by an
  actual end-to-end run, not by the unit tests, which is the argument for testing skills in a real
  session rather than only testing their scripts. Fix: `run-sample.mjs` reads the sample's code
  from **stdin** and takes only the language as an argument, so the skill pipes code in via a
  quoted heredoc and never needs a write tool. Worth remembering for the remaining skills: any
  read-only skill that needs to hand data to a script must pass it through stdin or argv, never a
  temp file.
- **Heredoc delimiter quoting matters.** The skill instructs a quoted delimiter
  (`<<'DOCS_GATE_SAMPLE'`) so the shell does no expansion on the sample's code — an unquoted
  delimiter would let `$VAR` and backticks in a documentation sample expand before the code ever
  reached the script, both corrupting the sample and running shell substitutions from an untrusted
  page. The skill also tells Claude to pick a different delimiter in the unlikely case a sample
  contains that exact line.
- **Execution safety is real but limited.** `run-sample.mjs` runs the sample in a fresh temp dir
  with `env` reduced to `PATH` (plus `SystemRoot`/`PATHEXT` on Windows), so nothing from the
  parent shell's environment — API keys, tokens — is visible to the sample; verified directly by
  running a sample that prints `process.env.SUPER_SECRET_TOKEN` with that var set in the parent
  (it saw `(not present)`). It also enforces a 10s timeout and truncates output at 10k chars.
  It does **not** block network access — no dependency-free way to do that here, and the plugin
  uses no OS-level sandboxing. Hence the skill's separate confirmation step for anything
  classified `looksNetworkDependent`. Say this plainly in the README's safety model; don't let it
  read as a sandbox.
- **JS-only execution** is a deliberate scope limit for this version (`node --check` for syntax,
  `node` for execution are the only zero-dependency tools available). Every other language reports
  `not-checked` / `not-supported` with the reason. README limitation.

## Resolved at Milestone 5

- **Read-only enforcement for an agent is real, not just prose.** Unlike a skill's
  `allowed-tools` (a pre-approval mechanism, not a restriction — see Milestone 2's notes), a
  subagent's `tools:`/`disallowedTools:` frontmatter genuinely removes tools from its pool.
  Verified directly: asked a delegating session to explicitly instruct fact-checker to edit a
  fixture file to fix a claim it had just found contradicted. The agent made zero tool calls and
  refused in its own words, citing its own instructions; the fixture file was unchanged afterward
  (confirmed by grepping it post-run). This is a stronger guarantee than review-page/verify-samples
  get from their skill-level `disallowed-tools`, which is worth calling out plainly in the README's
  safety model rather than implying all four review-side components are equally enforced.
- **Testing a plugin subagent locally**: there's no `/plugin-name:agent-name` slash-invocation the
  way skills get one. Tested by running a session with `--plugin-dir` and explicitly instructing it
  to delegate via the Agent tool to `docs-gate:fact-checker` (the plugin-scoped name), granting the
  session `Agent` plus fact-checker's own read tools so it doesn't get blocked mid-delegation.
  `claude --agent docs-gate:fact-checker` (running it as the main session) is the other documented
  path but doesn't fit fact-checker's "delegate to it for one sub-task" usage pattern.

## Open items to resolve during milestones, not now
- Exact grader design per eval case (which of the 6 types fits each requirement in "Evals (the
  differentiator)") — Milestone 7.
- Node minimum-supported version statement for the README — pick current LTS at Milestone 8.
- Confirm both marketplace-add command forms (`/plugin marketplace add` vs
  `claude plugin marketplace add`) actually work identically for a local path when we do the
  clean-install test at Milestone 8.
