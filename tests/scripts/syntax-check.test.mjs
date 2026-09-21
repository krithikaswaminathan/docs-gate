import { test } from "node:test";
import assert from "node:assert/strict";
import { checkSyntax } from "../../plugins/docs-gate/scripts/lib/syntax-check.mjs";

test("passes valid JavaScript", () => {
  const result = checkSyntax("js", "const x = 1;\nfunction f() { return x; }");
  assert.equal(result.status, "pass");
});

test("fails JavaScript with a syntax error", () => {
  const result = checkSyntax("javascript", "function f( { return 1; }");
  assert.equal(result.status, "fail");
  assert.match(result.detail, /SyntaxError|Unexpected/i);
});

test("does not execute the JavaScript sample -- a runtime error doesn't fail the syntax check", () => {
  // Throwing at the top level is a runtime concern, not a syntax error.
  // `node --check` must not run this, or the process itself would crash.
  const result = checkSyntax("js", "throw new Error('should never actually run');");
  assert.equal(result.status, "pass");
});

test("passes valid JSON", () => {
  const result = checkSyntax("json", '{"a": 1, "b": [1, 2, 3]}');
  assert.equal(result.status, "pass");
});

test("fails invalid JSON", () => {
  const result = checkSyntax("json", "{a: 1,}");
  assert.equal(result.status, "fail");
});

test("reports not-checked for a language with no bundled parser", () => {
  const result = checkSyntax("python", "def f():\n    return 1");
  assert.equal(result.status, "not-checked");
  assert.match(result.detail, /python/i);
});

test("reports not-checked for a missing language tag", () => {
  const result = checkSyntax("", "some text");
  assert.equal(result.status, "not-checked");
});
