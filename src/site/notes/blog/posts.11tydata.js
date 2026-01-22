// src/site/notes/blog/post.11tydata.js
module.exports = {
  eleventyComputed: {
    type: d => d.type || "post",
    title: d => d.title || d.page.fileSlug,
    description: d =>
      d.description ||
      (d.content || "").replace(/<[^>]*>/g, "").trim().slice(0, 160),

    // Hardened date: accept string/Date, coerce number→Date, else fallback
    date: d => {
      const v = d.date;
      if (v instanceof Date || typeof v === "string") return v;
      if (typeof v === "number") return new Date(v);
      // if a templater/core placeholder slipped through, fall back safely
      return d.page.date;
    },

    permalink: d => d.permalink || `notes/blog/${d.page.fileSlug}/`,
    "dg-publish": d =>
      typeof d["dg-publish"] === "boolean" ? d["dg-publish"] : true,
    visibility: d => d.visibility || "public",
  },
};
