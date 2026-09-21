/**
 * Deterministic, judgment-free signals for review-ia, computed purely
 * from the parsed nav / disk-tree data the other lib modules produce.
 * These are SIGNALS, not verdicts -- the review-ia skill's prose is
 * responsible for having the model sanity-check each one (a file
 * "orphan candidate" might be intentionally unlinked, a "naming"
 * mismatch might be a deliberate exception) before reporting it as a
 * finding. See docs-gate-claude-code-prompt.md: "Deterministic parsing
 * in scripts; judgment by the model."
 *
 * Exports:
 * - normalizeSlug(pathOrId): strips a markdown extension and collapses
 *   a trailing `/index` (or a bare `index`) the way most docs-as-code
 *   routers do, lowercases, and returns a forward-slash path. Used to
 *   compare nav references against files on disk.
 * - computeOrphanCandidates(diskFiles, referencedSlugs): diskFiles (from
 *   docs-tree.mjs) whose normalized slug isn't in the referencedSlugs
 *   Set. Returns an array of { relPath }.
 * - computeDepthSignals(diskFiles, threshold = 3): files at or beyond
 *   `threshold` nested directories under the docs root. Returns an
 *   array of { relPath, depth }.
 * - computeNamingSignals(diskFiles): two kinds of signal -- sibling
 *   files in the same directory using inconsistent separator
 *   conventions (kebab-case vs snake_case vs camelCase), and the same
 *   base name appearing under more than one directory. Returns
 *   { mixedConventions: [{ dirPath, conventions, files }],
 *     duplicateNames: [{ baseName, paths }] }.
 * - computeExpectedPageSignals(diskFiles): whether any file's path,
 *   base name, or title matches a small keyword list for each of
 *   "getting started", "troubleshooting", and "reference". Returns an
 *   array of { category, matched, matches } for all three categories,
 *   so the caller can report both hits and gaps.
 */

export function normalizeSlug(pathOrId) {
  let slug = pathOrId.replace(/\.(mdx?|MDX?)$/, "").toLowerCase();
  if (slug === "index") return "";
  if (slug.endsWith("/index")) slug = slug.slice(0, -"/index".length);
  return slug;
}

export function computeOrphanCandidates(diskFiles, referencedSlugs) {
  return diskFiles
    .filter((file) => !referencedSlugs.has(normalizeSlug(file.relPath)))
    .map((file) => ({ relPath: file.relPath }));
}

export function computeDepthSignals(diskFiles, threshold = 3) {
  return diskFiles
    .filter((file) => file.depth >= threshold)
    .map((file) => ({ relPath: file.relPath, depth: file.depth }));
}

function namingConventionOf(baseName) {
  const name = baseName.toLowerCase() === "index" ? null : baseName;
  if (!name) return null;
  if (/^[a-z0-9]+$/.test(name)) return null; // single word -- ambiguous, not a signal on its own
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(name)) return "kebab-case";
  if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(name)) return "snake_case";
  if (/^[a-z][a-zA-Z0-9]*$/.test(baseName) && /[A-Z]/.test(baseName)) return "camelCase";
  return "other";
}

export function computeNamingSignals(diskFiles) {
  const byDir = new Map();
  for (const file of diskFiles) {
    const dirPath = file.dirParts.join("/");
    if (!byDir.has(dirPath)) byDir.set(dirPath, []);
    byDir.get(dirPath).push(file);
  }

  const mixedConventions = [];
  for (const [dirPath, files] of byDir) {
    const conventions = new Set();
    const flaggedFiles = [];
    for (const file of files) {
      const convention = namingConventionOf(file.baseName);
      if (convention) {
        conventions.add(convention);
        flaggedFiles.push(file.relPath);
      }
    }
    if (conventions.size > 1) {
      mixedConventions.push({ dirPath: dirPath || "(docs root)", conventions: [...conventions], files: flaggedFiles });
    }
  }

  const byBaseName = new Map();
  for (const file of diskFiles) {
    if (file.baseName.toLowerCase() === "index") continue;
    const key = file.baseName.toLowerCase();
    if (!byBaseName.has(key)) byBaseName.set(key, []);
    byBaseName.get(key).push(file.relPath);
  }
  const duplicateNames = [...byBaseName.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([baseName, paths]) => ({ baseName, paths }));

  return { mixedConventions, duplicateNames };
}

const EXPECTED_PAGE_KEYWORDS = {
  "getting started": [
    "getting-started",
    "getting_started",
    "quickstart",
    "quick-start",
    "introduction",
    "installation",
    "install",
    "setup",
  ],
  troubleshooting: ["troubleshooting", "troubleshoot", "faq", "common-issues", "known-issues", "debugging"],
  reference: ["reference", "api-reference", "cli-reference", "configuration-reference"],
};

export function computeExpectedPageSignals(diskFiles) {
  const results = [];
  for (const [category, keywords] of Object.entries(EXPECTED_PAGE_KEYWORDS)) {
    const matches = diskFiles.filter((file) => {
      const haystack = `${file.relPath} ${file.title}`.toLowerCase();
      return keywords.some((keyword) => haystack.includes(keyword));
    });
    results.push({
      category,
      matched: matches.length > 0,
      matches: matches.map((file) => file.relPath),
    });
  }
  return results;
}
