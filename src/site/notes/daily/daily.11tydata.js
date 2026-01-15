module.exports = {
  eleventyComputed: {
    // DAILY -> /daily/<slug>/
    permalink: d => d.permalink || `/daily/${d.page.fileSlug}/`,
    
    // Transform the title for display
    title: d => {
      if (d.title && /^\d{4}-\d{2}-\d{2}$/.test(d.title)) {
        // Convert YYYY-MM-DD to a friendlier format
        const date = new Date(d.title + 'T00:00:00');
        return date.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      return d.title || d.page.fileSlug;
    }
  }
};
