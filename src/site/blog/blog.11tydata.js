module.exports = {
  tags: ["posts"],
  permalink: data => data.page.fileSlug === "index" ? "/posts/" : `/posts/${data.page.fileSlug}/`,
  eleventyComputed: {
    layout: data => data.page.fileSlug === "index" ? "list.njk" : "note.njk",
    title: d => d.title || d.page.fileSlug,
    description: d => d.description || (d.content || "").replace(/<[^>]*>/g, "").trim().slice(0, 160),
    date: d => {
      if (d.date instanceof Date) return d.date;
      if (typeof d.date === "string") return new Date(d.date);
      return d.page.date;
    },
  },
};
