function userMarkdownSetup(md) {
  // The md parameter stands for the markdown-it instance used throughout the site generator.
  // Feel free to add any plugin you want here instead of /.eleventy.js
}
function userEleventySetup(eleventyConfig) {
  // The eleventyConfig parameter stands for the the config instantiated in /.eleventy.js.
  // Feel free to add any plugin you want here instead of /.eleventy.js

  // Helper to filter only public published notes
  const isPublic = (p) => p?.data?.["dg-publish"] && p?.data?.visibility !== "private";

  eleventyConfig.addCollection("milestones", (collection) =>
    collection.getAll().filter(isPublic).filter(p => p.data.type === "milestone")
      .sort((a,b) => new Date(a.data.due) - new Date(b.data.due))
  );

  eleventyConfig.addCollection("sessions", (collection) =>
    collection.getAll().filter(isPublic).filter(p => p.data.type === "session")
      .sort((a,b) => new Date(b.data.start) - new Date(a.data.start))
  );

  eleventyConfig.addCollection("streamItems", (collection) =>
    collection.getAll().filter(isPublic).filter(p => p.data.type === "stream")
      .sort((a,b) => new Date(b.data.date) - new Date(a.data.date))
  );

  // // Emit lightweight JSON for client-side widgets
  // eleventyConfig.on('afterBuild', async () => {
  //   const fs = require('fs'); const path = require('path');
  //   const out = path.join(process.cwd(), '_site'); // garden's default output
  //   const data = require('../site/_data/eleventyGlobalData.json'); // 11ty data bag

  //   // Pull the computed collections from the data cascade:
  //   const { collections } = data;

  //   const milestones = (collections.milestones || []).map(p => ({
  //     title: p.data.title || p.fileSlug,
  //     due: p.data.due, status: p.data.status, area: p.data.area,
  //     url: p.url
  //   }));

  //   const sessions = (collections.sessions || []).map(p => ({
  //     topic: p.data.topic || p.data.title || p.fileSlug,
  //     start: p.data.start, end: p.data.end || null, url: p.url
  //   }));

  //   const stream = (collections.streamItems || []).slice(0, 50).map(p => ({
  //     date: p.data.date, url: p.url
  //   }));

  //   fs.writeFileSync(path.join(out,'/data/milestones.json'), JSON.stringify(milestones, null, 2));
  //   fs.writeFileSync(path.join(out,'/data/sessions.json'), JSON.stringify(sessions, null, 2));
  //   fs.writeFileSync(path.join(out,'/data/stream.json'), JSON.stringify(stream, null, 2));
  // });
}

function useMarkdownSetup(md) {}
exports.userMarkdownSetup = userMarkdownSetup;
exports.userEleventySetup = userEleventySetup;
