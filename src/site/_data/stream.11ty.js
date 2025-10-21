exports.data = { permalink: "/data/stream.json" };
exports.render = ({ collections }) => {
  const items = (collections.streamItems || []).slice(0, 100).map(x => ({
    date: x.date || x.data?.date || null,
    text: x.text || x.data?.text || "",
    url: x.url
  }));
  return JSON.stringify(items, null, 2);
};
