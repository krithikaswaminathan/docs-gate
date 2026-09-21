#!/usr/bin/env node
/**
 * CLI for verify-samples' static (default, non-executing) checks.
 * Extracts every fenced code block from a Markdown/MDX file, classifies
 * each one, and runs zero-dependency syntax validation where a parser
 * exists (JavaScript, JSON). Prints one JSON array to stdout. Never
 * executes any sample's own code -- see run-sample.mjs for the separate,
 * opt-in execution path.
 *
 * Usage: node extract-samples.mjs <path-to-markdown-file>
 * Output: JSON array of classified blocks with an added `syntax` field.
 * Exit codes: 0 on success; 1 with a message on stderr if the path is
 * missing or unreadable.
 */

import { readFileSync } from "node:fs";
import { extractCodeBlocks } from "./lib/code-blocks.mjs";
import { classifyBlock } from "./lib/sample-classify.mjs";
import { checkSyntax } from "./lib/syntax-check.mjs";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node extract-samples.mjs <path-to-markdown-file>");
  process.exit(1);
}

let text;
try {
  text = readFileSync(filePath, "utf8");
} catch (error) {
  console.error(`Could not read ${filePath}: ${error.message}`);
  process.exit(1);
}

const blocks = extractCodeBlocks(text).map((block) => {
  const classified = classifyBlock(block);
  const syntax = classified.looksLikeOutput
    ? { status: "not-checked", detail: "Classified as example output, not code to validate." }
    : checkSyntax(classified.language, classified.code);
  return { ...classified, syntax };
});

process.stdout.write(JSON.stringify(blocks, null, 2));
process.exit(0);
