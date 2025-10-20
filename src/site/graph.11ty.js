const fs = require("fs");
const matter = require("gray-matter");
const slugify = require("@sindresorhus/slugify");

// Normalise a string for matching
function norm(s) {
  return String(s || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/\.md$/i, "")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
}

module.exports = class {
  data() {
    return {
      permalink: "/graph.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    // Prefer curated zettels
    let zettels = (data.collections && data.collections.zettels) || [];

    // Fallback: all notes under /notes/ (except /notes/blog/)
    if (!zettels.length && data.collections && data.collections.all) {
      zettels = data.collections.all.filter(p =>
        p.inputPath.includes("/notes/") && !p.inputPath.includes("/notes/blog/")
      );
    }

    // Build node list and multiple indices to resolve links
    const nodes = [];
    const links = [];

    const bySlug = new Map();       // fileSlug -> page
    const byTitle = new Map();      // lower(title) -> page
    const byPathSlug = new Map();   // lower(path under /notes/) -> page
    const byAlias = new Map();      // lower(alias) -> page

    for (const p of zettels) {
      const id = p.url;
      const title = p.fileSlug;

      nodes.push({ id, title, url: p.url });

      // 1) fileSlug
      bySlug.set(norm(p.fileSlug), p);

      // 2) title
      if (title) byTitle.set(norm(title), p);

      // 3) path-based slug like "folder/note"
      const afterNotes = p.inputPath.split("/notes/")[1] || "";
      const pathSlug = norm(afterNotes);
      if (pathSlug) byPathSlug.set(pathSlug, p);

      // 4) aliases in front matter
      const aliases = Array.isArray(p.data?.aliases)
        ? p.data.aliases
        : p.data?.aliases
          ? String(p.data.aliases).split(",")
          : [];
      for (const a of aliases) {
        const key = norm(a);
        if (key) byAlias.set(key, p);
      }
    }

    // Helper: read raw markdown (strip front matter)
    const readMarkdown = (page) => {
      try {
        const raw = fs.readFileSync(page.inputPath, "utf8");
        return matter(raw).content || "";
      } catch {
        // fallback: rendered HTML -> rough text
        const html = page.templateContent || "";
        return html.replace(/<[^>]*>/g, " ");
      }
    };

    // Regex for [[WikiLinks]] with optional header/label
    const wikiRe = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;

    // Resolve helper
    function resolve(targetRaw) {
      const t = norm(targetRaw);
      if (!t) return null;

      // Try exact fileSlug
      let hit = bySlug.get(t);
      if (hit) return hit;

      // Try title (case-insensitive)
      hit = byTitle.get(t);
      if (hit) return hit;

      // Try alias
      hit = byAlias.get(t);
      if (hit) return hit;

      // Try slugified variants (spaces -> hyphens)
      const slugT = norm(slugify(targetRaw));
      hit = bySlug.get(slugT) || byTitle.get(slugT) || byAlias.get(slugT);
      if (hit) return hit;

      // Try path forms: e.g. "folder/note" or slugified path
      hit = byPathSlug.get(t) || byPathSlug.get(slugT);
      if (hit) return hit;

      return null;
    }

    // Extract links from each note
    for (const p of zettels) {
      const src = p.url;
      const md = readMarkdown(p);
      let m;
      while ((m = wikiRe.exec(md))) {
        const rawTarget = (m[1] || "").trim();
        const targetPage = resolve(rawTarget);
        if (!targetPage) continue;
        if (targetPage.url === src) continue; // skip self-link
        links.push({ source: src, target: targetPage.url });
      }
    }

    return JSON.stringify({ nodes, links }, null, 2);
  }
};
