#!/usr/bin/env node
/**
 * Bulk front-matter normalizer for notes and posts.
 *
 * Usage:
 *  node tools/bulk-frontmatter.js [targetDir] --kind=note --prefix=/notes [--write]
 *  node tools/bulk-frontmatter.js src/site/notes --kind=note --prefix=/notes --write
 *  node tools/bulk-frontmatter.js src/site/notes/blog --kind=post --prefix=/blog --write
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const TARGET_DIR = process.argv[2] || "src/site/notes";
const ARGS = process.argv.slice(3).reduce((acc, arg) => {
  const m = arg.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) acc[m[1]] = m[2] === undefined ? true : m[2];
  return acc;
}, {});

// Infer kind if not provided
const inferredKind =
  TARGET_DIR.includes("/posts/") || /(^|\/)posts$/.test(TARGET_DIR) ? "post" :
  TARGET_DIR.includes("/notes/") || /(^|\/)notes$/.test(TARGET_DIR) ? "note" :
  null;

const KIND = (ARGS.kind || inferredKind || "note").toLowerCase(); // 'note' | 'post'
const PREFIX = ARGS.prefix || (KIND === "post" ? "/posts" : "/notes");
const WRITE  = !!ARGS.write;

// Directories to skip while walking
const IGNORE_DIRS = new Set([
  "_templates", ".obsidian", "images", "img", "assets", "media", ".git", "node_modules"
]);

function walk(dir) {
  const res = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) res.push(...walk(p));
    } else if (p.toLowerCase().endsWith(".md")) {
      res.push(p);
    }
  }
  return res;
}

function toSlug(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function prettifyFromSlug(slug = "") {
  const s = decodeURIComponent(slug)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

// function firstH1(content) {
//   const m = content.match(/^\s*#\s+(.+?)\s*$/m);
//   if (m) return m[1].trim();
//   const line = (content.split("\n").find(x => x.trim().length) || "").trim();
//   return line.replace(/^#+\s*/, "").trim();
// }

function iso(d) {
  try { return new Date(d).toISOString(); } catch { return null; }
}

function summarize(content) {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, "$1")
    .replace(/\((\w+::.*?)\)/g, "");
  return stripped.trim().slice(0, 160);
}

// Optional: very narrow pre-fix for the known bad YAML line "permalink: >-"
function preFixMalformedYaml(raw) {
  return raw.replace(/^\s*permalink:\s*>-\s*$/m, ""); // drop the bad line
}

console.log(`• Kind: ${KIND}  • Prefix: ${PREFIX}  • Dir: ${TARGET_DIR}`);
console.log(WRITE ? "• Mode: WRITE\n" : "• Mode: DRY-RUN\n");

const files = walk(TARGET_DIR);
let changed = 0;

console.log(`• Kind: ${KIND}  • Prefix: ${PREFIX}  • Dir: ${TARGET_DIR}`);
console.log(WRITE ? "• Mode: WRITE\n" : "• Mode: DRY-RUN\n");

const files = walk(TARGET_DIR);
let changed = 0;

for (const file of files) {
  const stat = fs.statSync(file);
  let raw = fs.readFileSync(file, "utf8");

  // Pre-fix known YAML issue
  raw = preFixMalformedYaml(raw);

  let parsed;
  try {
    parsed = matter(raw);
  } catch (e) {
    console.warn(`! Skipping (YAML error): ${file}\n  ${e.message}`);
    continue;
  }

  const data = parsed.data || {};
  const body = parsed.content || "";

  const slug = toSlug(path.basename(file, ".md"));
  const computedTitle = prettifyFromSlug(slug);
  const computedDate  = data.date ? iso(data.date) : iso(stat.mtime);
  const computedDesc  = data.description || summarize(body);
  const permalink     = data.permalink || `${PREFIX}/${slug}/`;

  const updates = {};

  if (KIND === "post") {
    if (!data.type) updates.type = "post";
    if (!data.title) updates.title = computedTitle;
    if (!data.description && computedDesc) updates.description = computedDesc;
    if (!data.date) updates.date = computedDate;
    if (!data.permalink) updates.permalink = permalink;
    if (typeof data["dg-publish"] !== "boolean") updates["dg-publish"] = true;
    if (!data.visibility) updates.visibility = "public";
  } else {
    // KIND === 'note' (zettels, sessions, references, etc.)
    if (!data.title) updates.title = computedTitle;
    // If you do NOT want dates on notes, leave the next line commented.
    // if (!data.date) updates.date = computedDate;
    if (!data.permalink) updates.permalink = permalink;
    if (typeof data["dg-publish"] !== "boolean") updates["dg-publish"] = true;
    if (!data.visibility) updates.visibility = "public";
    if (!data.description && computedDesc) updates.description = computedDesc;
    if (!data.updated) updates.updated = iso(stat.mtime);
  }

  const keys = Object.keys(updates);
  if (!keys.length) continue;

  changed++;
  console.log(`\n${WRITE ? "UPDATE" : "DRY"}: ${file}`);
  for (const k of keys) console.log(`  - ${k}: ${updates[k]}`);

  if (WRITE) {
    const newData = { ...data, ...updates };
    const out = matter.stringify(body, newData, { lineWidth: 0 });
    fs.writeFileSync(file, out, "utf8");
  }
}

console.log(
  `\n${WRITE ? "Updated" : "Would update"} ${changed} file(s).\n` +
  `Examples:\n` +
  `  Notes → node tools/bulk-frontmatter.js src/site/notes --kind=note --prefix=/notes --write\n` +
  `  Posts → node tools/bulk-frontmatter.js src/site/notes/blog --kind=post --prefix=/blog --write\n`
);
