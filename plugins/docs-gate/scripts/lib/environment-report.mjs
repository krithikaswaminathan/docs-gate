/**
 * Builds the human/Claude-readable report the SessionStart hook emits from
 * tool-detection results. Pure function, no I/O, so it's testable without
 * spawning real processes.
 *
 * Exports:
 * - buildEnvironmentReport({ nodeVersion, vale, markdownlint }): returns
 *   the report string. Appends an instruction asking Claude to mention
 *   missing tools to the user only when something is actually missing --
 *   the report stays quiet about tooling when everything is available.
 */

function describeTool(name, tool, installUrl, purpose) {
  if (tool.available) {
    return `- ${name}: available${tool.version ? ` (${tool.version})` : ""}`;
  }
  return `- ${name}: not found. ${purpose} will be skipped. Install from ${installUrl} if you want it -- docs-gate never installs tools on its own.`;
}

export function buildEnvironmentReport({ nodeVersion, vale, markdownlint }) {
  const lines = [
    "docs-gate environment check:",
    `- Node: ${nodeVersion} (required; docs-gate's scripts and hooks run on it)`,
    describeTool("Vale", vale, "https://vale.sh", "Prose/style linting"),
    describeTool(
      "markdownlint",
      markdownlint,
      "https://github.com/DavidAnson/markdownlint",
      "Markdown structure linting"
    ),
  ];

  const missingCount = [vale, markdownlint].filter((tool) => !tool.available).length;
  if (missingCount > 0) {
    lines.push(
      "",
      "Mention this to the user near the start of your first reply this session: which tools are missing, and that the checks depending on them are skipped rather than run silently."
    );
  }

  return lines.join("\n");
}
