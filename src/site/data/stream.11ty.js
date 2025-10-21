module.exports = class {
  data() {
    return {
      permalink: "/data/stream.json",
      eleventyExcludeFromCollections: true
    };
  }
  render({ collections }) {
    const items = (collections.streamItems || []).map(i => ({
      date: i.date || i.data?.date || null,
      text: i.text || i.data?.text || "",
      url: i.url
    }));
    return JSON.stringify(items, null, 2);
  }
};