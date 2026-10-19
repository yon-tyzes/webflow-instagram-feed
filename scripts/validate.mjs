#!/usr/bin/env node
// Checks feed.config.json and public/feed.json for mistakes. Run with: npm run check

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

async function readJson(rel) {
  try {
    return JSON.parse(await readFile(path.join(ROOT, rel), "utf8"));
  } catch (err) {
    errors.push(`${rel}: ${err.code === "ENOENT" ? "file not found" : `not valid JSON (${err.message})`}`);
    return null;
  }
}

const config = await readJson("feed.config.json");
if (config) {
  const known = ["featured", "maxFeatured", "latestCount", "keepGridFull"];
  for (const key of Object.keys(config)) {
    if (!known.includes(key)) errors.push(`feed.config.json: unknown setting "${key}". Known settings: ${known.join(", ")}`);
  }
  if (config.featured !== undefined) {
    if (!Array.isArray(config.featured)) {
      errors.push('feed.config.json: "featured" must be a list, like ["https://www.instagram.com/p/ABC123/"]');
    } else {
      config.featured.forEach((entry, i) => {
        const ok =
          typeof entry === "string" &&
          (/instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+/i.test(entry) ||
            /^[A-Za-z0-9_-]{5,}$/.test(entry.trim()));
        if (!ok) errors.push(`feed.config.json: featured[${i}] "${entry}" is not a post link or shortcode`);
      });
    }
  }
  for (const [key, max] of [["maxFeatured", 12], ["latestCount", 24]]) {
    const v = config[key];
    if (v !== undefined && (!Number.isInteger(v) || v < 0 || v > max)) {
      errors.push(`feed.config.json: "${key}" must be a whole number from 0 to ${max}`);
    }
  }
  if (config.keepGridFull !== undefined && typeof config.keepGridFull !== "boolean") {
    errors.push('feed.config.json: "keepGridFull" must be true or false');
  }
}

const feed = await readJson("public/feed.json");
if (feed) {
  if (!Array.isArray(feed.posts)) errors.push("public/feed.json: missing posts list");
  else {
    for (const [i, p] of feed.posts.entries()) {
      for (const field of ["id", "image", "alt", "permalink", "timestamp"]) {
        if (!p[field]) errors.push(`public/feed.json: posts[${i}] is missing "${field}"`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
console.log("feed.config.json and public/feed.json look good.");
