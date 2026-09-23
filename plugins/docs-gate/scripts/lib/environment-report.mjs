/**
 * Builds the human/Claude-readable report the SessionStart hook emits from
 * tool-detection results. Pure function, no I/O, so it's testable without
 * spawning real processes.
 *
 * Exports:
 * - buildEnvironmentReport({ nodeVersion, vale, markdownlint }): returns
 *   the report string. `vale` may additionally carry `configured: boolean`
 *   and, when false, `configError` -- see check-environment.mjs, which
 *   probes this with a real throwaway file rather than trusting
 *   `--version` alone. Appends an instruction asking Claude to mention
 *   missing or unconfigured tools to the user near the start of the
 *   session -- the report stays quiet about tooling only when everything
 *   is both present and actually usable.
 */

function describeTool(name, tool, installUrl, purpose) {
  if (!tool.available) {
    return `- ${name}: not found. ${purpose} will be skipped. Install from ${installUrl} if you want it -- docs-gate never installs tools on its own.`;
  }
  if (tool.configured === false) {
    return `- ${name}: on PATH${tool.version ? ` (${tool.version})` : ""}, but not configured -- ${tool.configError || "a real run errored"}. ${purpose} will be skipped until it's set up (docs-gate never ships or writes its config). See ${installUrl}.`;
  }
  return `- ${name}: available${tool.version ? ` (${tool.version})` : ""}`;
}

export function buildEnvironmentReport({ nodeVersion, vale, markdownlint }) {
  const lines = [
    "docs-gate environment check:",
    `- Node: ${nodeVersion} (required; docs-gate's scripts and hooks run on it)`,
    describeTool("Vale", vale, "https://vale.sh/docs/topics/config", "Prose/style linting"),
    describeTool(
      "markdownlint",
      markdownlint,
      "https://github.com/DavidAnson/markdownlint",
      "Markdown structure linting"
    ),
  ];

  const needsMention =
    !vale.available || vale.configured === false || !markdownlint.available;
  if (needsMention) {
    lines.push(
      "",
      "Mention this to the user near the start of your first reply this session: which tools are missing or unconfigured, and that the checks depending on them are skipped rather than run silently."
    );
  }

  return lines.join("\n");
}
