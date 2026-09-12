import { readFileSync } from 'node:fs';
import process from 'node:process';

const canonicalPath = 'sql/desired-v3.sql';
const projectionPath = process.argv[2];

if (!projectionPath) {
  console.error('usage: node scripts/verify-alert-persistence.mjs <eal-interfaces-sql>');
  process.exit(2);
}

const canonical = readFileSync(canonicalPath, 'utf8');
const projection = readFileSync(projectionPath, 'utf8');
const expectedTables = new Set(['alert_rules', 'alert_documents']);

function skipQuoted(text, index, quote) {
  let cursor = index + 1;
  while (cursor < text.length) {
    if (text[cursor] === quote) {
      if (text[cursor + 1] === quote) {
        cursor += 2;
        continue;
      }
      return cursor + 1;
    }
    cursor += 1;
  }
  throw new Error(`unterminated ${quote} quote`);
}

function matchingParen(text, open) {
  let depth = 0;
  for (let cursor = open; cursor < text.length; cursor += 1) {
    const ch = text[cursor];
    if (ch === "'" || ch === '"') {
      cursor = skipQuoted(text, cursor, ch) - 1;
      continue;
    }
    if (ch === '(') depth += 1;
    if (ch === ')') {
      depth -= 1;
      if (depth === 0) return cursor;
    }
  }
  throw new Error(`unclosed CREATE TABLE body at byte ${open}`);
}

function splitTopLevel(body) {
  const fragments = [];
  let start = 0;
  let depth = 0;
  for (let cursor = 0; cursor < body.length; cursor += 1) {
    const ch = body[cursor];
    if (ch === "'" || ch === '"') {
      cursor = skipQuoted(body, cursor, ch) - 1;
      continue;
    }
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === ',' && depth === 0) {
      fragments.push(body.slice(start, cursor));
      start = cursor + 1;
    }
  }
  fragments.push(body.slice(start));
  return fragments;
}

function normalizeIdentifier(raw) {
  const pieces = raw
    .split('.')
    .map((part) => part.trim().replace(/^"|"$/g, ''));
  return pieces.at(-1).toLowerCase();
}

function normalizeFragment(fragment) {
  return fragment
    .replace(/--[^\n]*/g, ' ')
    .replace(/\b(?:public|pg_catalog)\s*\.\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseTables(sql) {
  const tables = new Map();
  const pattern = /create\s+table\s+(?:if\s+not\s+exists\s+)?((?:"[^"]+"|[a-z_][a-z0-9_$]*)(?:\s*\.\s*(?:"[^"]+"|[a-z_][a-z0-9_$]*))?)\s*\(/gi;
  let match;
  while ((match = pattern.exec(sql)) !== null) {
    const table = normalizeIdentifier(match[1]);
    const open = pattern.lastIndex - 1;
    const close = matchingParen(sql, open);
    const fragments = splitTopLevel(sql.slice(open + 1, close))
      .map(normalizeFragment)
      .filter(Boolean)
      .sort();
    if (tables.has(table)) {
      throw new Error(`duplicate CREATE TABLE for ${table}`);
    }
    tables.set(table, fragments);
    pattern.lastIndex = close + 1;
  }
  return tables;
}

function setEquals(left, right) {
  return left.size === right.size && [...left].every((item) => right.has(item));
}

function assertLowercaseIdentifiers(sql, label) {
  const quotedUpper = [...sql.matchAll(/"([^"]*[A-Z][^"]*)"/g)].map((match) => match[1]);
  if (quotedUpper.length) {
    throw new Error(`${label}: uppercase quoted identifier(s): ${quotedUpper.join(', ')}`);
  }
}

const canonicalTables = parseTables(canonical);
const projectionTables = parseTables(projection);
const canonicalNames = new Set(canonicalTables.keys());
const projectionNames = new Set(projectionTables.keys());

if (!setEquals(canonicalNames, expectedTables)) {
  throw new Error(`canonical tables mismatch: ${[...canonicalNames].sort().join(', ')}`);
}
if (!setEquals(projectionNames, expectedTables)) {
  throw new Error(`interface projection tables mismatch: ${[...projectionNames].sort().join(', ')}`);
}

for (const table of [...expectedTables].sort()) {
  const canonicalShape = canonicalTables.get(table);
  const projectionShape = projectionTables.get(table);
  if (JSON.stringify(canonicalShape) !== JSON.stringify(projectionShape)) {
    console.error(`table shape drift for ${table}`);
    console.error(`canonical: ${JSON.stringify(canonicalShape, null, 2)}`);
    console.error(`projection: ${JSON.stringify(projectionShape, null, 2)}`);
    process.exit(1);
  }
}

assertLowercaseIdentifiers(canonical, 'canonical');
assertLowercaseIdentifiers(projection, 'projection');

console.log(JSON.stringify({
  schema: 'embedded-alerts.persistence-sql-parity/v1',
  status: 'passed',
  canonicalPath,
  projectionPath,
  tables: [...expectedTables].sort(),
  tableCount: expectedTables.size,
}));
