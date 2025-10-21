class MilestonesJson {
  data() {
    return { permalink: "/data/milestones.json", eleventyExcludeFromCollections: true };
  }
  render(data) {
    const items = (data.collections?.milestones || []).map(m => ({
      title: m.title, due: m.due, status: m.status, area: m.area || null, url: m.url,
    }));
    return JSON.stringify(items);
  }
}
module.exports = MilestonesJson;
