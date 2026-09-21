/**
 * Minimal, dependency-free front matter reader for review-ia. Only
 * handles a flat subset of YAML: a leading `---` block of single-line
 * `key: value` pairs, values optionally quoted. No lists, no nested
 * maps, no multi-line scalars, no anchors -- a value that doesn't look
 * like a simple scalar is skipped (not guessed at) rather than
 * mis-parsed. This is enough for the fields review-ia actually reads
 * (title, sidebar_label, sidebar_position, id) without a YAML
 * dependency; see DEV-NOTES.md for why the plugin ships no npm deps.
 *
 * Exports:
 * - parseFrontmatter(text): returns { data, body }. `data` is a plain
 *   object of the scalar keys found; `body` is the text after the
 *   closing `---` (or the whole input, if there's no front matter
 *   block at all).
 */

const FENCE_RE = /^---\s*$/;
const KEY_VALUE_RE = /^([A-Za-z0-9_-]+):\s*(.*)$/;

function unquote(rawValue) {
  const trimmed = rawValue.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function looksLikeScalar(rawValue) {
  const trimmed = rawValue.trim();
  if (trimmed === "") return false;
  // Bail on anything that looks like a list, inline map, or YAML tag --
  // those need real parsing, and guessing at them risks reporting a
  // wrong title/label as if it were a confident deterministic fact.
  return !/^[[{]|^[-|>]|^&|^\*/.test(trimmed);
}

export function parseFrontmatter(text) {
  const lines = text.split(/\r\n|\r|\n/);

  if (!FENCE_RE.test(lines[0] || "")) {
    return { data: {}, body: text };
  }

  const data = {};
  let i = 1;
  for (; i < lines.length; i++) {
    if (FENCE_RE.test(lines[i])) {
      i++;
      break;
    }
    const match = KEY_VALUE_RE.exec(lines[i]);
    if (match && looksLikeScalar(match[2])) {
      data[match[1]] = unquote(match[2]);
    }
  }

  const body = lines.slice(i).join("\n");
  return { data, body };
}
