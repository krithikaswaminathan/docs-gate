/**
 * Detects and invokes optional external linters (Vale, markdownlint) that
 * docs-gate never bundles or installs -- see DEV-NOTES.md and CLAUDE.md.
 * Always spawns with an argument array, never `shell: true`, so a file
 * path containing shell metacharacters can't be interpreted as a command.
 *
 * On Windows, globally-installed npm CLI tools are usually `.cmd` shims
 * that spawnSync can't resolve by bare name without `shell: true`, so both
 * helpers retry once with a `.cmd` suffix (still no shell) before giving up.
 *
 * Exports:
 * - detectTool(command, versionArgs = ["--version"]): probes whether a
 *   binary is on PATH. Returns { available: false } or
 *   { available: true, version } where version is the first line of
 *   combined stdout/stderr, if any.
 * - runTool(command, args): runs a binary against real arguments (for
 *   example a file path to lint). Returns { available: false } or
 *   { available: true, output } where output is combined stdout/stderr
 *   trimmed, or null when the command produced nothing.
 * - runVale(filePath): Vale-specific -- plain runTool() can't be used for
 *   Vale because Vale conflates three different situations in its text
 *   output and exit code, none of which is "missing binary":
 *     - exit 0 with a real config: no alerts, but still prints a non-empty
 *       "0 errors..." summary line -- runTool would treat this truthy
 *       output as a finding to report, when there's nothing to report.
 *     - exit 2 when no .vale.ini is present (docs-gate never ships one):
 *       a runtime/config error, not a documentation defect, but runTool
 *       can't tell it apart from real findings -- it isn't an ENOENT, so
 *       `available` comes back true and the error text gets reported
 *       verbatim as if Vale had found a problem with the page.
 *     - exit 1 with real alerts: the one case that should actually be
 *       reported.
 *   Verified against a real Vale 3.9.6 binary: `vale --output=JSON` turns
 *   all three into an unambiguous shape (see below), so this parses that
 *   instead of scraping the human-readable text runTool captures.
 *   Returns:
 *     { available: false } -- vale isn't on PATH.
 *     { available: true, findings: [] } -- ran cleanly, nothing to report.
 *     { available: true, findings: [...] } -- real alerts (each item has
 *       at least Line, Severity, Check, Message from Vale's JSON schema).
 *     { available: true, findings: null, error } -- Vale ran but couldn't
 *       actually lint (e.g. no .vale.ini found, or output docs-gate
 *       couldn't parse) -- `error` is a short human-readable reason.
 *       Callers should treat this like "nothing to report" for per-edit
 *       noise (it isn't a documentation defect), while still being able to
 *       surface it distinctly where that's useful (e.g. environment checks).
 * - parseValeOutput({ stdout, stderr }): the pure decision logic behind
 *   runVale, split out so it's testable with synthetic strings instead of a
 *   real Vale binary -- see tests/scripts/external-tools.test.mjs, which
 *   pins it against the exact payload shapes captured from a real Vale
 *   3.9.6 run (clean, real findings, and the no-config error).
 */

import { spawnSync } from "node:child_process";

function trySpawn(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error && result.error.code === "ENOENT") {
    if (process.platform === "win32" && !command.toLowerCase().endsWith(".cmd")) {
      return spawnSync(`${command}.cmd`, args, { encoding: "utf8" });
    }
  }
  return result;
}

function isMissing(result) {
  return Boolean(result.error && result.error.code === "ENOENT");
}

export function detectTool(command, versionArgs = ["--version"]) {
  const result = trySpawn(command, versionArgs);
  if (isMissing(result)) {
    return { available: false };
  }
  const text = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  return { available: true, version: text.split("\n")[0] || undefined };
}

export function runTool(command, args) {
  const result = trySpawn(command, args);
  if (isMissing(result)) {
    return { available: false };
  }
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  return { available: true, output: output || null };
}

export function parseValeOutput({ stdout, stderr }) {
  // Verified against a real Vale 3.9.6 binary: a successful run (clean or
  // with real alerts) writes its JSON to stdout with an empty stderr; a
  // runtime/config error (e.g. missing .vale.ini) writes its JSON to
  // stderr instead, with an EMPTY stdout. Parsing stdout alone silently
  // treats every runtime error as "ran clean" (stdout is "", which falls
  // back to the "{}" default below) -- try stdout first, then stderr.
  let parsed;
  try {
    parsed = JSON.parse(stdout && stdout.trim() ? stdout : stderr || "{}");
  } catch {
    const raw = [stdout, stderr].filter(Boolean).join("\n").trim();
    return {
      findings: null,
      error: raw
        ? `Vale produced output docs-gate couldn't parse as JSON: ${raw.slice(0, 500)}`
        : "Vale produced no parseable output.",
    };
  }

  // Vale's own runtime-error shape is a single object with a `Code` field
  // (e.g. "E100"), not the {"<path>": [...]} shape a real lint run
  // produces -- this is how a missing .vale.ini surfaces.
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "Code" in parsed) {
    return {
      findings: null,
      error: parsed.Text || `Vale reported error ${parsed.Code}.`,
    };
  }

  return { findings: Object.values(parsed).flat() };
}

export function runVale(filePath) {
  const result = trySpawn("vale", ["--output=JSON", filePath]);
  if (isMissing(result)) {
    return { available: false };
  }
  return { available: true, ...parseValeOutput({ stdout: result.stdout, stderr: result.stderr }) };
}
