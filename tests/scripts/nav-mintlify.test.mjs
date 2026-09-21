import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMintlifyNav } from "../../plugins/docs-gate/scripts/lib/nav-mintlify.mjs";

test("extracts pages under a navigation.group array", () => {
  const { entries } = parseMintlifyNav({
    navigation: [{ group: "Getting Started", pages: ["quickstart", "installation"] }],
  });
  const pages = entries.filter((e) => e.kind === "page");
  assert.deepEqual(
    pages.map((e) => e.slug),
    ["quickstart", "installation"]
  );
});

test("handles nested groups inside pages", () => {
  const { entries } = parseMintlifyNav({
    navigation: [
      {
        group: "Guides",
        pages: ["guides/overview", { group: "Advanced", pages: ["guides/advanced/one"] }],
      },
    ],
  });
  const pages = entries.filter((e) => e.kind === "page");
  assert.deepEqual(
    pages.map((e) => e.slug),
    ["guides/overview", "guides/advanced/one"]
  );
  const advanced = pages.find((e) => e.slug === "guides/advanced/one");
  assert.equal(advanced.depth, 0); // "pages" nesting doesn't add depth, only tabs/groups do
});

test("handles tabs containing groups", () => {
  const { entries } = parseMintlifyNav({
    navigation: {
      tabs: [{ tab: "Docs", groups: [{ group: "Intro", pages: ["intro"] }] }],
    },
  });
  const pages = entries.filter((e) => e.kind === "page");
  assert.deepEqual(
    pages.map((e) => e.slug),
    ["intro"]
  );
});

test("falls back to a top-level array when there's no navigation key", () => {
  const { entries } = parseMintlifyNav([{ group: "Top", pages: ["a", "b"] }]);
  const pages = entries.filter((e) => e.kind === "page");
  assert.deepEqual(
    pages.map((e) => e.slug),
    ["a", "b"]
  );
});

test("notes an unrecognized node shape instead of guessing", () => {
  const { entries, notes } = parseMintlifyNav({ navigation: [{ weird: "shape" }] });
  assert.equal(entries[0].kind, "unknown");
  assert.ok(notes.some((n) => n.includes("Unrecognized")));
});

test("reports no navigation field found", () => {
  const { entries, notes } = parseMintlifyNav({ somethingElse: true });
  assert.deepEqual(entries, []);
  assert.ok(notes[0].includes("navigation"));
});
