require("dotenv").config();
const settings = require("../../helpers/constants");

const allSettings = settings.ALL_NOTE_SETTINGS;

module.exports = {
  eleventyComputed: {
    layout: (data) => {
      if (data.tags.indexOf("gardenEntry") != -1) {
        return "layouts/index.njk";
      }
      return "layouts/note.njk";
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
    "dg-publish": d => (typeof d["dg-publish"] === "boolean" ? d["dg-publish"] : true),
    visibility: d => d.visibility || "public",
    title: d => d.page.fileSlug,
    description: d =>
      d.description ||
      (d.content || "").replace(/<[^>]*>/g, "").trim().slice(0, 160),
    permalink: d => d.permalink || `/notes/${d.page.fileSlug}/`,
    "dg-publish": d => (typeof d["dg-publish"] === "boolean" ? d["dg-publish"] : true),
    visibility: d => d.visibility || "public",
    updated: d => d.updated || d.page.date,
  },
};
