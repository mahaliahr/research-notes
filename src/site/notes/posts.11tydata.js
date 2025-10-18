module.exports = {
  eleventyComputed: {
    type: d => d.type || "post",
    title: d => d.title || d.page.fileSlug,
    description: d =>
      d.description ||
      (d.content || "").replace(/<[^>]*>/g, "").trim().slice(0, 160),
    permalink: d => d.permalink || `/blog/${d.page.fileSlug}/`,
    date: d => d.date || d.page.date,
    "dg-publish": d => (typeof d["dg-publish"] === "boolean" ? d["dg-publish"] : true),
    visibility: d => d.visibility || "public",
  }
};