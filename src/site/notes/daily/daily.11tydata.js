module.exports = {
  eleventyComputed: {
    // DAILY -> /daily/<slug>/
    permalink: d => d.permalink || `/daily/${d.page.fileSlug}/`,
  }
};
