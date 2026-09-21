import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSidebarsJsStatic } from "../../plugins/docs-gate/scripts/lib/sidebars-js-static.mjs";

test("parses a plain module.exports object literal", () => {
  const source = `
    module.exports = {
      tutorialSidebar: ['intro', 'guide'],
    };
  `;
  const result = parseSidebarsJsStatic(source);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { tutorialSidebar: ["intro", "guide"] });
});

test("parses nested category objects with unquoted keys and trailing commas", () => {
  const source = `
    module.exports = {
      main: [
        {
          type: 'category',
          label: "Guides",
          items: ['guides/one', 'guides/two',],
        },
      ],
    };
  `;
  const result = parseSidebarsJsStatic(source);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.main[0].items, ["guides/one", "guides/two"]);
});

test("strips line and block comments", () => {
  const source = `
    // top comment
    module.exports = {
      /* block comment */
      main: ['a'], // trailing comment
    };
  `;
  const result = parseSidebarsJsStatic(source);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { main: ["a"] });
});

test("supports export default syntax", () => {
  const result = parseSidebarsJsStatic("export default { main: ['a'] };");
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { main: ["a"] });
});

test("fails on a require() call rather than guessing its result", () => {
  const source = "module.exports = { main: require('./generated-sidebar') };";
  const result = parseSidebarsJsStatic(source);
  assert.equal(result.ok, false);
  assert.match(result.reason, /function call/i);
});

test("fails on a template literal with interpolation", () => {
  const source = "module.exports = { label: `Guide ${version}` };";
  const result = parseSidebarsJsStatic(source);
  assert.equal(result.ok, false);
  assert.match(result.reason, /interpolation/);
});

test("fails on a bare variable reference as a value", () => {
  const source = "const items = ['a']; module.exports = { main: items };";
  const result = parseSidebarsJsStatic(source);
  assert.equal(result.ok, false);
  assert.match(result.reason, /items/);
});

test("fails when there is no module.exports or export default", () => {
  const result = parseSidebarsJsStatic("const x = { main: ['a'] };");
  assert.equal(result.ok, false);
  assert.match(result.reason, /No `module.exports/);
});

test("still parses booleans, numbers, and null", () => {
  const source = "module.exports = { collapsed: false, position: 3, link: null };";
  const result = parseSidebarsJsStatic(source);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { collapsed: false, position: 3, link: null });
});

test("fails on unexpected trailing content after the exported value", () => {
  const source = "module.exports = { main: ['a'] }; extraStatement;";
  const result = parseSidebarsJsStatic(source);
  assert.equal(result.ok, false);
  assert.match(result.reason, /content after the exported value/);
});
