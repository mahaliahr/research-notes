const fs = require("fs");

function userMarkdownSetup(md) {
  // The md parameter stands for the markdown-it instance used throughout the site generator.
  // Feel free to add any plugin you want here instead of /.eleventy.js
}
function userEleventySetup(eleventyConfig) {
  // The eleventyConfig parameter stands for the the config instantiated in /.eleventy.js.
  // Feel free to add any plugin you want here instead of /.eleventy.js

  const isPublic = (p) => p?.data?.["dg-publish"] && p?.data?.visibility !== "private";
  const isMd = (p) => typeof p?.inputPath === "string" && p.inputPath.toLowerCase().endsWith(".md");
  const byDateDesc = (a, b) => new Date(b.date || 0) - new Date(a.date || 0);

  // Add this helper (used by post collections)
  const isPost = (p) => {
    const tags = Array.isArray(p.data?.tags) ? p.data.tags : [];
    return (
      p.data?.type === "post" ||
      /\/notes\/blog\//i.test(p.inputPath || "") ||
      tags.includes("post")
    );
  };

  const isZettel = (p) => {
    const url = String(p.url || "");
    return isMd(p) && isPublic(p) && url.startsWith("/notes/") && !url.startsWith("/notes/blog/");
  };
  const isFeatured = (p) => {
    const tags = Array.isArray(p.data?.tags) ? p.data.tags : [];
    return p.data?.featured === true || tags.includes("gardenEntry"); // support both flags
  };
  const updatedMs = (p) => {
    const u = p.data?.updated;
    if (u) {
      const d = new Date(u);
      if (!isNaN(d)) return d.getTime();
    }
    return new Date(p.date || 0).getTime();
  };

  // Recently updated zettels
  eleventyConfig.addCollection("zettels", (col) => {
    return col.getAll().filter(isZettel).sort((a, b) => updatedMs(b) - updatedMs(a));
  });

  // Featured only zettels
  eleventyConfig.addCollection("featuredZettels", (col) => {
    return col.getAll().filter((p) => isZettel(p) && isFeatured(p)).sort((a, b) => updatedMs(b) - updatedMs(a));
  });

  // Featured-first ordering
  eleventyConfig.addCollection("zettelsFeaturedFirst", (col) => {
    const items = col.getAll().filter(isZettel);
    return items.sort((a, b) => {
      const fa = isFeatured(a), fb = isFeatured(b);
      if (fa !== fb) return fb - fa; // featured first
      return updatedMs(b) - updatedMs(a);
    });
  });

  // All posts (unchanged behavior)
  eleventyConfig.addCollection("post", (col) => {
    return col.getAll().filter((p) => isMd(p) && isPublic(p) && isPost(p)).sort(byDateDesc);
  });

  // Featured first (featured posts float to the top, then by date)
  eleventyConfig.addCollection("postFeaturedFirst", (col) => {
    const items = col.getAll().filter((p) => isMd(p) && isPublic(p) && isPost(p));
    return items.sort((a, b) => {
      const fa = !!a.data?.featured, fb = !!b.data?.featured;
      if (fa !== fb) return fb - fa;
      return byDateDesc(a, b);
    });
  });

  // Featured only (optional)
  eleventyConfig.addCollection("featuredPosts", (col) => {
    return col.getAll()
      .filter((p) => isMd(p) && isPublic(p) && isPost(p) && p.data?.featured === true)
      .sort(byDateDesc);
  });

  // ===========================
  // BELOW: live-data parsers 
  // ===========================

//   // Helper: read the raw rendered markdown (not HTML)
// const getText = (p) => {
//   if (!p) return "";
//   const raw = p.template?.inputContent ?? p.templateContent ?? "";
//   return (typeof raw === "string") ? raw : "";
// };

const getText = (p) => {
  if (!p) return "";
  const raw = p.template?.inputContent ?? p.templateContent ?? "";
  return typeof raw === "string" ? raw : String(raw ?? "");
};

  // --- MILESTONES ---
  // Matches: "- [ ] Title #milestone @YYYY-MM-DD" or "- [x] ..."
  const milestoneRe = /^\s*-\s*\[( |x|X)\]\s+(.+?)\s*(?:@(\d{4}-\d{2}-\d{2}))?(?=\s|$)/gm;

  eleventyConfig.addCollection("milestones", (c) => {
    const out = [];
    for (const p of c.getAll()) {
      const txt = getText(p);
      if (!/#milestone\b/.test(txt)) continue;
      let m;
      while ((m = milestoneRe.exec(txt))) {
        const [, box, title, due] = m;
        out.push({
          title: title.replace(/\s+#milestone\b/i, "").trim(),
          due: due || null,
          status: box.trim().toLowerCase() === "x" ? "done" : "planned",
          area: null,
          url: p.url,
        });
      }
    }
    // upcoming first; then done at the end
    return out.sort((a, b) => {
      const ad = a.due ? new Date(a.due).getTime() : Infinity;
      const bd = b.due ? new Date(b.due).getTime() : Infinity;
      return ad - bd;
    });
  });

  // --- SESSIONS ---
  // Any note in "notes/sessions/" or that contains "start::" is a session.
  // Extract start/end/topic from inline fields.
  function inlineField(src, key) {
  if (src == null) return null;
  const text = typeof src === "string" ? src : String(src);
  const re = new RegExp(`^\\s*${key}\\s*::\\s*(.+)$`, "mi");
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

  eleventyConfig.addCollection("sessions", (c) => {
    return c.getAll()
      .filter(p => p.inputPath.includes("/notes/sessions/") || /(^|\n)\s*start::/i.test(getText(p)))
      .map(p => {
        const txt = getText(p);
        const start = inlineField(txt, "start");
        const end = inlineField(txt, "end");
        const topic = inlineField(txt, "topic") || p.data.title || p.fileSlug;
        return { start, end, topic, url: p.url };
      })
      // newest first
      .sort((a, b) => new Date(b.start || 0) - new Date(a.start || 0));
  });

  // --- STREAM ---
  // From one "stream.md" file (or your daily notes folder), parse "- HH:MM message"
  const streamLineRe = /^\s*-\s*(\d{1,2}:\d{2})\s+(.+)$/gm;

  eleventyConfig.addCollection("streamItems", (c) => {
    const out = [];
    const candidates = c.getAll().filter(p => {
  const path = p.inputPath || "";
  return path.endsWith(".md") && (
    /stream\.md$/i.test(path) ||
    path.includes("/notes/daily/")
  );
});
    for (const p of candidates) {
      const txt = getText(p);
      const dateField = inlineField(txt, "date");
      // Try to derive a date from filename if no date:: present
      const fromName = p.inputPath.match(/(\d{4}-\d{2}-\d{2})/);
      const day = dateField || (fromName ? fromName[1] : null);
      let m;
      while ((m = streamLineRe.exec(txt))) {
        const [, time, message] = m;
        out.push({
          date: day ? `${day} ${time}` : time,
          text: message.trim(),
          url: p.url,
        });
      }
    }
    return out.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  });

  // // Emit lightweight JSON for client-side widgets
  // eleventyConfig.on('afterBuild', async () => {
  //   const fs = require('fs'); const path = require('path');
  //   const out = path.join(process.cwd(), '_site'); // garden's default output
  //   const data = require('../site/_data/eleventyGlobalData.json'); // 11ty data bag

  //   // Pull the computed collections from the data cascade:
  //   const { collections } = data;

  //   const milestones = (collections.milestones || []).map(p => ({
  //     title: p.data.title || p.fileSlug,
  //     due: p.data.due, status: p.data.status, area: p.data.area,
  //     url: p.url
  //   }));

  //   const sessions = (collections.sessions || []).map(p => ({
  //     topic: p.data.topic || p.data.title || p.fileSlug,
  //     start: p.data.start, end: p.data.end || null, url: p.url
  //   }));

  //   const stream = (collections.streamItems || []).slice(0, 50).map(p => ({
  //     date: p.data.date, url: p.url
  //   }));

  //   fs.writeFileSync(path.join(out,'/data/milestones.json'), JSON.stringify(milestones, null, 2));
  //   fs.writeFileSync(path.join(out,'/data/sessions.json'), JSON.stringify(sessions, null, 2));
  //   fs.writeFileSync(path.join(out,'/data/stream.json'), JSON.stringify(stream, null, 2));
  // });
}

function useMarkdownSetup(md) {}
exports.userMarkdownSetup = userMarkdownSetup;
exports.userEleventySetup = userEleventySetup;
