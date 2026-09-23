import { test } from "node:test";
import assert from "node:assert/strict";
import { detectTool, runTool, parseValeOutput } from "../../plugins/docs-gate/scripts/lib/external-tools.mjs";

// process.execPath is a real, always-present executable on every platform
// this test runs on, so it stands in for "an installed linter" without
// depending on Vale or markdownlint actually being installed.
const REAL_BINARY = process.execPath;
const FAKE_BINARY = "docs-gate-definitely-not-a-real-binary-xyz123";

test("detectTool reports unavailable for a command that doesn't exist", () => {
  const result = detectTool(FAKE_BINARY);
  assert.deepEqual(result, { available: false });
});

test("detectTool reports available with a version for a real binary", () => {
  const result = detectTool(REAL_BINARY, ["--version"]);
  assert.equal(result.available, true);
  assert.match(result.version, /^v\d+\.\d+\.\d+/);
});

test("runTool captures combined output from a real command", () => {
  const result = runTool(REAL_BINARY, ["-e", "console.log('hello from test')"]);
  assert.equal(result.available, true);
  assert.match(result.output, /hello from test/);
});

test("runTool reports unavailable for a command that doesn't exist", () => {
  const result = runTool(FAKE_BINARY, ["--version"]);
  assert.deepEqual(result, { available: false });
});

// parseValeOutput's fixtures below are the exact stdout/stderr payloads
// captured from a real Vale 3.9.6 binary (`vale --output=JSON <file>`),
// not hand-invented -- this is the regression test for a real bug found by
// actually running Vale: a runtime/config error (no .vale.ini) writes its
// JSON to STDERR with an empty stdout, which an earlier version of this
// parser missed entirely by only ever looking at stdout, silently
// reporting "ran clean" for every unconfigured install.

test("parseValeOutput reports a clean run as an empty findings array", () => {
  const result = parseValeOutput({ stdout: "{}\n", stderr: "" });
  assert.deepEqual(result, { findings: [] });
});

test("parseValeOutput extracts real alerts from a successful run", () => {
  const stdout = JSON.stringify({
    "dirty.md": [
      { Line: 3, Severity: "error", Check: "Vale.Repetition", Message: "'is' is repeated!" },
    ],
  });
  const result = parseValeOutput({ stdout, stderr: "" });
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].Message, "'is' is repeated!");
});

test("parseValeOutput treats a stderr-only runtime error as 'nothing to report', not a finding", () => {
  const stderr = JSON.stringify({
    Line: 0,
    Path: "",
    Text: "E100 [.vale.ini not found] Runtime error\n\nno config file found\n\nExecution stopped with code 1.",
    Code: "E100",
    Span: 0,
  });
  const result = parseValeOutput({ stdout: "", stderr });
  assert.equal(result.findings, null);
  assert.match(result.error, /E100/);
  assert.match(result.error, /no config file found/);
});

test("parseValeOutput falls back to a generic message for unparseable output", () => {
  const result = parseValeOutput({ stdout: "not json", stderr: "" });
  assert.equal(result.findings, null);
  assert.match(result.error, /couldn't parse/);
});
