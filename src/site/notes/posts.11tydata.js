// src/site/notes/notes.11tydata.js
module.exports = {
  layout: "note.njk", // or your note layout
  eleventyComputed: {
    // do NOT set type: "post" here
    title: d => d.title || d.page.fileSlug,
    description: d =>
      d.description ||
      (d.content || "").replace(/<[^>]*>/g, "").trim().slice(0, 160),

    // Keep notes under /notes/<slug>/
    permalink: d => d.permalink || `/notes/${d.page.fileSlug}/`,

    // Many people prefer not to force dates on zettels; leave as-is if present
    // date: d => d.date || d.page.date,

    updated: d => d.updated || d.page.date, // optional helper for “recent notes”
    "dg-publish": d => (typeof d["dg-publish"] === "boolean" ? d["dg-publish"] : true),
    visibility: d => d.visibility || "public",
  }
};
