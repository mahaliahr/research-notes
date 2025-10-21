class SessionsJson {
  data() {
    return { permalink: "/data/sessions.json", eleventyExcludeFromCollections: true };
  }
  render(data) {
    const items = (data.collections?.sessions || []).map(s => ({
      start: s.start, end: s.end || null, topic: s.topic, url: s.url,
    }));
    return JSON.stringify(items);
  }
}
module.exports = SessionsJson;
