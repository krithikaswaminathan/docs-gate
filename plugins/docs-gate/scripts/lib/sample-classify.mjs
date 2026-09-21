/**
 * Classifies an extracted code block: flags whether it looks like example
 * output rather than runnable code, flags likely-unresolved placeholders,
 * and flags likely network calls. Pure string analysis -- no I/O, no code
 * execution, so a block's own content can't cause this to do anything but
 * pattern-match it.
 *
 * Exports:
 * - classifyBlock(block): returns block merged with
 *   { hasLanguageTag, looksLikeOutput, placeholders, looksNetworkDependent }.
 *   `placeholders` is an array of { label, match } describing what looked
 *   like an unresolved value the reader must supply.
 */

const OUTPUT_LANGUAGES = new Set(["text", "txt", "output", "console", "plaintext", "log", "ansi"]);

const NETWORK_HINTS = [
  /\bfetch\s*\(/i,
  /\brequire\(\s*["'](?:http|https)["']\s*\)/i,
  /\bimport\s.*from\s+["'](?:node:)?(?:http|https)["']/i,
  /\baxios\b/i,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\brequests\.(?:get|post|put|delete|patch)\s*\(/i,
  /(?:^|\s)curl\s+/,
  /(?:^|\s)wget\s+/,
];

const PLACEHOLDER_PATTERNS = [
  { label: "YOUR_/INSERT_/REPLACE_/CHANGE_ style token", re: /\b(?:YOUR|INSERT|REPLACE|CHANGE)_[A-Z0-9_]{2,}\b/g },
  {
    label: "angle-bracket placeholder",
    re: /<[^<>\n]{0,60}(?:key|token|secret|password|credential|your|insert|replace)[^<>\n]{0,60}>/gi,
  },
  { label: "TODO/FIXME/XXX marker", re: /\b(?:TODO|FIXME|XXX)\b/g },
  { label: '"your-...-here" style placeholder', re: /\byour-[\w-]*-here\b/gi },
];

export function classifyBlock(block) {
  const language = block.language || "";
  const hasLanguageTag = language.length > 0;
  const looksLikeOutput = OUTPUT_LANGUAGES.has(language);

  const placeholders = [];
  for (const { label, re } of PLACEHOLDER_PATTERNS) {
    const matches = block.code.match(re);
    if (matches) {
      for (const match of new Set(matches)) {
        placeholders.push({ label, match });
      }
    }
  }

  const looksNetworkDependent = NETWORK_HINTS.some((re) => re.test(block.code));

  return {
    ...block,
    hasLanguageTag,
    looksLikeOutput,
    placeholders,
    looksNetworkDependent,
  };
}
