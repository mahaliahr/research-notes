require("dotenv").config();
const settings = require("../../helpers/constants");

const allSettings = settings.ALL_NOTE_SETTINGS;

module.exports = {
  layout: "note.njk",
  eleventyComputed: {
    layout: (data) => {
      const tags = Array.isArray(data.tags) ? data.tags : [];
      // remove "layouts/" prefix here
      return tags.includes("gardenEntry") ? "index.njk" : "note.njk";
    },
    permalink: (data) => {
      if (data.tags.indexOf("gardenEntry") != -1) {
        return "/";
      }
      return data.permalink || undefined;
    },
    settings: (data) => {
      const noteSettings = {};
      allSettings.forEach((setting) => {
        let noteSetting = data[setting];
        let globalSetting = process.env[setting];

        let settingValue =
          noteSetting || (globalSetting === "true" && noteSetting !== false);
        noteSettings[setting] = settingValue;
      });
      return noteSettings;
    },

    // Public-by-default (override in front matter if needed)
    "dg-publish": (d) =>
      typeof d["dg-publish"] === "boolean" ? d["dg-publish"] : true,

    visibility: (d) => d.visibility || "public",

    // done globally now in eleventyComputed.js
    // title: (d) => d.page.fileSlug,

    // do NOT set type: "post" here
    title: d => d.title || d.page.fileSlug,
    description: d =>
      d.description ||
      (d.content || "").replace(/<[^>]*>/g, "").trim().slice(0, 160),

    // Keep notes under /notes/<slug>/
    permalink: d => d.permalink || `/notes/${d.page.fileSlug}/`,

    // Many people prefer not to force dates on zettels; leave as-is if present
    // date: d => d.date || d.page.date,

    updated: d => d.updated || d.page.date, // optional helper for “recent notes”
    "dg-publish": d => (typeof d["dg-publish"] === "boolean" ? d["dg-publish"] : true),
    visibility: d => d.visibility || "public",

    // Basic description fallback from content
    description: (d) =>
      d.description ||
      (d.content || "").replace(/<[^>]*>/g, "").trim().slice(0, 160),

    // Updated date fallback
    updated: (d) => d.updated || d.page.date,
  },
};
