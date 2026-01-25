module.exports = {
  // Tag all markdown files in blog as "posts" except the index
  tags: d => d.page.fileSlug === 'index'
    ? (Array.isArray(d.tags) ? d.tags : [])
    : [...new Set([...(Array.isArray(d.tags) ? d.tags : []), 'posts'])],

  // Put output under /notes/blog/
  permalink: d => d.page.fileSlug === 'index'
    ? "/notes/blog/"
    : `/notes/blog/${d.page.fileSlug}/`,

  // Use site layouts
  layout: d => d.page.fileSlug === 'index'
    ? "layouts/index.njk"
    : "layouts/note.njk",

  // Don’t include the index in the posts collection
  eleventyExcludeFromCollections: d => d.page.fileSlug === 'index',

  eleventyComputed: {
    title: d => d.title || d.page.fileSlug,
    description: d =>
      d.description || (d.content || "").replace(/<[^>]*>/g, "").trim().slice(0, 160),
    date: d => (d.date instanceof Date || typeof d.date === "string")
      ? d.date
      : (typeof d.date === "number" ? new Date(d.date) : d.page.date),
    "dg-publish": d => typeof d["dg-publish"] === "boolean" ? d["dg-publish"] : true,
    visibility: d => d.visibility || "public",
  },
};
