const fs = require("fs");
const path = require("path");
const slugify = require("@sindresorhus/slugify");

function readFileSafe(p) { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } }
function extractWikiTargets(src) {
  const out = []; if (typeof src !== "string") return out;
  const re = /\[\[([^\]\|#]+)(?:#[^\]\|]+)?(?:\|[^\]]+)?\]\]/g; let m;
  while ((m = re.exec(src))) { const t = (m[1] || "").trim(); if (t) out.push(t); }
  return out;
}

class GraphJson {
  data() { return { permalink: "/graph.json", eleventyExcludeFromCollections: true }; }

  render(data) {
    try {
      const notes = (data.collections?.notes || data.collections?.note || []).filter(Boolean);
      if (!Array.isArray(notes) || notes.length === 0) {
        return JSON.stringify({ nodes: {}, links: [], homeAlias: "/" });
      }

      // Determine homeUrl: first note tagged gardenEntry, else "/"
      const homePage = notes.find(p => Array.isArray(p.data?.tags) && p.data.tags.includes("gardenEntry"));
      const homeUrl = homePage?.url || "/";

      // Build resolver map
      const byKey = new Map();
      for (const p of notes) {
        const fileSlug = String(p.fileSlug || "");
        const inputPath = String(p.inputPath || "");
        const basename = path.basename(inputPath, path.extname(inputPath));
        const title = String(p.data?.title || fileSlug);
        const titleSlug = slugify(title);
        const url = String(p.url || "");
        const entry = { url, page: p };
        [fileSlug, basename, title, titleSlug].forEach(k => {
          const key = (k || "").trim();
          if (key) byKey.set(key.toLowerCase(), entry);
        });
      }
      const resolve = (target) => {
        if (!target) return null;
        const t = String(target).trim();
        const base = t.replace(/\\+/g, "/");
        const seg = base.split("/").pop() || base;
        const candidates = [t, t.toLowerCase(), seg, seg.toLowerCase(), slugify(t), slugify(seg)];
        for (const c of candidates) {
          const hit = byKey.get(String(c).toLowerCase());
          if (hit?.url) return hit.url;
        }
        return null;
      };

      const nodes = {};
      const outLinks = new Map();
      for (const p of notes) {
        const url = String(p.url || "");
        const title = String(p.data?.title || p.fileSlug || url);
        const src = readFileSafe(String(p.inputPath || ""));
        const targets = extractWikiTargets(src).map(resolve).filter((u) => !!u && u !== url);
        outLinks.set(url, new Set(targets));
        nodes[url] = nodes[url] || {
          id: url, url, title,
          neighbors: [], backLinks: [],
          hide: false,
          home: url === homeUrl // mark the gardenEntry page as home
        };
      }

      const links = [];
      for (const [from, set] of outLinks.entries()) {
        for (const to of set) {
          if (!nodes[to]) continue;
          links.push({ source: from, target: to });
          if (!nodes[from].neighbors.includes(to)) nodes[from].neighbors.push(to);
          if (!nodes[to].backLinks.includes(from)) nodes[to].backLinks.push(from);
        }
      }
      const seen = new Set(), dedup = [];
      for (const l of links) { const k = [l.source, l.target].sort().join("|"); if (!seen.has(k)) { seen.add(k); dedup.push(l); } }

      // Ensure homeAlias points to an existing node
      const homeAlias = nodes[homeUrl] ? homeUrl : Object.keys(nodes)[0] || "/";

      return JSON.stringify({ nodes, links: dedup, homeAlias });
    } catch (e) {
      return JSON.stringify({ nodes: {}, links: [], homeAlias: "/", error: String(e?.message || e) });
    }
  }
}
module.exports = GraphJson;
