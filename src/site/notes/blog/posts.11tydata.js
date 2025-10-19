// src/site/notes/blog/posts.11tydata.js
module.exports = {
  eleventyComputed: {
    type: d => d.type || "post",                       // mark as posts
    title: d => d.title || d.page.fileSlug,
    description: d =>
      d.description ||
      (d.content || "").replace(/<[^>]*>/g, "").trim().slice(0, 160),
    date: d => d.date || d.page.date,
    permalink: d => d.permalink || `/blog/${d.page.fileSlug}/`,
    "dg-publish": d => (typeof d["dg-publish"] === "boolean" ? d["dg-publish"] : true),
    visibility: d => d.visibility || "public",
  },
};
