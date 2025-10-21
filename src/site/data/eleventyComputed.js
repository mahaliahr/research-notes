const { getGraph } = require("../../helpers/linkUtils");
const { getFileTree } = require("../../helpers/filetreeUtils");
const { userComputed } = require("../../helpers/userUtils");

// module.exports = {
//   graph: (data) => getGraph(data),
//   filetree: (data) => getFileTree(data),
//   userComputed: (data) => userComputed(data)
// };

module.exports = { graph: async () => null };

function prettifyFromSlug(slug = "") {
  // decode %20, etc.; turn -, _ to spaces; collapse spaces; Title Case
  const s = decodeURIComponent(slug)
    .replace(/\.[^/.]+$/g, "")       // drop extension if present
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = {
  // If a page doesn't set `title:` in front matter,
  // use a prettified version of the fileSlug.
  title: (data) => {
    if (data.title) return data.title;
    const slug = data?.page?.fileSlug || "";
    if (slug) return prettifyFromSlug(slug);
    // fallback: last URL segment if no slug
    const seg = (data?.page?.url || "").split("/").filter(Boolean).pop() || "";
    return prettifyFromSlug(seg);
  },
date: (data) => {
    const d = data.date;
    if (d == null) return d;
    if (d instanceof Date) return d;
    if (typeof d === "string") {
      // Ignore unresolved template tokens
      if (d.includes("{{") || d.includes("<%")) return undefined;
      return d;
    }
    if (typeof d === "number") return new Date(d); // tolerate timestamps
    return undefined; // drop weird types
  },
};