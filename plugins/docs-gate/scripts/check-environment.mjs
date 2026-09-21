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

import { detectTool } from "./lib/external-tools.mjs";
import { buildEnvironmentReport } from "./lib/environment-report.mjs";

const vale = detectTool("vale");
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
