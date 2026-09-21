import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { walkDocsTree } from "../../plugins/docs-gate/scripts/lib/docs-tree.mjs";

function makeDocsFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "docs-tree-test-"));
  mkdirSync(path.join(root, "guides"), { recursive: true });
  mkdirSync(path.join(root, "node_modules", "ignored-pkg"), { recursive: true });
  writeFileSync(path.join(root, "intro.md"), "---\ntitle: Intro\n---\nHello\n");
  writeFileSync(path.join(root, "guides", "setup.mdx"), "No front matter here.\n");
  writeFileSync(
    path.join(root, "guides", "_category_.json"),
    JSON.stringify({ label: "Guides", position: 2 })
  );
  writeFileSync(path.join(root, "guides", "notes.txt"), "not markdown, should be ignored");
  writeFileSync(path.join(root, "node_modules", "ignored-pkg", "readme.md"), "should be ignored");
  return root;
}

test("walks markdown/mdx files and ignores non-markdown and ignored directories", () => {
  const root = makeDocsFixture();
  try {
    const { files } = walkDocsTree(root);
    const relPaths = files.map((f) => f.relPath).sort();
    assert.deepEqual(relPaths, ["guides/setup.mdx", "intro.md"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("reads front matter title and falls back to base name", () => {
  const root = makeDocsFixture();
  try {
    const { files } = walkDocsTree(root);
    const intro = files.find((f) => f.relPath === "intro.md");
    const setup = files.find((f) => f.relPath === "guides/setup.mdx");
    assert.equal(intro.title, "Intro");
    assert.equal(setup.title, "setup");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("reports depth relative to the docs root", () => {
  const root = makeDocsFixture();
  try {
    const { files } = walkDocsTree(root);
    const intro = files.find((f) => f.relPath === "intro.md");
    const setup = files.find((f) => f.relPath === "guides/setup.mdx");
    assert.equal(intro.depth, 0);
    assert.equal(setup.depth, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("collects _category_.json files", () => {
  const root = makeDocsFixture();
  try {
    const { categoryFiles } = walkDocsTree(root);
    assert.equal(categoryFiles.length, 1);
    assert.equal(categoryFiles[0].dirPath, "guides");
    assert.equal(categoryFiles[0].label, "Guides");
    assert.equal(categoryFiles[0].position, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("returns empty results for a docs root that doesn't exist", () => {
  const result = walkDocsTree(path.join(tmpdir(), "docs-gate-does-not-exist-xyz"));
  assert.deepEqual(result, { files: [], categoryFiles: [] });
});
