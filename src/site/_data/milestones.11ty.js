exports.data = { permalink: "/data/milestones.json" };
exports.render = ({ collections }) => {
  const items = (collections.milestones || []).map(m => ({
    title: m.title || m.data?.title || m.fileSlug,
    due: m.due || m.data?.due || null,
    status: m.status || m.data?.status || "planned",
    area: m.area || m.data?.area || null,
    url: m.url
  }));
  return JSON.stringify(items, null, 2);
};
