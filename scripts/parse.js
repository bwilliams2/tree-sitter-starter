#!/usr/bin/env node
/**
 * Unified parsing helper for the repository.
 *
 * Usage:
 *   node scripts/parse.js <path/to/file>
 *   OR if made executable: ./scripts/parse.js <file>
 *
 * Supports: JavaScript/TypeScript (js,jsx,ts,tsx), JSON (json), Python (py)
 * Extend by installing additional tree-sitter-* packages and adding to LANGUAGE_LOADERS below.
 */

const fs = require('fs');
const path = require('path');
const Parser = require('tree-sitter');

// Lazy loaders so missing packages give a clear error only when needed.
const LANGUAGE_LOADERS = {
  '.js': () => require('tree-sitter-javascript'),
  '.jsx': () => require('tree-sitter-javascript'),
  '.ts': () => require('tree-sitter-javascript'), // TypeScript is in the JS grammar package
  '.tsx': () => require('tree-sitter-javascript'),
  '.json': () => require('tree-sitter-json'),
  '.py': () => require('tree-sitter-python')
};

function usage(msg) {
  if (msg) console.error(`Error: ${msg}\n`);
  console.error('Usage: node scripts/parse.js <file> [--json]');
  console.error('  --json   Output a structured JSON form (root node + child summaries)');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

let jsonMode = false;
const fileArgs = [];
for (const a of args) {
  if (a === '--json') jsonMode = true; else fileArgs.push(a);
}
if (fileArgs.length !== 1) usage('Provide exactly one source file');

const targetPath = fileArgs[0];
if (!fs.existsSync(targetPath)) usage(`File not found: ${targetPath}`);

const ext = path.extname(targetPath).toLowerCase();
const loader = LANGUAGE_LOADERS[ext];
if (!loader) {
  console.error(`No language configured for extension: ${ext}`);
  console.error('Edit scripts/parse.js to add one.');
  process.exit(2);
}

let Language;
try {
  Language = loader();
} catch (e) {
  console.error(`Failed to load parser package for ${ext}. Did you install it?`);
  console.error(e.message);
  process.exit(2);
}

const code = fs.readFileSync(targetPath, 'utf8');
const parser = new Parser();
parser.setLanguage(Language);
const tree = parser.parse(code);

if (!jsonMode) {
  console.log(tree.rootNode.toString());
  process.exit(0);
}

function nodeSummary(node) {
  return {
    type: node.type,
    named: node.isNamed(),
    startPosition: node.startPosition,
    endPosition: node.endPosition,
    childCount: node.childCount
  };
}

const root = tree.rootNode;
const queue = [root];
const out = [];
while (queue.length && out.length < 2000) { // safeguard
  const n = queue.shift();
  out.push(nodeSummary(n));
  for (let i = 0; i < n.childCount; i++) queue.push(n.child(i));
}

console.log(JSON.stringify({ file: targetPath, root: nodeSummary(root), nodes: out }, null, 2));
