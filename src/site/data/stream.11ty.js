class StreamJson {
  data() {
    return { permalink: "/data/stream.json", eleventyExcludeFromCollections: true };
  }
  render(data) {
    const items = (data.collections?.streamItems || []).slice(0, 50).map(i => ({
      date: i.date, text: i.text, url: i.url,
    }));
    return JSON.stringify(items);
  }
}
<<<<<<< HEAD
module.exports = StreamJson;
=======
module.exports = StreamJson;
>>>>>>> main
