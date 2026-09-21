/**
 * Parses an already-JSON-parsed Mintlify docs.json value into a flat
 * list of nav entries. Mintlify's navigation schema nests groups under
 * several possible keys (`tabs`, `anchors`, `groups`, `pages`, and
 * plain top-level arrays in the older mint.json style) and has changed
 * across Mintlify's own product versions. This parser wasn't checked
 * against Mintlify's own schema docs -- only Claude Code's docs were in
 * scope for this project (see DEV-NOTES.md) -- so it's deliberately
 * tolerant: it recognizes the container keys above wherever they
 * appear, and records anything it can't place rather than guessing.
 * Treat its output as a best-effort signal, not a verified parse; this
 * is called out as a limitation in the README.
 *
 * Exports:
 * - parseMintlifyNav(parsedJson): returns { entries, notes }. `entries`
 *   is a flat array of { kind: "page" | "unknown", slug?, label?,
 *   depth }, `depth` counting group/tab/anchor nesting from 0.
 */

const GROUP_LABEL_KEYS = ["group", "tab", "anchor", "dropdown", "version"];
const CONTAINER_KEYS = ["pages", "groups", "tabs", "anchors", "dropdowns", "versions"];

function labelOf(node) {
  for (const key of GROUP_LABEL_KEYS) {
    if (typeof node[key] === "string") return node[key];
  }
  return undefined;
}

function walk(node, depth, entries, notes) {
  if (typeof node === "string") {
    entries.push({ kind: "page", slug: node, depth });
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) walk(item, depth, entries, notes);
    return;
  }

  if (node && typeof node === "object") {
    const label = labelOf(node);
    let recursedIntoAnything = false;
    for (const key of CONTAINER_KEYS) {
      if (Array.isArray(node[key])) {
        recursedIntoAnything = true;
        // "pages" nests items of the current group; the other container
        // keys (tabs/groups/anchors/...) introduce a new nesting level.
        const nextDepth = key === "pages" ? depth : depth + 1;
        for (const item of node[key]) walk(item, nextDepth, entries, notes);
      }
    }
    if (!recursedIntoAnything) {
      notes.push(
        `Unrecognized navigation node shape at depth ${depth}${label ? ` ("${label}")` : ""} -- skipped.`
      );
      entries.push({ kind: "unknown", label, depth });
    }
    return;
  }

  notes.push(`Unrecognized navigation entry at depth ${depth} (not a string, array, or object).`);
}

export function parseMintlifyNav(parsedJson) {
  const entries = [];
  const notes = [];

  let root;
  if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson) && "navigation" in parsedJson) {
    root = parsedJson.navigation;
  } else if (Array.isArray(parsedJson)) {
    root = parsedJson;
  } else {
    return {
      entries,
      notes: ['No "navigation" field found and the document root is not itself a navigation array.'],
    };
  }

  walk(root, 0, entries, notes);
  return { entries, notes };
}
