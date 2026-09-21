import { test } from "node:test";
import assert from "node:assert/strict";
import { extractCodeBlocks } from "../../plugins/docs-gate/scripts/lib/code-blocks.mjs";

test("extracts a single fenced block with a language tag", () => {
  const md = ["# Title", "", "```js", "const x = 1;", "```", ""].join("\n");
  const blocks = extractCodeBlocks(md);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].language, "js");
  assert.equal(blocks[0].code, "const x = 1;");
  assert.equal(blocks[0].precedingHeading, "Title");
});

test("extracts multiple blocks and tracks the nearest preceding heading for each", () => {
  const md = [
    "# Intro",
    "## Step 1",
    "```bash",
    "npm install",
    "```",
    "## Step 2",
    "```js",
    "run();",
    "```",
  ].join("\n");
  const blocks = extractCodeBlocks(md);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].precedingHeading, "Step 1");
  assert.equal(blocks[1].precedingHeading, "Step 2");
});

test("handles a fence with no info string as an empty language", () => {
  const md = ["```", "plain text", "```"].join("\n");
  const blocks = extractCodeBlocks(md);
  assert.equal(blocks[0].language, "");
});

test("handles an unterminated fence by running to the end of the document", () => {
  const md = ["```js", "const x = 1;", "let y = 2;"].join("\n");
  const blocks = extractCodeBlocks(md);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].code, "const x = 1;\nlet y = 2;");
});

test("requires a closing fence at least as long as the opening fence", () => {
  const md = ["````js", "```", "still inside", "````"].join("\n");
  const blocks = extractCodeBlocks(md);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].code, "```\nstill inside");
});

test("does not treat headings inside a code block as headings", () => {
  const md = ["## Real heading", "```md", "# Not a real heading", "```", "```js", "x;", "```"].join("\n");
  const blocks = extractCodeBlocks(md);
  assert.equal(blocks[1].precedingHeading, "Real heading");
});

test("returns an empty array for text with no code fences", () => {
  const blocks = extractCodeBlocks("# Just a heading\n\nSome prose.\n");
  assert.deepEqual(blocks, []);
});

test("reports 1-based start and end line numbers at the fence lines", () => {
  const md = ["line 1", "```js", "code", "```", "line 5"].join("\n");
  const blocks = extractCodeBlocks(md);
  assert.equal(blocks[0].startLine, 2);
  assert.equal(blocks[0].endLine, 4);
});
