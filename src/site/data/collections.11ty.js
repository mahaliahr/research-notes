class CollectionsDebug {
  data() { return { permalink: "/collections.json", eleventyExcludeFromCollections: true }; }
  render(data) {
    const c = data.collections || {};
    const summarize = (arr) => Array.isArray(arr) ? arr.map(p => ({ url: p.url, inputPath: p.inputPath })).slice(0, 10) : [];
    return JSON.stringify({
      counts: {
        note: (c.note || []).length,
        notes: (c.notes || []).length,
        post: (c.post || []).length,
      },
      sample: {
        notes: summarize(c.notes),
      }
    }, null, 2);
  }
}
module.exports = CollectionsDebug;

module.exports.posts = (collectionApi) => {
  return collectionApi.getFilteredByGlob('src/site/notes/blog/*.md');
};

module.exports.zettels = (collectionApi) => {
  return collectionApi
    .getFilteredByGlob('src/site/notes/**/*.md')
    .filter(item => item.data['dg-publish'] !== false)
    .sort((a, b) => {
      const ad = new Date(a.data.updated || a.date);
      const bd = new Date(b.data.updated || b.date);
      return bd - ad; // newest first
    });
};