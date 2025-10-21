module.exports = class {
  data() {
    return {
      permalink: "/data/milestones.json",
      eleventyExcludeFromCollections: true
    };
  }
  render({ collections }) {
    const items = (collections.milestones || []).map(p => ({
      title: p.data?.title || p.fileSlug,
      due: p.data?.due || null,
      status: p.data?.status || null,
      area: p.data?.area || null,
      url: p.url
    }));
    return JSON.stringify(items, null, 2);
  }
};