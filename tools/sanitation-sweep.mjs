#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, sep, posix } from 'node:path';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const ts = require_('./../node_modules/.pnpm/typescript@6.0.3/node_modules/typescript');

const ROOT = process.cwd();

const EXCLUDES = [
  /^packages\/shared\/src\/types\/generated\//,
];

const PRESERVE_PATTERNS = [
  /^\/\/\s*@ts-(ignore|expect-error|nocheck|check)\b/,
  /^\/\/\/\s*<reference\b/,
  /^\/\/\s*eslint-(disable|enable)/,
  /^\/\*\s*eslint-(disable|enable)/,
  /^\/\/\s*eslint-env\b/,
  /^\/\*\s*global\b/,
  /^\/\*\s*@?#?__PURE__\s*\*\//,
  /^\/\*\s*webpackChunkName/,
  /^\/\*\s*webpackIgnore/,
  /^\/\*\s*@vite-ignore/,
  /^\/\/\s*@vite-ignore/,
  /^\/\*!/,
  /^\/\/#\s*sourceMappingURL=/,
  /^\/\/@\s*sourceMappingURL=/,
  /^\/\*\*\s*@jsx(ImportSource|Frag)?\b/,
  /SPDX-License-Identifier:/,
];

const SMART_QUOTE_MAP = {
  '‘': "'", '’': "'", '‚': "'", '‛': "'",
  '“': '"', '”': '"', '„': '"', '‟': '"',
  '—': '-', '–': '-',
};
const ZERO_WIDTH = /[​‌‍⁠﻿]/g;

function listFiles() {
  const out = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' });
  return out.split('\n').filter(Boolean).map(p => p.split(sep).join(posix.sep));
}

function isExcluded(rel) {
  return EXCLUDES.some(rx => rx.test(rel));
}

function shouldPreserveComment(text) {
  return PRESERVE_PATTERNS.some(rx => rx.test(text));
}

function applyEdits(src, edits) {
  edits.sort((a, b) => a.start - b.start);
  let out = '';
  let cursor = 0;
  for (const e of edits) {
    if (e.start < cursor) continue;
    out += src.slice(cursor, e.start) + e.replacement;
    cursor = e.end;
  }
  out += src.slice(cursor);
  return out;
}

function detectEol(src) {
  const crlf = (src.match(/\r\n/g) || []).length;
  const lf = (src.match(/(?<!\r)\n/g) || []).length;
  return crlf > lf ? '\r\n' : '\n';
}

function normalizeWhitespace(src) {
  const eol = detectEol(src);
  let s = src.replace(/^﻿/, '');
  s = s.replace(ZERO_WIDTH, '');
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  s = s.split('\n').map(l => l.replace(/[ \t]+$/, '')).join('\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  if (!s.endsWith('\n')) s += '\n';
  s = s.replace(/\n+$/, '\n');
  if (eol === '\r\n') s = s.replace(/\n/g, '\r\n');
  return s;
}

function replaceTypography(src, protectedRanges) {
  protectedRanges.sort((a, b) => a[0] - b[0]);
  let out = '';
  let cursor = 0;
  function transform(chunk) {
    let r = chunk;
    for (const [k, v] of Object.entries(SMART_QUOTE_MAP)) {
      r = r.split(k).join(v);
    }
    return r;
  }
  for (const [start, end] of protectedRanges) {
    if (start < cursor) continue;
    out += transform(src.slice(cursor, start));
    out += src.slice(start, end);
    cursor = end;
  }
  out += transform(src.slice(cursor));
  return out;
}

function processTsLike(src, isJsx) {
  const sf = ts.createSourceFile(
    isJsx ? 'tmp.tsx' : 'tmp.ts',
    src,
    ts.ScriptTarget.Latest,
    true,
    isJsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const stringRanges = [];
  function walkStrings(node) {
    if (
      node.kind === ts.SyntaxKind.StringLiteral ||
      node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
      node.kind === ts.SyntaxKind.TemplateHead ||
      node.kind === ts.SyntaxKind.TemplateMiddle ||
      node.kind === ts.SyntaxKind.TemplateTail
    ) {
      stringRanges.push([node.getStart(sf), node.getEnd()]);
    }
    ts.forEachChild(node, walkStrings);
  }
  walkStrings(sf);

  const commentEdits = [];
  const seen = new Set();
  function pushRange(r) {
    const key = r.pos + ':' + r.end;
    if (seen.has(key)) return;
    seen.add(key);
    const text = src.slice(r.pos, r.end);
    if (shouldPreserveComment(text)) return;
    let start = r.pos;
    let end = r.end;
    const before = src.slice(0, start);
    const lineStart = before.lastIndexOf('\n') + 1;
    const indent = src.slice(lineStart, start);
    const isLineOnly = /^[ \t]*$/.test(indent);
    if (isLineOnly) {
      if (src[end] === '\r' && src[end + 1] === '\n') end += 2;
      else if (src[end] === '\n') end += 1;
      start = lineStart;
      commentEdits.push({ start, end, replacement: '' });
    } else {
      let s = start;
      while (s > lineStart && /[ \t]/.test(src[s - 1])) s -= 1;
      commentEdits.push({ start: s, end, replacement: '' });
    }
  }
  function collectAt(pos) {
    const leading = ts.getLeadingCommentRanges(src, pos) || [];
    const trailing = ts.getTrailingCommentRanges(src, pos) || [];
    for (const r of [...leading, ...trailing]) pushRange(r);
  }
  function walkComments(node) {
    const start = node.getFullStart();
    collectAt(start);
    if (node.kind === ts.SyntaxKind.JsxExpression) {
      const exprStart = node.getStart(sf);
      const exprEnd = node.getEnd();
      const inner = src.slice(exprStart + 1, exprEnd - 1);
      const hasExpression = node.expression != null;
      let onlyCommentsAndWs = !hasExpression;
      let hasPreserved = false;
      const localComments = [];
      let i = 0;
      const baseOffset = exprStart + 1;
      while (i < inner.length) {
        if (inner[i] === '/' && inner[i + 1] === '*') {
          const e = inner.indexOf('*/', i + 2);
          const endIdx = e < 0 ? inner.length : e + 2;
          const text = inner.slice(i, endIdx);
          if (shouldPreserveComment(text)) hasPreserved = true;
          else localComments.push({ pos: baseOffset + i, end: baseOffset + endIdx });
          i = endIdx;
        } else if (inner[i] === '/' && inner[i + 1] === '/') {
          const nl = inner.indexOf('\n', i);
          const endIdx = nl < 0 ? inner.length : nl;
          const text = inner.slice(i, endIdx);
          if (shouldPreserveComment(text)) hasPreserved = true;
          else localComments.push({ pos: baseOffset + i, end: baseOffset + endIdx });
          i = endIdx;
        } else if (/\s/.test(inner[i])) {
          i += 1;
        } else {
          onlyCommentsAndWs = false;
          break;
        }
      }
      if (onlyCommentsAndWs && !hasPreserved) {
        let s = exprStart;
        const lineStart = src.slice(0, s).lastIndexOf('\n') + 1;
        const indent = src.slice(lineStart, s);
        const lineOnly = /^[ \t]*$/.test(indent);
        let end = exprEnd;
        if (lineOnly) {
          if (src[end] === '\r' && src[end + 1] === '\n') end += 2;
          else if (src[end] === '\n') end += 1;
          s = lineStart;
        } else {
          while (s > lineStart && /[ \t]/.test(src[s - 1])) s -= 1;
        }
        const key = s + ':' + end;
        if (!seen.has(key)) {
          seen.add(key);
          commentEdits.push({ start: s, end, replacement: '' });
        }
      } else {
        for (const r of localComments) pushRange(r);
      }
    }
    ts.forEachChild(node, walkComments);
  }
  walkComments(sf);
  collectAt(sf.getEnd());

  let out = applyEdits(src, commentEdits);

  const sf2 = ts.createSourceFile(
    isJsx ? 'tmp.tsx' : 'tmp.ts',
    out,
    ts.ScriptTarget.Latest,
    true,
    isJsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const stringRanges2 = [];
  function walkStrings2(node) {
    if (
      node.kind === ts.SyntaxKind.StringLiteral ||
      node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
      node.kind === ts.SyntaxKind.TemplateHead ||
      node.kind === ts.SyntaxKind.TemplateMiddle ||
      node.kind === ts.SyntaxKind.TemplateTail
    ) {
      stringRanges2.push([node.getStart(sf2), node.getEnd()]);
    }
    ts.forEachChild(node, walkStrings2);
  }
  walkStrings2(sf2);

  out = replaceTypography(out, stringRanges2);
  out = normalizeWhitespace(out);
  return out;
}

function processCss(src) {
  const out = [];
  let i = 0;
  let inStr = null;
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      out.push(c);
      if (c === '\\' && i + 1 < src.length) { out.push(src[i + 1]); i += 2; continue; }
      if (c === inStr) inStr = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = c;
      out.push(c);
      i += 1;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const slice = src.slice(i, end < 0 ? src.length : end + 2);
      if (/^\/\*!/.test(slice) || /SPDX-License-Identifier:/.test(slice)) {
        out.push(slice);
      }
      i = end < 0 ? src.length : end + 2;
      continue;
    }
    out.push(c);
    i += 1;
  }
  let s = out.join('');
  s = replaceTypography(s, findCssStrings(s));
  return normalizeWhitespace(s);
}

function findCssStrings(src) {
  const ranges = [];
  let i = 0;
  let inStr = null;
  let start = 0;
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      if (c === '\\' && i + 1 < src.length) { i += 2; continue; }
      if (c === inStr) { ranges.push([start, i + 1]); inStr = null; }
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") { inStr = c; start = i; }
    i += 1;
  }
  return ranges;
}

function processHtml(src) {
  const stripped = src.replace(/<!--[\s\S]*?-->/g, '');
  return normalizeWhitespace(stripped);
}

function processJsonStrict(src) {
  return normalizeWhitespace(src);
}

function processJsonc(src) {
  let out = '';
  let i = 0;
  let inStr = false;
  let changed = false;
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      out += c;
      if (c === '\\' && i + 1 < src.length) { out += src[i + 1]; i += 2; continue; }
      if (c === '"') inStr = false;
      i += 1;
      continue;
    }
    if (c === '"') { inStr = true; out += c; i += 1; continue; }
    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      const before = out;
      const lineStart = before.lastIndexOf('\n') + 1;
      const indent = before.slice(lineStart);
      const lineOnly = /^[ \t]*$/.test(indent);
      if (lineOnly) {
        out = out.slice(0, lineStart);
        i = nl < 0 ? src.length : nl + 1;
      } else {
        out = out.replace(/[ \t]+$/, '');
        i = nl < 0 ? src.length : nl;
      }
      changed = true;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end < 0 ? src.length : end + 2;
      changed = true;
      continue;
    }
    out += c;
    i += 1;
  }
  return normalizeWhitespace(out);
}

function isStrictJson(rel) {
  const base = rel.split('/').pop();
  if (base === 'package.json') return true;
  if (rel.endsWith('packages/shared/src/tokens/tokens.json')) return true;
  return false;
}

function dispatch(rel, src) {
  const ext = rel.slice(rel.lastIndexOf('.') + 1).toLowerCase();
  if (ext === 'tsx' || ext === 'jsx') return processTsLike(src, true);
  if (ext === 'ts' || ext === 'js' || ext === 'mjs' || ext === 'cjs') return processTsLike(src, false);
  if (ext === 'css') return processCss(src);
  if (ext === 'html') return processHtml(src);
  if (ext === 'json') return isStrictJson(rel) ? processJsonStrict(src) : processJsonc(src);
  return null;
}

const SCOPE_EXTS = new Set(['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'css', 'html', 'json']);

function main() {
  const all = listFiles();
  const targets = all.filter(rel => {
    if (isExcluded(rel)) return false;
    const ext = rel.slice(rel.lastIndexOf('.') + 1).toLowerCase();
    if (!SCOPE_EXTS.has(ext)) return false;
    if (rel === 'pnpm-lock.yaml') return false;
    return true;
  });

  const touched = [];
  const skippedParse = [];
  const unchanged = [];
  for (const rel of targets) {
    const abs = resolve(ROOT, rel);
    let src;
    try { src = readFileSync(abs, 'utf8'); } catch { continue; }
    let next;
    try {
      next = dispatch(rel, src);
    } catch (e) {
      skippedParse.push(`${rel}: ${e.message}`);
      continue;
    }
    if (next == null) continue;
    if (next !== src) {
      writeFileSync(abs, next, 'utf8');
      touched.push(rel);
    } else {
      unchanged.push(rel);
    }
  }

  console.log('--- sanitation sweep ---');
  console.log(`scanned: ${targets.length}`);
  console.log(`touched: ${touched.length}`);
  console.log(`unchanged: ${unchanged.length}`);
  console.log(`parse-errors: ${skippedParse.length}`);
  if (skippedParse.length) {
    console.log('');
    console.log('parse errors:');
    for (const p of skippedParse) console.log('  ' + p);
  }
}

main();
