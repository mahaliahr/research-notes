#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const TARGET_DIR = process.argv[2] || "src/site/notes/published";
const NOTE_PREFIX = process.argv[3] || "/note";      // e.g. "/posts"
const WRITE = process.argv.includes("--write");      // dry-run by default

function toSlug(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function firstH1(content) {
  // try markdown H1, then first non-empty line
  const m = content.match(/^\s*#\s+(.+?)\s*$/m);
  if (m) return m[1].trim();
  const line = (content.split("\n").find(x => x.trim().length) || "").trim();
  return line.replace(/^#+\s*/, "").trim();
}

function iso(d) {
  try { return new Date(d).toISOString(); } catch { return null; }
}

function summarize(content) {
  // strip HTML, code fences, frontmatter residue
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, "$1") // obsidian links
    .replace(/\((\w+::.*?)\)/g, "");                // dataview inline
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

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const stat = fs.statSync(file);
  const parsed = matter(raw);
  const data = parsed.data || {};
  const body = parsed.content || "";

  // compute safe defaults
  const slug = toSlug(path.basename(file, ".md"));
  const computedTitle = data.title || firstH1(body) || slug;
  const computedDate = data.date ? iso(data.date) : iso(stat.mtime);
  const computedDesc = data.description || summarize(body);
  const permalink = data.permalink || `${NOTE_PREFIX}/${slug}/`;

  // determine changes
  const updates = {};
  if (!data.type) updates.type = "post";
  if (!data.title) updates.title = computedTitle;
  if (!data.description) updates.description = computedDesc;
  if (!data.date) updates.date = computedDate;
  if (!data.permalink) updates.permalink = permalink;
  if (typeof data["dg-publish"] !== "boolean") updates["dg-publish"] = true;
  if (!data.visibility) updates.visibility = "public";

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
  `\n${WRITE ? "Updated" : "Would update"} ${changed} file(s). ` +
  `Dir: ${TARGET_DIR}  Prefix: ${NOTE_PREFIX}\n` +
  `Tip: run with --write to apply.`
);
