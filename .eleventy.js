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

  // Syntax Highlighting for Code blocks
  eleventyConfig.addPlugin(syntaxHighlight);

  // Markdown rendering options
  const md = new markdownIt({
    html: true,
  });

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
