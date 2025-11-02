class PostsApi {
  data() {
    return {
      permalink: "/api/posts.json",
      eleventyExcludeFromCollections: true,
    };
  }
  render(data) {
    const posts = (data.collections?.postFeaturedFirst || []).slice(0, 10);
    return JSON.stringify(
      posts.map(p => ({
        title: p.data?.title || p.fileSlug,
        url: p.url,
        date: p.date,
        description: p.data?.description || "",
      }))
    );
  }
}
module.exports = PostsApi;