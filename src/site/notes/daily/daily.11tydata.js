module.exports = {
  eleventyComputed: {
    // DAILY -> /daily/<slug>/
    permalink: d => {
      if (d.permalink === false) return false;
      return d.permalink || `/daily/${d.page.fileSlug}/`;
    },
    
    // transform the title for display - return string, not date
    title: d => {
      // get the raw title from frontmatter
      const rawTitle = d.title;
      
      // if title matches YYYY-MM-DD format, format it nicely
      if (rawTitle && typeof rawTitle === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawTitle)) {
        const [year, month, day] = rawTitle.split('-');
        const date = new Date(Date.UTC(year, month - 1, day));
        
        // return formatted string
        return date.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          timeZone: 'UTC'
        });
      }
      
      // for any other title, return as-is (ensure it's a string)
      return String(rawTitle || d.page.fileSlug || '');
    }
  }
};
