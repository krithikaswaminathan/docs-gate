import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyBlock } from "../../plugins/docs-gate/scripts/lib/sample-classify.mjs";

function block(overrides) {
  return { index: 0, language: "", code: "", startLine: 1, endLine: 1, precedingHeading: null, ...overrides };
}

test("flags a block with no language tag", () => {
  const result = classifyBlock(block({ language: "", code: "x = 1" }));
  assert.equal(result.hasLanguageTag, false);
});

test("flags a block with a language tag", () => {
  const result = classifyBlock(block({ language: "js", code: "x = 1;" }));
  assert.equal(result.hasLanguageTag, true);
});

test("classifies known output languages as looksLikeOutput", () => {
  for (const lang of ["text", "output", "console"]) {
    const result = classifyBlock(block({ language: lang, code: "$ npm install\n+ done" }));
    assert.equal(result.looksLikeOutput, true, `expected ${lang} to be output-like`);
  }
});

test("does not classify a normal code language as output", () => {
  const result = classifyBlock(block({ language: "js", code: "const x = 1;" }));
  assert.equal(result.looksLikeOutput, false);
});

test("detects a YOUR_-style placeholder", () => {
  const result = classifyBlock(block({ language: "bash", code: "export API_KEY=YOUR_API_KEY_HERE" }));
  assert.ok(result.placeholders.some((p) => p.match === "YOUR_API_KEY_HERE"));
});

test("detects an angle-bracket placeholder", () => {
  const result = classifyBlock(block({ language: "bash", code: "curl -H 'Authorization: <your-token>'" }));
  assert.ok(result.placeholders.some((p) => p.label === "angle-bracket placeholder"));
});

test("does not flag a generic-type angle bracket as a placeholder", () => {
  const result = classifyBlock(block({ language: "ts", code: "const items: Array<string> = [];" }));
  assert.deepEqual(result.placeholders, []);
});

test("detects a your-...-here style placeholder", () => {
  const result = classifyBlock(block({ language: "bash", code: 'export TOKEN="your-api-key-here"' }));
  assert.ok(result.placeholders.some((p) => p.match.toLowerCase() === "your-api-key-here"));
});

test("reports no placeholders for clean code", () => {
  const result = classifyBlock(block({ language: "js", code: "const sum = (a, b) => a + b;" }));
  assert.deepEqual(result.placeholders, []);
});

test("flags fetch() as network-dependent", () => {
  const result = classifyBlock(block({ language: "js", code: 'await fetch("https://api.example.com");' }));
  assert.equal(result.looksNetworkDependent, true);
});

test("flags a Python requests call as network-dependent", () => {
  const result = classifyBlock(block({ language: "python", code: "requests.get('https://api.example.com')" }));
  assert.equal(result.looksNetworkDependent, true);
});

test("does not flag ordinary code as network-dependent", () => {
  const result = classifyBlock(block({ language: "js", code: "const sum = (a, b) => a + b;" }));
  assert.equal(result.looksNetworkDependent, false);
});
