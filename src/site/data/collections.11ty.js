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