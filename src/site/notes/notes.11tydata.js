require("dotenv").config();
const settings = require("../../helpers/constants");

const allSettings = settings.ALL_NOTE_SETTINGS;

module.exports = {
  eleventyComputed: {
    // Layout: home note (gardenEntry) vs regular note
    layout: (data) => {
      const tags = Array.isArray(data.tags) ? data.tags : [];
      return tags.includes("gardenEntry") ? "layouts/index.njk" : "layouts/note.njk";
    },

    // Permalink:
    // - gardenEntry → "/"
    // - otherwise: explicit front matter if provided, else /notes/<fileSlug>/
    permalink: (data) => {
      const tags = Array.isArray(data.tags) ? data.tags : [];
      if (tags.includes("gardenEntry")) return "/";
      return data.permalink || `/notes/${data.page.fileSlug}/`;
    },

    // Per-note settings merged with env defaults (DG convention)
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

    // Public-by-default (override in front matter if needed)
    "dg-publish": (d) =>
      typeof d["dg-publish"] === "boolean" ? d["dg-publish"] : true,

    visibility: (d) => d.visibility || "public",

    // Titles default to filename (Zettelkasten style)
    title: (d) => d.page.fileSlug,

    // Basic description fallback from content
    description: (d) =>
      d.description ||
      (d.content || "").replace(/<[^>]*>/g, "").trim().slice(0, 160),

    // Updated date fallback
    updated: (d) => d.updated || d.page.date,
  },
};
