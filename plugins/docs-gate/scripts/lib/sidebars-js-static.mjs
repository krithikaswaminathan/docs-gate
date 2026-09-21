/**
 * Attempts to statically parse a Docusaurus sidebars.js file's exported
 * value -- WITHOUT executing it -- by hand-tokenizing and
 * recursive-descent-parsing a safe, JSON-like subset of JavaScript:
 * object/array literals, strings (single/double/template-without-
 * interpolation), numbers, true/false/null, comments, and trailing
 * commas. This never uses eval, new Function, vm, or a child process --
 * see run-sidebars.mjs for the separate, opt-in execution path this
 * module exists to avoid needing in the common case.
 *
 * The parser is deliberately narrow: ANY construct it doesn't recognize
 * (a variable reference, a function call such as `require(...)`, a
 * template literal with `${...}` interpolation, a spread, a computed
 * key, or anything left over after the exported value) makes it fail
 * with a specific reason rather than guess at what the value would have
 * been if executed. Per the project's tiering rule (see
 * docs-gate-claude-code-prompt.md and DEV-NOTES.md), a failure here
 * means the caller falls back to the directory tree, not that it
 * retries some looser interpretation.
 *
 * Exports:
 * - parseSidebarsJsStatic(sourceText): returns
 *   { ok: true, value } on a successful static parse of the exported
 *   object/array, or { ok: false, reason } when it can't be parsed
 *   statically -- `reason` is a short, specific explanation.
 */

class StaticParseError extends Error {}

function tokenize(text) {
  const tokens = [];
  let i = 0;
  const n = text.length;

  function isIdentStart(ch) {
    return /[A-Za-z_$]/.test(ch);
  }
  function isIdentPart(ch) {
    return /[A-Za-z0-9_$]/.test(ch);
  }

  while (i < n) {
    const ch = text[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === "/" && text[i + 1] === "/") {
      i += 2;
      while (i < n && text[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      if (end === -1) throw new StaticParseError("Unterminated block comment.");
      i = end + 2;
      continue;
    }

    if ("{}[]:,;".includes(ch)) {
      tokens.push({ type: ch, pos: i });
      i++;
      continue;
    }

    if (ch === "(" || ch === ")") {
      throw new StaticParseError(
        `Function call syntax ("${ch}" at position ${i}) can't be evaluated without executing the file.`
      );
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let value = "";
      let j = i + 1;
      while (j < n && text[j] !== quote) {
        if (text[j] === "\\" && j + 1 < n) {
          value += text[j] + text[j + 1];
          j += 2;
          continue;
        }
        value += text[j];
        j++;
      }
      if (j >= n) throw new StaticParseError(`Unterminated string starting at position ${i}.`);
      let decoded;
      try {
        decoded = JSON.parse(`"${value.replace(/\\'/g, "'")}"`);
      } catch {
        throw new StaticParseError(`Could not decode string literal at position ${i}.`);
      }
      tokens.push({ type: "string", value: decoded, pos: i });
      i = j + 1;
      continue;
    }

    if (ch === "`") {
      let j = i + 1;
      let value = "";
      while (j < n && text[j] !== "`") {
        if (text[j] === "\\" && j + 1 < n) {
          value += text[j] + text[j + 1];
          j += 2;
          continue;
        }
        if (text[j] === "$" && text[j + 1] === "{") {
          throw new StaticParseError("Template literal with `${...}` interpolation can't be parsed statically.");
        }
        value += text[j];
        j++;
      }
      if (j >= n) throw new StaticParseError(`Unterminated template literal starting at position ${i}.`);
      tokens.push({ type: "string", value, pos: i });
      i = j + 1;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === "-" && /[0-9]/.test(text[i + 1] || ""))) {
      const match = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
      tokens.push({ type: "number", value: Number(match[0]), pos: i });
      i += match[0].length;
      continue;
    }

    if (isIdentStart(ch)) {
      let j = i + 1;
      while (j < n && isIdentPart(text[j])) j++;
      tokens.push({ type: "ident", value: text.slice(i, j), pos: i });
      i = j;
      continue;
    }

    throw new StaticParseError(`Unexpected character "${ch}" at position ${i}.`);
  }

  tokens.push({ type: "eof", pos: n });
  return tokens;
}

function parseTokens(tokens) {
  let pos = 0;

  function peek() {
    return tokens[pos];
  }
  function next() {
    return tokens[pos++];
  }
  function expect(type) {
    const token = next();
    if (token.type !== type) {
      throw new StaticParseError(`Expected "${type}" but found "${token.type}" at position ${token.pos}.`);
    }
    return token;
  }

  function parseValue() {
    const token = peek();
    if (token.type === "{") return parseObject();
    if (token.type === "[") return parseArray();
    if (token.type === "string") {
      next();
      return token.value;
    }
    if (token.type === "number") {
      next();
      return token.value;
    }
    if (token.type === "ident") {
      next();
      if (token.value === "true") return true;
      if (token.value === "false") return false;
      if (token.value === "null") return null;
      throw new StaticParseError(
        `Value "${token.value}" at position ${token.pos} is a variable or expression, which can't be resolved without executing the file.`
      );
    }
    throw new StaticParseError(`Unexpected token "${token.type}" at position ${token.pos}.`);
  }

  function parseKey() {
    const token = next();
    if (token.type === "string") return token.value;
    if (token.type === "ident") return token.value;
    throw new StaticParseError(`Expected an object key but found "${token.type}" at position ${token.pos}.`);
  }

  function parseObject() {
    expect("{");
    const result = {};
    if (peek().type === "}") {
      next();
      return result;
    }
    while (true) {
      const key = parseKey();
      expect(":");
      result[key] = parseValue();
      const sep = next();
      if (sep.type === ",") {
        if (peek().type === "}") {
          next();
          return result;
        }
        continue;
      }
      if (sep.type === "}") return result;
      throw new StaticParseError(`Expected "," or "}" but found "${sep.type}" at position ${sep.pos}.`);
    }
  }

  function parseArray() {
    expect("[");
    const result = [];
    if (peek().type === "]") {
      next();
      return result;
    }
    while (true) {
      result.push(parseValue());
      const sep = next();
      if (sep.type === ",") {
        if (peek().type === "]") {
          next();
          return result;
        }
        continue;
      }
      if (sep.type === "]") return result;
      throw new StaticParseError(`Expected "," or "]" but found "${sep.type}" at position ${sep.pos}.`);
    }
  }

  const value = parseValue();
  let trailing = peek();
  if (trailing.type === ";") {
    next();
    trailing = peek();
  }
  if (trailing.type !== "eof") {
    throw new StaticParseError(`Unexpected content after the exported value, at position ${trailing.pos}.`);
  }
  return value;
}

const EXPORT_RE = /module\.exports\s*=\s*|export\s+default\s+/;

export function parseSidebarsJsStatic(sourceText) {
  const match = EXPORT_RE.exec(sourceText);
  if (!match) {
    return { ok: false, reason: "No `module.exports = ...` or `export default ...` assignment found." };
  }

  let expressionText = sourceText.slice(match.index + match[0].length);
  expressionText = expressionText.replace(/;\s*$/, "");

  try {
    const tokens = tokenize(expressionText);
    const value = parseTokens(tokens);
    return { ok: true, value };
  } catch (error) {
    if (error instanceof StaticParseError) {
      return { ok: false, reason: error.message };
    }
    throw error;
  }
}
