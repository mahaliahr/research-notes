exports.data = { permalink: "/data/sessions.json" };
exports.render = ({ collections }) => {
  const items = (collections.sessions || []).map(s => ({
    topic: s.topic || s.data?.topic,
    start: s.start || s.data?.start || null,
    end: s.end || s.data?.end || null,
    url: s.url
  }));
  return JSON.stringify(items, null, 2);
};
