#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const TARGET_DIR = process.argv[2] || "src/site/notes";
const WRITE = process.argv.includes("--write");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".md") && !p.includes("/notes/blog/")) out.push(p); // skip posts
  }
  return out;
}

let changed = 0;
for (const file of walk(TARGET_DIR)) {
  const raw = fs.readFileSync(file, "utf8");
  const fm = matter(raw);
  if ("title" in fm.data) {
    changed++;
    console.log(`${WRITE ? "STRIP" : "WOULD STRIP"}: ${file}`);
    delete fm.data.title;
    if (WRITE) fs.writeFileSync(file, matter.stringify(fm.content, fm.data), "utf8");
  }
}
console.log(`\n${WRITE ? "Stripped" : "Would strip"} title from ${changed} note(s).`);
