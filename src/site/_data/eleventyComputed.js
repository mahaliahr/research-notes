const { getGraph } = require("../../helpers/linkUtils");

module.exports = {
  graph: (data) => {
    const notes = data?.collections?.notes || data?.collections?.note;
    if (!Array.isArray(notes) || !notes.length) return null;
    try { return getGraph(data); } catch { return null; }
  },
  date: (data) => {
    const d = data.date;
    if (d == null) return d;
    if (d instanceof Date) return d;
    if (typeof d === "string") {
      if (d.includes("{{") || d.includes("<%")) return undefined;
      return d;
    }
    if (typeof d === "number") return new Date(d);
    return undefined;
  }
};
>>>>>>> b078af0 (attempting fix of date bug):src/site/_data/eleventyComputed.js
