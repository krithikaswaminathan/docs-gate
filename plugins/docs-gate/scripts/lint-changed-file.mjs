#!/usr/bin/env node
/**
 * PostToolUse (Edit|Write) hook: when the changed file is Markdown/MDX
 * under the configured docs_root, lint it with whatever of Vale /
 * markdownlint are on PATH and report findings back to Claude. Silent
 * (empty stdout, exit 0) when the file is out of scope, both tools are
 * absent, or neither found anything -- this hook only ever observes, it
 * never edits the file itself.
 *
 * Input: hook JSON on stdin -- reads tool_input.file_path and cwd.
 * Config: reads the docs_root plugin option from
 * CLAUDE_PLUGIN_OPTION_DOCS_ROOT (default "docs") and the project root
 * from CLAUDE_PROJECT_DIR.
 * Output: silent stdout, or JSON:
 *   { hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext } }
 * Exit codes: always 0 -- this hook never blocks or undoes the edit.
 */

import { runTool, runVale } from "./lib/external-tools.mjs";
import { isMarkdownFile, isWithinDocsRoot } from "./lib/docs-path.mjs";

function formatValeFindings(findings) {
  return findings
    .map((f) => `- line ${f.Line ?? "?"}: [${f.Severity ?? "?"}] ${f.Message ?? ""} (${f.Check ?? "?"})`)
    .join("\n");
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
  const raw = await readStdin();

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
    return;
  }

  const filePath = input?.tool_input?.file_path;
  if (!filePath || !isMarkdownFile(filePath)) {
    process.exit(0);
    return;
  }

  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const docsRoot = process.env.CLAUDE_PLUGIN_OPTION_DOCS_ROOT || "docs";
  if (!isWithinDocsRoot(filePath, projectDir, docsRoot)) {
    process.exit(0);
    return;
  }

  const vale = runVale(filePath);
  const markdownlint = runTool("markdownlint", [filePath]);

  const sections = [];
  // vale.error means Vale ran but couldn't actually lint (most commonly: no
  // .vale.ini, which docs-gate never ships) -- that's not a documentation
  // defect, so it stays out of per-edit noise the same as "found nothing."
  // check-environment.mjs's SessionStart report is where an unconfigured
  // Vale gets surfaced instead.
  if (vale.available && vale.findings && vale.findings.length > 0) {
    sections.push(`Vale:\n${formatValeFindings(vale.findings)}`);
  }
  if (markdownlint.available && markdownlint.output) {
    sections.push(`markdownlint:\n${markdownlint.output}`);
  }

  if (sections.length === 0) {
    process.exit(0);
    return;
  }

  const report = [
    `docs-gate lint findings for ${filePath} (observed only -- nothing was changed):`,
    ...sections,
  ].join("\n\n");

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: report,
      },
    })
  );
  process.exit(0);
}

main();
