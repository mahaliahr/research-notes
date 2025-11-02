const slugify = require("@sindresorhus/slugify");
const markdownIt = require("markdown-it");
const fs = require("fs");
const matter = require("gray-matter");
const faviconsPlugin = require("eleventy-plugin-gen-favicons");
const tocPlugin = require("eleventy-plugin-nesting-toc");
const { parse } = require("node-html-parser");
const htmlMinifier = require("html-minifier-terser");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const fg = require("fast-glob");

const { headerToId, namedHeadingsFilter } = require("./src/helpers/utils");
const {
  userMarkdownSetup,
  userEleventySetup,
} = require("./src/helpers/userSetup");

const Image = require("@11ty/eleventy-img");
function transformImage(src, cls, alt, sizes, widths = ["500", "700", "auto"]) {
  let options = {
    widths: widths,
    formats: ["webp", "jpeg"],
    outputDir: "./dist/img/optimized",
    urlPath: "/img/optimized",
  };

  // generate images, while this is async we don’t wait
  Image(src, options);
  let metadata = Image.statsSync(src, options);
  return metadata;
}

function getAnchorLink(filePath, linkTitle) {
  const {attributes, innerHTML} = getAnchorAttributes(filePath, linkTitle);
  return `<a ${Object.keys(attributes).map(key => `${key}="${attributes[key]}"`).join(" ")}>${innerHTML}</a>`;
}

function getAnchorAttributes(filePath, linkTitle) {
  let fileName = filePath.replaceAll("&amp;", "&");
  let header = "";
  let headerLinkPath = "";
  if (filePath.includes("#")) {
    [fileName, header] = filePath.split("#");
    headerLinkPath = `#${headerToId(header)}`;
  }

  let noteIcon = process.env.NOTE_ICON_DEFAULT;
  const title = linkTitle ? linkTitle : fileName;
  let permalink = `/notes/${slugify(filePath)}`;
  let deadLink = false;
  try {
    const startPath = "./src/site/notes/";
    const fullPath = fileName.endsWith(".md")
      ? `${startPath}${fileName}`
      : `${startPath}${fileName}.md`;
    const file = fs.readFileSync(fullPath, "utf8");
    const frontMatter = matter(file);
    if (frontMatter.data.permalink) {
      permalink = frontMatter.data.permalink;
    }
    if (
      frontMatter.data.tags &&
      frontMatter.data.tags.indexOf("gardenEntry") != -1
    ) {
      permalink = "/";
    }
    if (frontMatter.data.noteIcon) {
      noteIcon = frontMatter.data.noteIcon;
    }
  } catch {
    deadLink = true;
  }

  if (deadLink) {
    return {
      attributes: {
        "class": "internal-link is-unresolved",
        "href": "/404",
        "target": "",
      },
      innerHTML: title,
    }
  }
  return {
    attributes: {
      "class": "internal-link",
      "target": "",
      "data-note-icon": noteIcon,
      "href": `${permalink}${headerLinkPath}`,
    },
    innerHTML: title,
  }
}

const tagRegex = /(^|\s|\>)(#[^\s!@#$%^&*()=+\.,\[{\]};:'"?><]+)(?!([^<]*>))/g;

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/site/styles": "styles" });
  eleventyConfig.addPassthroughCopy({ "src/site/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/site/img": "img" });
  eleventyConfig.addPassthroughCopy({ "src/site/favicon.svg": "favicon.svg" });

  eleventyConfig.addWatchTarget("src/site/assets");
  eleventyConfig.addWatchTarget("src/site/styles");

  eleventyConfig.setLiquidOptions({
    dynamicPartials: true,
  });
  let markdownLib = markdownIt({
    breaks: true,
    html: true,
    linkify: true,
  })
    .use(require("markdown-it-anchor"), {
      slugify: headerToId,
    })
    .use(require("markdown-it-mark"))
    .use(require("markdown-it-footnote"))
    .use(function (md) {
      md.renderer.rules.hashtag_open = function (tokens, idx) {
        return '<a class="tag" onclick="toggleTagSearch(this)">';
      };
    })
    .use(require("markdown-it-mathjax3"), {
      tex: {
        inlineMath: [["$", "$"]],
      },
      options: {
        skipHtmlTags: { "[-]": ["pre"] },
      },
    })
    .use(require("markdown-it-attrs"))
    .use(require("markdown-it-task-checkbox"), {
      disabled: true,
      divWrap: false,
      divClass: "checkbox",
      idPrefix: "cbx_",
      ulClass: "task-list",
      liClass: "task-list-item",
    })
    .use(require("markdown-it-plantuml"), {
      openMarker: "```plantuml",
      closeMarker: "```",
    })
    .use(namedHeadingsFilter)
    .use(function (md) {
      //https://github.com/DCsunset/markdown-it-mermaid-plugin
      const origFenceRule =
        md.renderer.rules.fence ||
        function (tokens, idx, options, env, self) {
          return self.renderToken(tokens, idx, options, env, self);
        };
      md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
        const token = tokens[idx];
        if (token.info === "mermaid") {
          const code = token.content.trim();
          return `<pre class="mermaid">${code}</pre>`;
        }
        if (token.info === "transclusion") {
          const code = token.content.trim();
          return `<div class="transclusion">${md.render(code)}</div>`;
        }
        if (token.info.startsWith("ad-")) {
          const code = token.content.trim();
          const parts = code.split("\n")
          let titleLine;
          let collapse;
          let collapsible = false
          let collapsed = true
          let icon;
          let color;
          let nbLinesToSkip = 0
          for (let i = 0; i < 4; i++) {
            if (parts[i] && parts[i].trim()) {
              let line = parts[i] && parts[i].trim().toLowerCase()
              if (line.startsWith("title:")) {
                titleLine = line.substring(6);
                nbLinesToSkip++;
              } else if (line.startsWith("icon:")) {
                icon = line.substring(5);
                nbLinesToSkip++;
              } else if (line.startsWith("collapse:")) {
                collapsible = true
                collapse = line.substring(9);
                if (collapse && collapse.trim().toLowerCase() == 'open') {
                  collapsed = false
                }
                nbLinesToSkip++;
              } else if (line.startsWith("color:")) {
                color = line.substring(6);
                nbLinesToSkip++;
              }
            }
          }
          const foldDiv = collapsible ? `<div class="callout-fold">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-chevron-down">
              <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          </div>` : "";
          const titleDiv = titleLine
            ? `<div class="callout-title"><div class="callout-title-inner">${titleLine}</div>${foldDiv}</div>`
            : "";
          let collapseClasses = titleLine && collapsible ? 'is-collapsible' : ''
          if (collapsible && collapsed) {
            collapseClasses += " is-collapsed"
          }

          let res = `<div data-callout-metadata class="callout ${collapseClasses}" data-callout="${token.info.substring(3)
            }">${titleDiv}\n<div class="callout-content">${md.render(
              parts.slice(nbLinesToSkip).join("\n")
            )}</div></div>`;
          return res
        }

        // Other languages
        return origFenceRule(tokens, idx, options, env, slf);
      };

      const defaultImageRule =
        md.renderer.rules.image ||
        function (tokens, idx, options, env, self) {
          return self.renderToken(tokens, idx, options, env, self);
        };

      md.renderer.rules.image = (tokens, idx, options, env, self) => {
        // Preserve your existing width/metadata parsing from token.content
        const imageName = tokens[idx].content;
        const [fileName, ...widthAndMetaData] = imageName.split("|");
        const lastValue = widthAndMetaData[widthAndMetaData.length - 1];
        const lastValueIsNumber = !isNaN(lastValue);
        const width = lastValueIsNumber ? lastValue : null;

        let metaData = "";
        if (widthAndMetaData.length > 1) {
          metaData = widthAndMetaData.slice(0, widthAndMetaData.length - 1).join(" ");
        }
        if (!lastValueIsNumber) {
          metaData += ` ${lastValue}`;
        }
        if (width) {
          const widthIndex = tokens[idx].attrIndex("width");
          const widthAttr = `${width}px`;
          if (widthIndex < 0) tokens[idx].attrPush(["width", widthAttr]);
          else tokens[idx].attrs[widthIndex][1] = widthAttr;
        }

        // NEW: rewrite relative image src to public /notes/images path
        const srcIdx = tokens[idx].attrIndex("src");
        if (srcIdx >= 0) {
          let src = tokens[idx].attrs[srcIdx][1] || "";
          const isAbsolute = /^https?:\/\//i.test(src) || src.startsWith("/");
          if (!isAbsolute) {
            // Keep subpath if user wrote images/foo.png; else prefix images/
            src = src.startsWith("images/")
              ? `/notes/${src}`
              : `/notes/images/${src}`;
            tokens[idx].attrs[srcIdx][1] = src;
          }
        }

        return defaultImageRule(tokens, idx, options, env, self);
      };

      const defaultLinkRule =
        md.renderer.rules.link_open ||
        function (tokens, idx, options, env, self) {
          return self.renderToken(tokens, idx, options, env, self);
        };
      md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
        const aIndex = tokens[idx].attrIndex("target");
        const classIndex = tokens[idx].attrIndex("class");

        if (aIndex < 0) {
          tokens[idx].attrPush(["target", "_blank"]);
        } else {
          tokens[idx].attrs[aIndex][1] = "_blank";
        }

        if (classIndex < 0) {
          tokens[idx].attrPush(["class", "external-link"]);
        } else {
          tokens[idx].attrs[classIndex][1] = "external-link";
        }

        return defaultLinkRule(tokens, idx, options, env, self);
      };
    })
    .use(userMarkdownSetup);

  eleventyConfig.setLibrary("md", markdownLib);

  // Place filters BEFORE the return (not after)
  eleventyConfig.addFilter("isoDate", function (date) {
    return date ? new Date(date).toISOString() : "";
  });

  eleventyConfig.addFilter("link", function (str) {
    return (
      str &&
      str.replace(/\[\[(.*?\|.*?)\]\]/g, function (match, p1) {
        if (p1.indexOf("],[") > -1 || p1.indexOf('"$"') > -1) return match;
        const [fileLink, linkTitle] = p1.split("|");
        return getAnchorLink(fileLink, linkTitle);
      })
    );
  });

  eleventyConfig.addFilter("taggify", function (str) {
    return (
      str &&
      str.replace(tagRegex, function (match, precede, tag) {
        return `${precede}<a class="tag" onclick="toggleTagSearch(this)" data-content="${tag}">${tag}</a>`;
      })
    );
  });

  eleventyConfig.addFilter("searchableTags", function (str) {
    let tags;
    let match = str && str.match(tagRegex);
    if (match) {
      tags = match
        .map((m) => {
          return `"${m.split("#")[1]}"`;
        })
        .join(", ");
    }
    if (tags) {
      return `${tags},`;
    } else {
      return "";
    }
  });

  eleventyConfig.addFilter("hideDataview", function (str) {
    return (
      str &&
      str.replace(/\(\S+\:\:(.*)\)/g, function (_, value) {
        return value.trim();
      })
    );
  });

  eleventyConfig.addTransform("dataview-js-links", function (str) {
    const parsed = parse(str);
    for (const dataViewJsLink of parsed.querySelectorAll("a[data-href].internal-link")) {
      const notePath = dataViewJsLink.getAttribute("data-href");
      const title = dataViewJsLink.innerHTML;
      const {attributes, innerHTML} = getAnchorAttributes(notePath, title);
      for (const key in attributes) {
        dataViewJsLink.setAttribute(key, attributes[key]);
      }
      dataViewJsLink.innerHTML = innerHTML;
    }

    return str && parsed.innerHTML;
  });

  eleventyConfig.addTransform("callout-block", function (str) {
    const parsed = parse(str);

    const transformCalloutBlocks = (
      blockquotes = parsed.querySelectorAll("blockquote")
    ) => {
      for (const blockquote of blockquotes) {
        transformCalloutBlocks(blockquote.querySelectorAll("blockquote"));

        let content = blockquote.innerHTML;

        let titleDiv = "";
        let calloutType = "";
        let calloutMetaData = "";
        let isCollapsable;
        let isCollapsed;
        const calloutMeta = /\[!([\w-]*)\|?(\s?.*)\](\+|\-){0,1}(\s?.*)/;
        if (!content.match(calloutMeta)) {
          continue;
        }

        content = content.replace(
          calloutMeta,
          function (metaInfoMatch, callout, metaData, collapse, title) {
            isCollapsable = Boolean(collapse);
            isCollapsed = collapse === "-";
            const titleText = title.replace(/(<\/{0,1}\w+>)/, "")
              ? title
              : `${callout.charAt(0).toUpperCase()}${callout
                .substring(1)
                .toLowerCase()}`;
            const fold = isCollapsable
              ? `<div class="callout-fold"><i icon-name="chevron-down"></i></div>`
              : ``;

            calloutType = callout;
            calloutMetaData = metaData;
            titleDiv = `<div class="callout-title"><div class="callout-title-inner">${titleText}</div>${fold}</div>`;
            return "";
          }
        );

        /* Hacky fix for callouts with only a title:
        This will ensure callout-content isn't produced if
        the callout only has a title, like this:
        ```md
        > [!info] i only have a title
        ```
        Not sure why content has a random <p> tag in it,
        */
        if (content === "\n<p>\n") {
          content = "";
        }
        let contentDiv = content ? `\n<div class="callout-content">${content}</div>` : "";

        blockquote.tagName = "div";
        blockquote.classList.add("callout");
        blockquote.classList.add(isCollapsable ? "is-collapsible" : "");
        blockquote.classList.add(isCollapsed ? "is-collapsed" : "");
        blockquote.setAttribute("data-callout", calloutType.toLowerCase());
        calloutMetaData && blockquote.setAttribute("data-callout-metadata", calloutMetaData);
        blockquote.innerHTML = `${titleDiv}${contentDiv}`;
      }
    };

    transformCalloutBlocks();

    return str && parsed.innerHTML;
  });

  function fillPictureSourceSets(src, cls, alt, meta, width, imageTag) {
    imageTag.tagName = "picture";
    let html = `<source
      media="(max-width:480px)"
      srcset="${meta.webp[0].url}"
      type="image/webp"
      />
      <source
      media="(max-width:480px)"
      srcset="${meta.jpeg[0].url}"
      />
      `
    if (meta.webp && meta.webp[1] && meta.webp[1].url) {
      html += `<source
        media="(max-width:1920px)"
        srcset="${meta.webp[1].url}"
        type="image/webp"
        />`
    }
    if (meta.jpeg && meta.jpeg[1] && meta.jpeg[1].url) {
      html += `<source
        media="(max-width:1920px)"
        srcset="${meta.jpeg[1].url}"
        />`
    }
    html += `<img
      class="${cls.toString()}"
      src="${src}"
      alt="${alt}"
      width="${width}"
      />`;
    imageTag.innerHTML = html;
  }


  eleventyConfig.addTransform("picture", function (str) {
    if(process.env.USE_FULL_RESOLUTION_IMAGES === "true"){
      return str;
    }
    const parsed = parse(str);
    for (const imageTag of parsed.querySelectorAll(".cm-s-obsidian img")) {
      const src = imageTag.getAttribute("src");
      if (src && src.startsWith("/") && !src.endsWith(".svg")) {
        const cls = imageTag.classList.value;
        const alt = imageTag.getAttribute("alt");
        const width = imageTag.getAttribute("width") || '';

        try {
          const meta = transformImage(
            "./src/site" + decodeURI(imageTag.getAttribute("src")),
            cls.toString(),
            alt,
            ["(max-width: 480px)", "(max-width: 1024px)"]
          );

          if (meta) {
            fillPictureSourceSets(src, cls, alt, meta, width, imageTag);
          }
        } catch {
          // Make it fault tolarent.
        }
      }
    }
    return str && parsed.innerHTML;
  });

  eleventyConfig.addTransform("table", function (str) {
    const parsed = parse(str);
    for (const t of parsed.querySelectorAll(".cm-s-obsidian > table")) {
      let inner = t.innerHTML;
      t.tagName = "div";
      t.classList.add("table-wrapper");
      t.innerHTML = `<table>${inner}</table>`;
    }

    for (const t of parsed.querySelectorAll(
      ".cm-s-obsidian > .block-language-dataview > table"
    )) {
      t.classList.add("dataview");
      t.classList.add("table-view-table");
      t.querySelector("thead")?.classList.add("table-view-thead");
      t.querySelector("tbody")?.classList.add("table-view-tbody");
      t.querySelectorAll("thead > tr")?.forEach((tr) => {
        tr.classList.add("table-view-tr-header");
      });
      t.querySelectorAll("thead > tr > th")?.forEach((th) => {
        th.classList.add("table-view-th");
      });
    }
    return str && parsed.innerHTML;
  });

  eleventyConfig.addTransform("htmlMinifier", (content, outputPath) => {
    if (
      (process.env.NODE_ENV === "production" || process.env.ELEVENTY_ENV === "prod") &&
      outputPath &&
      outputPath.endsWith(".html")
    ) {
      return htmlMinifier.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        preserveLineBreaks: true,
        minifyCSS: true,
        minifyJS: true,
        keepClosingSlash: true,
      });
    }
    return content;
  });

  // // Serve assets and images like the original theme
  // eleventyConfig.addPassthroughCopy({ "src/site/assets/js": "assets" }); // expects /assets/img/...
  // eleventyConfig.addWatchTarget("src/site/assets/js");

  // Optional: if you keep attachments next to notes, also copy them
  eleventyConfig.addPassthroughCopy({
    "src/site/notes/**/*.{png,jpg,jpeg,gif,svg,webp,avif}": "notes",
  });
  eleventyConfig.addWatchTarget("src/site/notes");

  // Keep your other passthroughs
  eleventyConfig.addPassthroughCopy({ "src/site/assets": "assets" });
  eleventyConfig.addWatchTarget("src/site/assets");
  eleventyConfig.addPassthroughCopy({ "src/site/styles": "styles" });
  eleventyConfig.addWatchTarget("src/site/styles");
  eleventyConfig.addPassthroughCopy({ "src/site/favicon.svg": "favicon.svg" });
  eleventyConfig.addPassthroughCopy("src/site/img");
  eleventyConfig.addPassthroughCopy("src/site/scripts");
  eleventyConfig.addPassthroughCopy("src/site/styles/_theme.*.css");
  eleventyConfig.addPassthroughCopy({ "src/site/styles": "styles" });
  // eleventyConfig.addPassthroughCopy({ "src/site/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/site/notes/images": "notes/images" });
  eleventyConfig.addWatchTarget("src/site/notes/images");

  // If you want to copy ALL images under notes (including subfolders):
  eleventyConfig.addPassthroughCopy({
    "src/site/notes/**/*.{png,jpg,jpeg,gif,svg,webp,avif}": "notes",
  });
  eleventyConfig.addWatchTarget("src/site/notes");

  eleventyConfig.addPlugin(faviconsPlugin, { outputDir: "dist" });
  eleventyConfig.addPlugin(tocPlugin, {
    ul: true,
    tags: ["h1", "h2", "h3", "h4", "h5", "h6"],
  });


  eleventyConfig.addFilter("dateToZulu", function (date) {
    try {
      return new Date(date).toISOString("dd-MM-yyyyTHH:mm:ssZ");
    } catch {
      return "";
    }
  });
  
  eleventyConfig.addFilter("jsonify", function (variable) {
    return JSON.stringify(variable) || '""';
  });

  eleventyConfig.addFilter("validJson", function (variable) {
    if (Array.isArray(variable)) {
      return variable.map((x) => x.replaceAll("\\", "\\\\")).join(",");
    } else if (typeof variable === "string") {
      return variable.replaceAll("\\", "\\\\");
    }
    return variable;
  });

  eleventyConfig.addPlugin(pluginRss, {
    posthtmlRenderOptions: {
      closingSingleTag: "slash",
      singleTags: ["link"],
    },
  });

  // Convert Obsidian-style image embeds ![[image.png|alt or WxH]]
  eleventyConfig.addFilter("dgMedia", (html) => {
    if (!html) return html;
    const re = /!\[\[([^\]|#]+)(?:#[^\]]+)?(?:\|([^\]]+))?\]\]/g;

    return html.replace(re, (_m, file, alias) => {
      const raw = String(file || "").trim().replace(/^\.?\//, "");
      const ext = raw.split(".").pop().toLowerCase();
      if (!/^(png|jpe?g|gif|svg|webp|avif)$/.test(ext)) return _m;

      // Alt or size (200 or 200x120)
      const a = String(alias || "").trim();
      let alt = a || raw, w, h;
      const m = a.match(/^(\d+)(?:x(\d+))?$/);
      if (m) { w = m[1]; h = m[2]; alt = raw; }

      // Map to public URL under /notes; keep subpath if provided (images/foo.png)
      const src = raw.includes("/") ? `/notes/${encodeURI(raw)}` : `/notes/images/${encodeURI(raw)}`;

      const attrs = [
        `src="${src}"`,
        `alt="${alt.replace(/"/g, "&quot;")}"`,
        `loading="lazy"`, `decoding="async"`,
        w ? `width="${w}"` : "", h ? `height="${h}"` : ""
      ].filter(Boolean).join(" ");

      return `<img ${attrs}>`;
    });
  });

  // isoDate used by blog list templates in DG
  eleventyConfig.addFilter("isoDate", (d) => (d ? new Date(d).toISOString() : ""));

  const getText = (p) => {
  try { return fs.readFileSync(p.inputPath, "utf8"); } catch { return ""; }
};
const inlineField = (src, key) => {
  if (typeof src !== "string" || !src) return null;
  const re = new RegExp(`^\\s*${key}\\s*::\\s*(.+)$`, "mi");
  const m = src.match(re);
  return m ? m[1].trim() : null;
};

// Milestones: lines like "- [ ] Title #milestone @YYYY-MM-DD"
const milestoneRe = /^\s*-\s*\[( |x|X)\]\s+(.+?)\s*(?:@(\d{4}-\d{2}-\d{2}))?(?=\s|$)/gm;
eleventyConfig.addCollection("milestones", (c) => {
  const out = [];
  for (const p of c.getAll()) {
    const txt = getText(p);
    if (!/#milestone\b/.test(txt)) continue;
    let m;
    while ((m = milestoneRe.exec(txt))) {
      const [, box, title, due] = m;
      out.push({
        title: title.replace(/\s+#milestone\b/i, "").trim(),
        due: due || null,
        status: String(box).trim().toLowerCase() === "x" ? "done" : "planned",
        area: null,
        url: p.url,
      });
    }
  }
  return out.sort((a, b) => {
    const ad = a.due ? new Date(a.due).getTime() : Infinity;
    const bd = b.due ? new Date(b.due).getTime() : Infinity;
    return ad - bd;
  });
});

// Sessions: any note in notes/sessions/ or with "start::"
eleventyConfig.addCollection("sessions", (c) => {
  return c.getAll()
    .filter(p => p.inputPath.includes("/notes/sessions/") || /(^|\n)\s*start::/i.test(getText(p)))
    .map(p => {
      const txt = getText(p);
      const start = inlineField(txt, "start");
      const end = inlineField(txt, "end");
      const topic = inlineField(txt, "topic") || p.data.title || p.fileSlug;
      return { start, end, topic, url: p.url };
    })
    .sort((a, b) => new Date(b.start || 0) - new Date(a.start || 0));
});

// Stream: from daily notes or stream.md lines "- HH:MM message"
const streamLineRe = /^\s*-\s*(\d{1,2}:\d{2})\s+(.+)$/gm;
eleventyConfig.addCollection("streamItems", (c) => {
  const out = [];
  const candidates = c.getAll().filter(p => {
    const path = p?.inputPath || "";
    return typeof path === "string" && ( /\/notes\/daily\//i.test(path) || /\/stream\.md$/i.test(path) );
  });
  for (const p of candidates) {
    const txt = getText(p);
    if (!txt) continue;
    const dateField = inlineField(txt, "date");
    const fromSlug = (p.fileSlug || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || null;
    const fromPath = (p.inputPath || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || null;
    const day = dateField || fromSlug || fromPath || null;
    const re = new RegExp(streamLineRe.source, streamLineRe.flags);
    let m;
    while ((m = re.exec(txt))) {
      const [, time, message] = m;
      out.push({ date: day ? `${day} ${time}` : time, text: message.trim(), url: p.url });
    }
  }
  return out.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
});

  // Digital Garden-style wikilinks filter (simple)
  eleventyConfig.addFilter("link", (html, pages = []) => {
    if (!html) return html;

    const map = new Map();
    for (const p of pages) {
      if (!p?.url) continue;
      if (p.fileSlug) map.set(p.fileSlug.toLowerCase(), p.url);
      if (p.data?.title) map.set(slugify(p.data.title), p.url);
    }
    const re = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g;
    return html.replace(re, (_m, target, alias) => {
      const key = slugify(String(target || ""));
      const href = map.get(key) || `/notes/${key}/`;
      const text = alias || target;
      return `<a class="internal-link" href="${href}">${text}</a>`;
    });
  });

  eleventyConfig.addFilter("embedMedia", (html) => {
    if (!html) return html;
    return html.replace(/!\[\[([^\]|#]+)(?:#[^\]]+)?\]\]/g, (_m, file) => {
      const fname = String(file).trim();
      const safe = encodeURI(fname);
      // Adjust the base to where you store images
      const src = `/assets/img/${safe}`;
      return `<img src="${src}" alt="${fname}">`;
    });
  });

 // Collections used by the graph generator
  const isMd = (p) => String(p.inputPath || "").toLowerCase().endsWith(".md");
  const isPublished = (p) =>
    p?.data?.["dg-publish"] === true &&
    !p?.data?.draft &&
    p?.data?.visibility !== "private";

  eleventyConfig.addCollection("note", (api) =>
    api.getFilteredByGlob("src/site/notes/**/*.md").filter((p) => isMd(p) && isPublished(p))
  );
  eleventyConfig.addCollection("notes", (api) =>
    api.getFilteredByGlob("src/site/notes/**/*.md").filter((p) => isMd(p) && isPublished(p))
  );

  // Optional: Markdown config
  eleventyConfig.setLibrary("md", markdownIt({ html: true, linkify: true }));

  eleventyConfig.addCollection("postFeaturedFirst", (api) => {
    const byBlogFolder = api.getFilteredByGlob("src/site/notes/blog/**/*.md");
    const byPublishedFolder = api.getFilteredByGlob("src/site/notes/published/**/*.md");
    const byTag = api.getFilteredByTag("post");

    // De-dupe by inputPath
    const map = new Map();
    [...byBlogFolder, ...byPublishedFolder, ...byTag].forEach(p => map.set(p.inputPath, p));

    return [...map.values()]
      .filter(isPublished)
      .sort((a, b) => {
        const fa = !!a.data?.featured, fb = !!b.data?.featured;
        if (fa !== fb) return fb - fa;               // featured first
        return (b.date || 0) - (a.date || 0);        // newest next
      });
  });

  eleventyConfig.on('afterBuild', async () => {
  // Get the list of all HTML files generated
  const files = await fg('dist/**/*.html');

  // Iterate over each file and minify
  for (const file of files) {
    // Skip if already minified
    if (file.endsWith('.min.html')) continue;

    // Read the file
    const content = await fs.promises.readFile(file, 'utf8');

    // Minify the content
    const minified = await htmlMinifier.minify(content, {
      useShortDoctype: true,
      removeComments: true,
      collapseWhitespace: true,
      conservativeCollapse: true,
      preserveLineBreaks: true,
      minifyCSS: true,
      minifyJS: true,
      keepClosingSlash: true,
    });

    // Write the minified content to a new file
    await fs.promises.writeFile(file.replace('.html', '.min.html'), minified);
  }
});

  eleventyConfig.addCollection("featuredZettels", (api) => {
    return api.getFilteredByGlob("src/site/notes/**/*.md")
      .filter(p => isPublished(p) && (p.data?.featured || (p.data?.tags || []).includes("gardenEntry")))
      .sort((a, b) => {
        const bu = b.data?.updated ? new Date(b.data.updated) : b.date;
        const au = a.data?.updated ? new Date(a.data.updated) : a.date;
        return bu - au;
      });
  });

  eleventyConfig.addCollection("zettels", (api) => {
    return api.getFilteredByGlob("src/site/notes/**/*.md")
      .filter(p =>
        isPublished(p) &&
        !(p.inputPath || "").includes("/notes/blog/") &&
        !(p.inputPath || "").includes("/notes/published/") &&
        !p.data?.featured
      )
      .sort((a, b) => {
        const bu = b.data?.updated ? new Date(b.data.updated) : b.date;
        const au = a.data?.updated ? new Date(a.data.updated) : a.date;
        return bu - au;
      });
  });

  // Ensure these collections are not also added in src/helpers/userSetup.js
  // If they are, remove one set.

  // Add a limit filter for arrays
  eleventyConfig.addFilter("limit", (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []));

  return {
    dir: { input: "src/site", includes: "_includes", layouts: "_includes/layouts", data: "_data", output: "dist" },
    templateFormats: ["njk","md","11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}; // <— nothing below this line

