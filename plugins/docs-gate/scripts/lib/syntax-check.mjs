/**
 * Zero-dependency syntax validation for extracted code blocks. Only
 * checks languages Node can parse without executing top-level code:
 * JavaScript (via `node --check`, which parses without running -- this
 * is the flag's documented purpose) and JSON (via JSON.parse, which
 * never executes anything). Every other language is reported as
 * not-checked -- docs-gate bundles no other parsers, per the "no npm
 * dependencies" rule (see DEV-NOTES.md).
 *
 * Exports:
 * - checkSyntax(language, code): returns
 *   { status: "pass" | "fail" | "not-checked", detail }.
 */

import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const JS_LANGUAGES = new Set(["js", "javascript", "mjs", "cjs", "node", "nodejs"]);
const JSON_LANGUAGES = new Set(["json"]);

export function checkSyntax(language, code) {
  const normalized = (language || "").toLowerCase();

  if (JSON_LANGUAGES.has(normalized)) {
    try {
      JSON.parse(code);
      return { status: "pass", detail: "Valid JSON." };
    } catch (error) {
      return { status: "fail", detail: `Invalid JSON: ${error.message}` };
    }
  }

  if (JS_LANGUAGES.has(normalized)) {
    const dir = mkdtempSync(path.join(tmpdir(), "docs-gate-syntax-"));
    const file = path.join(dir, "sample.js");
    try {
      writeFileSync(file, code, "utf8");
      const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
      if (result.status === 0) {
        return { status: "pass", detail: "`node --check` found no syntax errors." };
      }
      const detail = (result.stderr || "Unknown syntax error.").trim();
      return { status: "fail", detail };
    } finally {
      try {
        unlinkSync(file);
      } catch {
        // best-effort cleanup
      }
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  }

  return {
    status: "not-checked",
    detail: `No zero-dependency parser available for "${language || "(no language tag)"}".`,
  };
}
