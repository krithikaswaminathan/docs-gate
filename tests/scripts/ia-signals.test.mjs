import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSlug,
  computeOrphanCandidates,
  computeDepthSignals,
  computeNamingSignals,
  computeExpectedPageSignals,
} from "../../plugins/docs-gate/scripts/lib/ia-signals.mjs";

function file(relPath, overrides = {}) {
  const dirParts = relPath.split("/").slice(0, -1);
  const baseName = relPath.split("/").pop().replace(/\.(mdx?|MDX?)$/, "");
  return { relPath, depth: dirParts.length, dirParts, baseName, title: baseName, ...overrides };
}

test("normalizeSlug strips extension and lowercases", () => {
  assert.equal(normalizeSlug("Guides/Setup.MDX"), "guides/setup");
});

test("normalizeSlug collapses a trailing /index and bare index", () => {
  assert.equal(normalizeSlug("guides/index.md"), "guides");
  assert.equal(normalizeSlug("index.md"), "");
});

test("computeOrphanCandidates flags files not covered by any referenced slug", () => {
  const files = [file("intro.md"), file("guides/setup.mdx"), file("guides/orphan.md")];
  const referenced = new Set(["intro", "guides/setup"]);
  const orphans = computeOrphanCandidates(files, referenced);
  assert.deepEqual(
    orphans.map((o) => o.relPath),
    ["guides/orphan.md"]
  );
});

test("computeDepthSignals flags files at or beyond the threshold", () => {
  const files = [file("a.md"), file("b/c.md"), file("b/c/d.md"), file("b/c/d/e.md")];
  const signals = computeDepthSignals(files, 3);
  assert.deepEqual(
    signals.map((s) => s.relPath),
    ["b/c/d/e.md"]
  );
});

test("computeNamingSignals flags mixed separator conventions among siblings", () => {
  const files = [file("guides/getting-started.md"), file("guides/quick_setup.md")];
  const { mixedConventions } = computeNamingSignals(files);
  assert.equal(mixedConventions.length, 1);
  assert.equal(mixedConventions[0].dirPath, "guides");
  assert.deepEqual(mixedConventions[0].conventions.sort(), ["kebab-case", "snake_case"]);
});

test("computeNamingSignals does not flag single-word names as inconsistent", () => {
  const files = [file("guides/setup.md"), file("guides/deploy.md")];
  const { mixedConventions } = computeNamingSignals(files);
  assert.deepEqual(mixedConventions, []);
});

test("computeNamingSignals flags a base name duplicated across directories", () => {
  const files = [file("guides/setup.md"), file("reference/setup.md")];
  const { duplicateNames } = computeNamingSignals(files);
  assert.equal(duplicateNames.length, 1);
  assert.equal(duplicateNames[0].baseName, "setup");
  assert.deepEqual(duplicateNames[0].paths.sort(), ["guides/setup.md", "reference/setup.md"]);
});

test("computeNamingSignals ignores index files for duplicate-name detection", () => {
  const files = [file("guides/index.md"), file("reference/index.md")];
  const { duplicateNames } = computeNamingSignals(files);
  assert.deepEqual(duplicateNames, []);
});

test("computeExpectedPageSignals reports a match by path keyword", () => {
  const files = [file("getting-started.md")];
  const signals = computeExpectedPageSignals(files);
  const gettingStarted = signals.find((s) => s.category === "getting started");
  assert.equal(gettingStarted.matched, true);
  assert.deepEqual(gettingStarted.matches, ["getting-started.md"]);
});

test("computeExpectedPageSignals reports no match when nothing fits", () => {
  const files = [file("random-page.md")];
  const signals = computeExpectedPageSignals(files);
  assert.ok(signals.every((s) => s.matched === false));
});

test("computeExpectedPageSignals matches on title as well as path", () => {
  const files = [file("faq.md", { title: "Frequently Asked Questions" })];
  const signals = computeExpectedPageSignals(files);
  const troubleshooting = signals.find((s) => s.category === "troubleshooting");
  assert.equal(troubleshooting.matched, true);
});
