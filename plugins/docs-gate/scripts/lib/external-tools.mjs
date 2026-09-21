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
