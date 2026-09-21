import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFrontmatter } from "../../plugins/docs-gate/scripts/lib/frontmatter.mjs";

test("parses simple key: value pairs", () => {
  const text = "---\ntitle: Getting started\nsidebar_position: 1\n---\n# Body\n";
  const { data, body } = parseFrontmatter(text);
  assert.equal(data.title, "Getting started");
  assert.equal(data.sidebar_position, "1");
  assert.equal(body, "# Body\n");
});

test("unquotes single and double quoted values", () => {
  const text = '---\ntitle: "Quoted title"\nsidebar_label: \'Quoted label\'\n---\nBody\n';
  const { data } = parseFrontmatter(text);
  assert.equal(data.title, "Quoted title");
  assert.equal(data.sidebar_label, "Quoted label");
});

test("returns the whole text as body when there is no front matter fence", () => {
  const text = "# Just a heading\n\nSome prose.\n";
  const { data, body } = parseFrontmatter(text);
  assert.deepEqual(data, {});
  assert.equal(body, text);
});

test("skips a value that isn't a simple scalar rather than mis-parsing it", () => {
  const text = "---\ntitle: Fine\ntags:\n  - one\n  - two\n---\nBody\n";
  const { data } = parseFrontmatter(text);
  assert.equal(data.title, "Fine");
  assert.equal("tags" in data, false);
});

test("handles an empty front matter block", () => {
  const text = "---\n---\nBody\n";
  const { data, body } = parseFrontmatter(text);
  assert.deepEqual(data, {});
  assert.equal(body, "Body\n");
});
