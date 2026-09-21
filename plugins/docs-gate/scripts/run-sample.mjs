#!/usr/bin/env node
/**
 * CLI for verify-samples' opt-in execution mode. Runs ONE JavaScript
 * code sample, read from stdin, in a fresh temporary directory, with a
 * stripped-down environment (PATH and a couple of OS essentials only --
 * no inherited API keys, tokens, or other credentials) and a hard
 * timeout. Only ever invoked after the user has explicitly confirmed
 * running this specific sample for this run -- see the verify-samples
 * skill.
 *
 * Code comes in via stdin, not a file path argument, so the calling
 * skill never needs the Write tool (which verify-samples disallows, to
 * keep the review itself read-only) just to stage a sample to run.
 *
 * This is a best-effort safety measure, not a real sandbox: it strips
 * environment variables, but it can't block network access without a
 * dependency or OS-level sandboxing, neither of which this plugin uses.
 * The verify-samples skill is responsible for not calling this on a
 * sample classified as network-dependent unless the user separately
 * confirmed that's acceptable -- see DEV-NOTES.md.
 *
 * Usage: node run-sample.mjs <language>   (code read from stdin)
 * Output: one JSON object on stdout:
 *   { status: "pass" | "fail" | "not-supported", detail, stdout, stderr, exitCode }
 * Exit codes: always 0 -- the sample's own failure is reported in the
 * JSON, not via this script's own exit code.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const JS_LANGUAGES = new Set(["js", "javascript", "mjs", "cjs", "node", "nodejs"]);
const TIMEOUT_MS = 10_000;
const MAX_OUTPUT_CHARS = 10_000;

function report(result) {
  process.stdout.write(JSON.stringify({ stdout: "", stderr: "", exitCode: null, ...result }));
  process.exit(0);
}

function truncate(text) {
  if (!text) return "";
  return text.length > MAX_OUTPUT_CHARS ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n...[truncated]` : text;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

async function main() {
  const language = process.argv[2];

  if (!language) {
    report({ status: "fail", detail: "Usage: node run-sample.mjs <language>  (code read from stdin)" });
  }

  if (!JS_LANGUAGES.has(language.toLowerCase())) {
    report({
      status: "not-supported",
      detail: `Opt-in execution only supports JavaScript samples in this version, not "${language}".`,
    });
  }

  const code = await readStdin();

  const runDir = mkdtempSync(path.join(tmpdir(), "docs-gate-run-"));
  const runFile = path.join(runDir, "sample.mjs");

  // Carry over only what the OS needs to spawn a process at all -- never
  // anything that could be an application credential from the parent shell.
  const sanitizedEnv = { PATH: process.env.PATH };
  if (process.platform === "win32") {
    sanitizedEnv.SystemRoot = process.env.SystemRoot;
    sanitizedEnv.PATHEXT = process.env.PATHEXT;
  }

  try {
    writeFileSync(runFile, code, "utf8");
    const result = spawnSync(process.execPath, [runFile], {
      cwd: runDir,
      encoding: "utf8",
      env: sanitizedEnv,
      timeout: TIMEOUT_MS,
    });

    if (result.error && result.error.code === "ETIMEDOUT") {
      report({
        status: "fail",
        detail: `Timed out after ${TIMEOUT_MS}ms.`,
        stdout: truncate(result.stdout),
        stderr: truncate(result.stderr),
      });
    }

    report({
      status: result.status === 0 ? "pass" : "fail",
      detail: result.status === 0 ? "Ran successfully." : `Exited with status ${result.status}.`,
      stdout: truncate(result.stdout),
      stderr: truncate(result.stderr),
      exitCode: result.status,
    });
  } finally {
    try {
      rmSync(runDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }
}

main();
