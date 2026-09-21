#!/usr/bin/env node
/**
 * Opt-in tier-3 fallback for review-ia: actually EXECUTES a
 * sidebars.js file (by `require`-ing it in a separate child process)
 * when the static parser in sidebars-js-static.mjs couldn't parse it.
 * This is the only place in docs-gate that runs code from the docs
 * repo under review. Per the project's security requirements (see
 * docs-gate-claude-code-prompt.md and DEV-NOTES.md), this script must
 * only ever be invoked after the user has explicitly confirmed it for
 * this specific run -- the review-ia skill is responsible for getting
 * that confirmation and for showing the user the warning below before
 * calling this.
 *
 * Requires a `--confirmed` flag as a defensive guardrail: the skill
 * must pass it, and is instructed to only do so after real user
 * confirmation in the conversation -- this flag is not itself proof of
 * consent, just a way to make an accidental/unconfirmed call fail loud
 * instead of silently executing repo code.
 *
 * The child process runs with its cwd set to the sidebars.js file's own
 * directory (relative requires inside it, such as requiring a
 * generated-sidebar module, need this to resolve), and with environment
 * variables reduced to what a Node process needs to start at all -- no
 * inherited credentials from the parent shell.
 *
 * Usage: node execute-sidebars.mjs <path-to-sidebars.js> --confirmed
 * Output: one JSON object on stdout:
 *   { status: "pass" | "fail", detail, value?, stderr? }
 *   `value` is the required module's default/module.exports value,
 *   only present when status is "pass".
 * Exit codes: always 0 -- a failure to execute is reported in the
 * JSON, not via this script's own exit code, EXCEPT for a missing
 * --confirmed flag or missing file, which exit 1 since those are usage
 * errors, not something for the caller to parse as a review finding.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const TIMEOUT_MS = 10_000;

const args = process.argv.slice(2);
const confirmed = args.includes("--confirmed");
const sidebarsPath = args.find((a) => a !== "--confirmed");

if (!sidebarsPath) {
  console.error("Usage: node execute-sidebars.mjs <path-to-sidebars.js> --confirmed");
  process.exit(1);
}
if (!confirmed) {
  console.error(
    "Refusing to run: pass --confirmed. This executes code from the repo under review and must only be called after explicit user confirmation for this run."
  );
  process.exit(1);
}

const absSidebarsPath = path.resolve(sidebarsPath);
if (!existsSync(absSidebarsPath)) {
  console.error(`File not found: ${absSidebarsPath}`);
  process.exit(1);
}

// Carry over only what the OS needs to spawn a process and resolve
// requires -- never anything that could be an application credential
// from the parent shell.
const sanitizedEnv = { PATH: process.env.PATH, NODE_PATH: process.env.NODE_PATH };
if (process.platform === "win32") {
  sanitizedEnv.SystemRoot = process.env.SystemRoot;
  sanitizedEnv.PATHEXT = process.env.PATHEXT;
}

const wrapper = `
  try {
    const mod = require(process.argv[1]);
    process.stdout.write(JSON.stringify({ status: "pass", detail: "Executed and required successfully.", value: mod }));
  } catch (error) {
    process.stdout.write(JSON.stringify({ status: "fail", detail: error.message }));
  }
`;

const result = spawnSync(process.execPath, ["-e", wrapper, "--", absSidebarsPath], {
  cwd: path.dirname(absSidebarsPath),
  encoding: "utf8",
  env: sanitizedEnv,
  timeout: TIMEOUT_MS,
});

if (result.error && result.error.code === "ETIMEDOUT") {
  process.stdout.write(JSON.stringify({ status: "fail", detail: `Timed out after ${TIMEOUT_MS}ms.` }));
  process.exit(0);
}

if (result.status !== 0 && !result.stdout) {
  process.stdout.write(
    JSON.stringify({
      status: "fail",
      detail: `Child process exited with status ${result.status}.`,
      stderr: (result.stderr || "").trim().slice(0, 2000),
    })
  );
  process.exit(0);
}

// The wrapper always writes valid JSON to stdout on both its own success
// and failure paths, so we pass it through as-is.
process.stdout.write(result.stdout);
process.exit(0);
