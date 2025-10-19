// src/site/graph.11ty.js
const slugify = require("@sindresorhus/slugify");

/**
 * Builds a lightweight graph from your zettels:
 * - nodes: all notes (id = URL)
 * - links: Obsidian-style [[wikilinks]] between notes (by fileSlug or title match)
 */
module.exports = class {
  data() {
    return {
      permalink: "/graph.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const zettels = (data.collections && data.collections.zettels) || [];
    const nodes = [];
    const links = [];

    // Map title/fileSlug -> page (for resolving [[links]])
    const bySlug = new Map();
    const byTitle = new Map();
    for (const p of zettels) {
      const id = p.url;
      const title = (p.data && p.data.title) || p.fileSlug;
      nodes.push({ id, title, url: p.url });
      bySlug.set(p.fileSlug, p);
      byTitle.set((title || "").toLowerCase(), p);
    }

    // Extract [[wikilinks]] from note content and create edges
    const wikiRe = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;

    for (const p of zettels) {
      const src = p.url;
      const content =
        (p.template && p.template.inputContent) ||
        p.templateContent ||
        "";
      let m;
      while ((m = wikiRe.exec(content))) {
        const targetRaw = (m[1] || "").trim();

        // Try resolution order: fileSlug match → title match → slugified title match
        const bySlugHit = bySlug.get(targetRaw);
        const byTitleHit = byTitle.get(targetRaw.toLowerCase());
        const bySlugifiedTitleHit = bySlug.get(slugify(targetRaw));

        const targetPage = bySlugHit || byTitleHit || bySlugifiedTitleHit;
        if (targetPage) {
          links.push({
            source: src,
            target: targetPage.url,
          });
        }
      }
    }

    const payload = { nodes, links };
    return JSON.stringify(payload, null, 2);
  }
};
