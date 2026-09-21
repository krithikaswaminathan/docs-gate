/**
 * Pure path-matching helpers for the PostToolUse lint hook: is a changed
 * file Markdown/MDX, and does it fall under the configured docs_root?
 * No I/O -- operates on strings only, so it's testable without touching
 * the filesystem and behaves the same regardless of the host OS's path
 * separator (paths are normalized to forward slashes before comparing).
 *
 * Exports:
 * - isMarkdownFile(filePath): true for a .md or .mdx extension, case-insensitive.
 * - isWithinDocsRoot(filePath, projectDir, docsRoot): true when filePath
 *   resolves to a location at or under <projectDir>/<docsRoot>.
 */

import path from "node:path";

const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx"]);

function toPosixPath(inputPath) {
  return inputPath.replace(/\\/g, "/");
}

export function isMarkdownFile(filePath) {
  const ext = path.posix.extname(toPosixPath(filePath)).toLowerCase();
  return MARKDOWN_EXTENSIONS.has(ext);
}

export function isWithinDocsRoot(filePath, projectDir, docsRoot) {
  const relative = path.posix.relative(toPosixPath(projectDir), toPosixPath(filePath));
  if (relative === ".." || relative.startsWith("../") || path.posix.isAbsolute(relative)) {
    return false;
  }
  const normalizedRoot = toPosixPath(docsRoot).replace(/\/+$/, "");
  return relative === normalizedRoot || relative.startsWith(`${normalizedRoot}/`);
}
