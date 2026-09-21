import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEnvironmentReport } from "../../plugins/docs-gate/scripts/lib/environment-report.mjs";

test("reports both tools available with no follow-up instruction", () => {
  const report = buildEnvironmentReport({
    nodeVersion: "v22.0.0",
    vale: { available: true, version: "vale version 3.0.0" },
    markdownlint: { available: true, version: "0.37.0" },
  });
  assert.match(report, /Node: v22\.0\.0/);
  assert.match(report, /Vale: available \(vale version 3\.0\.0\)/);
  assert.match(report, /markdownlint: available \(0\.37\.0\)/);
  assert.doesNotMatch(report, /Mention this to the user/);
});

test("flags a missing tool and asks Claude to mention it", () => {
  const report = buildEnvironmentReport({
    nodeVersion: "v22.0.0",
    vale: { available: false },
    markdownlint: { available: true, version: "0.37.0" },
  });
  assert.match(report, /Vale: not found\. Prose\/style linting will be skipped/);
  assert.match(report, /Mention this to the user/);
});

test("flags both tools missing", () => {
  const report = buildEnvironmentReport({
    nodeVersion: "v22.0.0",
    vale: { available: false },
    markdownlint: { available: false },
  });
  assert.match(report, /Vale: not found/);
  assert.match(report, /markdownlint: not found/);
  assert.match(report, /Mention this to the user/);
});

test("omits the version parenthetical when a tool reports no version text", () => {
  const report = buildEnvironmentReport({
    nodeVersion: "v22.0.0",
    vale: { available: true },
    markdownlint: { available: true, version: "0.37.0" },
  });
  assert.match(report, /- Vale: available\n/);
});
