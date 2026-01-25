require("dotenv").config();
const settings = require("../../helpers/constants");

const allSettings = settings.ALL_NOTE_SETTINGS;

module.exports = {
  layout: "note.njk",
  eleventyComputed: {
    layout: (data) => {
      if (data.page?.inputPath?.includes('/notes/blog/') &&
          (data.page.fileSlug === 'index' || data.page.fileSlug === 'blog-index')) {
        return data.layout || "layouts/index.njk";
      }
      const tags = Array.isArray(data.tags) ? data.tags : [];
      return tags.includes("gardenEntry") ? "index.njk" : "note.njk";
    },

    permalink: (data) => {
      const tags = Array.isArray(data.tags) ? data.tags : [];
      
      if (tags.includes("gardenEntry")) return "/";
      if (data.permalink && data.permalink !== false) return data.permalink;
      
      return `/notes/${data.page.fileSlug}/`;
    },

    settings: (data) => {
      const noteSettings = {};
      for (const setting of allSettings) {
        const noteSetting = data[setting];
        const globalSetting = process.env[setting];
        
        noteSettings[setting] =
          typeof noteSetting !== "undefined"
            ? noteSetting
            : (globalSetting === "true" && noteSetting !== false);
      }
      return noteSettings;
    },

    "dg-publish": (d) =>
      typeof d["dg-publish"] === "boolean" ? d["dg-publish"] : true,

    visibility: (d) => d.visibility || "public",

    title: d => {
      const rawTitle = d.title;
      if (rawTitle instanceof Date) {
        return rawTitle.toISOString().split('T')[0];
      }
      return rawTitle || d.page.fileSlug;
    },
    
    description: d =>
      d.description ||
      (d.content || "").replace(/<[^>]*>/g, "").trim().slice(0, 160),

    updated: (d) => d.updated || d.page.date,
  },
};
