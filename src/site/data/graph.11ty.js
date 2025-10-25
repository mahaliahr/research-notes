const fs = require("fs");
const matter = require("gray-matter");
const slugify = require("@sindresorhus/slugify");

module.exports = class {
  data() {
    return {
      permalink: "/graph.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const pages = (data.collections && data.collections.all) || [];

    // Only pages with URLs
    const mdPages = pages.filter((p) => p && p.url && p.inputPath && p.inputPath.endsWith(".md"));

    // Lookup: slug -> url
    const toSlug = (s) => slugify(String(s || ""));
    const bySlug = new Map();
    for (const p of mdPages) {
      if (p.fileSlug) bySlug.set(p.fileSlug.toLowerCase(), p.url);
      if (p.data && p.data.title) bySlug.set(toSlug(p.data.title), p.url);
    }

    const nodes = mdPages.map((p) => ({
      id: p.url,
      url: p.url,
      title: (p.data && p.data.title) || p.fileSlug || p.url,
    }));

    const links = [];
    const wikilinkRe = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g;

    for (const p of mdPages) {
      let raw = "";
      try {
        const file = fs.readFileSync(p.inputPath, "utf8");
        raw = matter(file).content || "";
      } catch {
        raw = "";
      }
      let m;
      while ((m = wikilinkRe.exec(raw))) {
        const targetRaw = (m[1] || "").trim();
        const targetSlug = toSlug(targetRaw);
        const targetUrl = bySlug.get(targetSlug);
        if (targetUrl) {
          links.push({ source: p.url, target: targetUrl });
        }
      }
    }

    return JSON.stringify({ nodes, links });
  }
};
