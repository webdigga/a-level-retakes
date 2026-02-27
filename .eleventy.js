const yaml = require("js-yaml");
const { DateTime } = require("luxon");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const htmlmin = require("html-minifier");
const markdownIt = require("markdown-it");

require('dotenv').config();

module.exports = function (eleventyConfig) {
  // Disable automatic use of your .gitignore
  eleventyConfig.setUseGitIgnore(false);

  // Merge data instead of overriding
  eleventyConfig.setDataDeepMerge(true);

  // human readable date
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLL yyyy"
    );
  });

  // Reading time filter
  eleventyConfig.addFilter("readingTime", (content) => {
    if (!content) return "1 min read";
    const text = content.replace(/<[^>]+>/g, '').replace(/[#*\[\]()_|`>-]/g, '');
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 230));
    return `${minutes} min read`;
  });

  // Syntax Highlighting for Code blocks
  eleventyConfig.addPlugin(syntaxHighlight);

  // Markdown rendering options
  const md = new markdownIt({
    html: true,
  });

  // External links: open in new tab with icon
  let isExternalLink = false;
  const defaultLinkOpen = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    const hrefIndex = tokens[idx].attrIndex('href');
    isExternalLink = false;
    if (hrefIndex >= 0) {
      const href = tokens[idx].attrs[hrefIndex][1];
      if (href.startsWith('http://') || href.startsWith('https://')) {
        tokens[idx].attrPush(['target', '_blank']);
        tokens[idx].attrPush(['rel', 'noopener noreferrer']);
        isExternalLink = true;
      }
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  const defaultLinkClose = md.renderer.rules.link_close || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.link_close = function(tokens, idx, options, env, self) {
    if (isExternalLink) {
      isExternalLink = false;
      return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-left:3px" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>';
    }
    return defaultLinkClose(tokens, idx, options, env, self);
  };

  eleventyConfig.setLibrary("md", md);

  // Add the new markdown filter (use when components render markdown)
  eleventyConfig.addFilter("markdown", (content) => {
    return md.render(content);
  });

  // To Support .yaml Extension in _data
  // You may remove this if you can use JSON
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));

  // Copy Static Files to /_Site
  eleventyConfig.addPassthroughCopy({
    "./src/admin/config.yml": "./admin/config.yml",
    "./node_modules/alpinejs/dist/cdn.min.js": "./static/js/alpine.js",
    "./node_modules/prismjs/themes/prism-tomorrow.css": "./static/css/prism-tomorrow.css",
  });

  // Copy Image Folder to /_site
  eleventyConfig.addPassthroughCopy("./src/static/img");

  // Copy favicon to route of /_site
  eleventyConfig.addPassthroughCopy("./src/favicon.ico");
  eleventyConfig.addPassthroughCopy("./src/apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("./src/favicon-16x16.png");
  eleventyConfig.addPassthroughCopy("./src/favicon-32x32.png");
  eleventyConfig.addPassthroughCopy("./src/android-chrome-192x192.png");
  eleventyConfig.addPassthroughCopy("./src/android-chrome-512x512.png");

  // Copy robots.txt to route of /_site
  eleventyConfig.addPassthroughCopy("./src/robots.txt");

  // Copy _redirects for Netlify
  eleventyConfig.addPassthroughCopy("./src/_redirects");

  // Minify HTML
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    // Eleventy 1.0+: use this.inputPath and this.outputPath instead
    if (outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return minified;
    }

    return content;
  });

  eleventyConfig.addCollection("productPosts", function(collectionApi) {
    return collectionApi.getFilteredByTags("article");
  });

  eleventyConfig.addCollection("resourcePosts", function(collectionApi) {
    return collectionApi.getFilteredByTags("resource");
  });

  // Computed permalinks based on tags
  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: (data) => {
      // Skip if permalink is already set or if it's not a post
      if (data.permalink || !data.page || !data.page.inputPath) {
        return data.permalink;
      }

      // Only apply to posts folder
      if (!data.page.inputPath.includes('/posts/')) {
        return data.permalink;
      }

      const slug = data.page.fileSlug;

      // Resource posts go to /resources/slug/
      if (data.tags && data.tags.includes('resource')) {
        return `/resources/${slug}/`;
      }

      // Article posts go to /slug/ (root level)
      if (data.tags && data.tags.includes('article')) {
        return `/${slug}/`;
      }

      return data.permalink;
    }
  });

  // Let Eleventy transform HTML files as nunjucks
  // So that we can use .html instead of .njk
  return {
    dir: {
      input: "src",
    },
    htmlTemplateEngine: "njk",
  };
};
