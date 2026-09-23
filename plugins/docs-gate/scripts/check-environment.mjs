#!/usr/bin/env node
/**
 * SessionStart hook: report which optional docs-linting tools (Vale,
 * markdownlint) are on PATH, and the Node version docs-gate's scripts are
 * running under. docs-gate never installs anything itself -- see
 * DEV-NOTES.md and CLAUDE.md -- it only detects and reports.
 *
 * Input: hook JSON on stdin (unread -- nothing in SessionStart's fields
 * changes what this script checks).
 * Output: JSON on stdout:
 *   { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext } }
 * Exit codes: always 0 -- this hook never blocks session start.
 */

import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { detectTool, runVale } from "./lib/external-tools.mjs";
import { buildEnvironmentReport } from "./lib/environment-report.mjs";

const vale = detectTool("vale");
if (vale.available) {
  // `vale --version` succeeding only means the binary is on PATH -- Vale
  // also needs a .vale.ini to do anything, which docs-gate never ships (see
  // DEV-NOTES.md). Probe with a real, throwaway file so the report doesn't
  // call Vale "available" when every real invocation will error instead of
  // linting -- see runVale's doc comment in external-tools.mjs for how that
  // error is told apart from real findings.
  const scratchDir = mkdtempSync(path.join(tmpdir(), "docs-gate-vale-check-"));
  const scratchFile = path.join(scratchDir, "probe.md");
  writeFileSync(scratchFile, "# Probe\n\nDocs-gate environment probe.\n");
  const probe = runVale(scratchFile);
  rmSync(scratchDir, { recursive: true, force: true });
  vale.configured = probe.findings !== null;
  if (!vale.configured) vale.configError = probe.error;
}
const markdownlint = detectTool("markdownlint");

const report = buildEnvironmentReport({
  nodeVersion: process.version,
  vale,
  markdownlint,
});

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: report,
    },
  })
);
process.exit(0);
