import { test } from "node:test";
import assert from "node:assert/strict";
import { detectTool, runTool } from "../../plugins/docs-gate/scripts/lib/external-tools.mjs";

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
