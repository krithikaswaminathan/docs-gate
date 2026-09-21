/**
 * Extracts fenced code blocks (``` or ~~~) from Markdown/MDX text, along
 * with the nearest preceding ATX heading for context. A deliberately
 * simple, dependency-free fence parser -- not a full CommonMark
 * implementation, but handles the common cases: 3+ backtick or tilde
 * fences, an info-string language tag, and a closing fence of matching
 * character and at least the opening fence's length. An unterminated
 * fence runs to the end of the document rather than being dropped.
 *
 * Exports:
 * - extractCodeBlocks(markdownText): returns an array of
 *   { index, language, code, startLine, endLine, precedingHeading }.
 *   `language` is the info string's first whitespace-separated token,
 *   lowercased, or "" when the fence has no info string. `startLine`/
 *   `endLine` are 1-based and point at the fence lines themselves.
 *   `precedingHeading` is the nearest ATX heading text above the fence,
 *   or null if the fence appears before any heading.
 */

const FENCE_START_RE = /^ {0,3}(`{3,}|~{3,})[ \t]*(\S*).*$/;
const HEADING_RE = /^ {0,3}#{1,6}\s+(.*?)\s*#*\s*$/;

export function extractCodeBlocks(markdownText) {
  const lines = markdownText.split(/\r\n|\r|\n/);
  const blocks = [];
  let precedingHeading = null;
  let index = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const fenceStart = FENCE_START_RE.exec(line);

    if (fenceStart) {
      const fenceChar = fenceStart[1][0];
      const fenceLen = fenceStart[1].length;
      const language = (fenceStart[2] || "").toLowerCase();
      const startLine = i + 1;
      const closeRe = new RegExp(`^ {0,3}\\${fenceChar}{${fenceLen},}\\s*$`);

      const codeLines = [];
      let j = i + 1;
      let closed = false;
      while (j < lines.length) {
        if (closeRe.test(lines[j])) {
          closed = true;
          break;
        }
        codeLines.push(lines[j]);
        j++;
      }

      blocks.push({
        index: index++,
        language,
        code: codeLines.join("\n"),
        startLine,
        endLine: closed ? j + 1 : lines.length,
        precedingHeading,
      });

      i = closed ? j + 1 : lines.length;
      continue;
    }

    const headingMatch = HEADING_RE.exec(line);
    if (headingMatch) {
      precedingHeading = headingMatch[1];
    }
    i++;
  }

  return blocks;
}
