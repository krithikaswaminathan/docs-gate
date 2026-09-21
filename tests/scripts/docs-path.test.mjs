import { test } from "node:test";
import assert from "node:assert/strict";
import { isMarkdownFile, isWithinDocsRoot } from "../../plugins/docs-gate/scripts/lib/docs-path.mjs";

test("isMarkdownFile accepts .md and .mdx, case-insensitively", () => {
  assert.equal(isMarkdownFile("/repo/docs/guide.md"), true);
  assert.equal(isMarkdownFile("/repo/docs/guide.MDX"), true);
});

test("isMarkdownFile rejects other extensions and extensionless files", () => {
  assert.equal(isMarkdownFile("/repo/docs/guide.txt"), false);
  assert.equal(isMarkdownFile("/repo/docs/guide"), false);
});

test("isWithinDocsRoot accepts files at and under the configured root", () => {
  assert.equal(isWithinDocsRoot("/repo/docs/guide.md", "/repo", "docs"), true);
  assert.equal(isWithinDocsRoot("/repo/docs/nested/guide.md", "/repo", "docs"), true);
});

test("isWithinDocsRoot rejects files outside the configured root", () => {
  assert.equal(isWithinDocsRoot("/repo/README.md", "/repo", "docs"), false);
  assert.equal(isWithinDocsRoot("/repo/other-docs/guide.md", "/repo", "docs"), false);
});

test("isWithinDocsRoot rejects a root-looking prefix that isn't actually the root", () => {
  // "docs-internal" must not match a configured root of "docs".
  assert.equal(isWithinDocsRoot("/repo/docs-internal/guide.md", "/repo", "docs"), false);
});

test("isWithinDocsRoot rejects paths that escape the project dir", () => {
  assert.equal(isWithinDocsRoot("/etc/passwd", "/repo", "docs"), false);
});

test("isWithinDocsRoot treats backslash (Windows-style) paths the same as forward-slash paths", () => {
  assert.equal(isWithinDocsRoot("C:\\repo\\docs\\guide.md", "C:\\repo", "docs"), true);
  assert.equal(isWithinDocsRoot("C:\\repo\\README.md", "C:\\repo", "docs"), false);
});
