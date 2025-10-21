module.exports = class {
  data() {
    return {
      permalink: "/data/sessions.json",
      eleventyExcludeFromCollections: true
    };
  }
  render({ collections }) {
    const items = (collections.sessions || []).map(s => ({
      topic: s.topic || s.data?.topic || s.data?.title || s.fileSlug,
      start: s.start || s.data?.start || null,
      end: s.end || s.data?.end || null,
      url: s.url
    }));
    return JSON.stringify(items, null, 2);
  }
};