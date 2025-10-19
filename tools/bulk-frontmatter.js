#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

/**
 * Usage:
 *  node tools/bulk-frontmatter.js [targetDir] --kind=note --prefix=/notes [--write]
 *  node tools/bulk-frontmatter.js src/site/posts --kind=post --prefix=/posts --write
 */

const TARGET_DIR = process.argv[2] || "src/site/notes"; // default to notes root
const ARGS = process.argv.slice(3).reduce((acc, arg) => {
  const m = arg.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) acc[m[1]] = m[2] === undefined ? true : m[2];
  return acc;
}, {});

// Infer kind if not provided: posts if path has '/posts/', else notes if '/notes/'
const inferredKind =
  TARGET_DIR.includes("/posts/") || TARGET_DIR.endsWith("/posts")
    ? "post"
    : (TARGET_DIR.includes("/notes/") || TARGET_DIR.endsWith("/notes"))
      ? "note"
      : null;

const KIND = (ARGS.kind || inferredKind || "note").toLowerCase(); // 'note' | 'post'
const PREFIX = ARGS.prefix || (KIND === "post" ? "/posts" : "/notes");
const WRITE = !!ARGS.write;

function toSlug(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function firstH1(content) {
  const m = content.match(/^\s*#\s+(.+?)\s*$/m);
  if (m) return m[1].trim();
  const line = (content.split("\n").find(x => x.trim().length) || "").trim();
  return line.replace(/^#+\s*/, "").trim();
}

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

function walk(dir) {
  const res = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) res.push(...walk(p));
    else if (p.endsWith(".md")) res.push(p);
  }
  return res;
}

const files = walk(TARGET_DIR);
let changed = 0;

console.log(`• Kind: ${KIND}  • Prefix: ${PREFIX}  • Dir: ${TARGET_DIR}`);
console.log(WRITE ? "• Mode: WRITE\n" : "• Mode: DRY-RUN\n");

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const stat = fs.statSync(file);
  const parsed = matter(raw);
  const data = parsed.data || {};
  const body = parsed.content || "";

  const slug = toSlug(path.basename(file, ".md"));
  const computedTitle = data.title || firstH1(body) || slug;
  const computedDate = data.date ? iso(data.date) : iso(stat.mtime);
  const computedDesc = data.description || summarize(body);
  const permalink = data.permalink || `${PREFIX}/${slug}/`;

  const updates = {};

  if (KIND === "post") {
    // Posts: ensure type=post (for your Eleventy collections)
    if (!data.type) updates.type = "post";
    if (!data.title) updates.title = computedTitle;
    if (!data.description) updates.description = computedDesc;
    if (!data.date) updates.date = computedDate;
    if (!data.permalink) updates.permalink = permalink;
    if (typeof data["dg-publish"] !== "boolean") updates["dg-publish"] = true;
    if (!data.visibility) updates.visibility = "public";
  } else {
    // Notes (zettels): DO NOT set type: 'post'. Keep notes type-less (or type: 'note' if you prefer).
    // Minimal defaults to keep builds safe without forcing blog-ish metadata.
    if (!data.title) updates.title = computedTitle;
    // Many people prefer not to add a date to zettels; comment out the next line if you don’t want dates on notes:
    // if (!data.date) updates.date = computedDate;
    if (!data.permalink) updates.permalink = permalink;
    if (typeof data["dg-publish"] !== "boolean") updates["dg-publish"] = true;
    if (!data.visibility) updates.visibility = "public";
    // Optional: description for notes (handy for search/previews)
    if (!data.description && computedDesc) updates.description = computedDesc;
    // Optional: updated from file mtime if missing
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
  `Tip (notes): node tools/bulk-frontmatter.js src/site/notes --kind=note --prefix=/notes --write\n` +
  `Tip (posts): node tools/bulk-frontmatter.js src/site/posts --kind=post --prefix=/posts --write\n`
);
