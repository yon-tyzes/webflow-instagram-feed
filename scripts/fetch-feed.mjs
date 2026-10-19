#!/usr/bin/env node
// Builds public/feed.json from the Instagram account's posts.
// Featured posts (set in feed.config.json) come first, then the latest posts.
// Images are downloaded into public/images so the site never depends on
// Instagram's expiring image links.

import { readFile, writeFile, mkdir, readdir, unlink, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiUrl, getJson, ApiError, isAuthError, authHelp, redact } from "./lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, process.env.FEED_OUT_DIR || "public");
const IMG_DIR = path.join(OUT_DIR, "images");
const FEED_FILE = path.join(OUT_DIR, "feed.json");
const CONFIG_FILE = path.join(ROOT, "feed.config.json");

const TOKEN = (process.env.IG_ACCESS_TOKEN || "").trim();
const PAGE_SIZE = 25;
const MAX_PAGES = 8; // how far back to look for featured posts (about 200 posts)

const FIELDS_FULL = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,alt_text";
const FIELDS_BASIC = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

const log = (...a) => console.log(...a.map((x) => redact(String(x), TOKEN)));
const warn = (msg) => console.log(`::warning::${redact(msg, TOKEN)}`);

async function main() {
  if (!TOKEN) {
    log("No IG_ACCESS_TOKEN set. Keeping the current feed.json (sample data until a token is added).");
    return;
  }

  const config = await loadConfig();
  const featuredWanted = config.featured.map(parseFeaturedRef).filter(Boolean);

  const me = await getJson(apiUrl("/me", { fields: "username", access_token: TOKEN }));
  const username = me.username;
  log(`Account: @${username}`);

  // Pull enough posts to cover "latest" plus any featured posts further back.
  const needLatest = config.maxFeatured + config.latestCount;
  const media = [];
  let fields = FIELDS_FULL;
  let next = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    let body;
    try {
      body = next
        ? await getJson(next)
        : await getJson(apiUrl("/me/media", { fields, limit: String(PAGE_SIZE), access_token: TOKEN }));
    } catch (err) {
      // Older API versions reject alt_text. Retry once without it.
      if (page === 0 && fields === FIELDS_FULL && err instanceof ApiError && err.code === 100) {
        log("alt_text field not available on this API version; continuing without it.");
        fields = FIELDS_BASIC;
        page--;
        continue;
      }
      throw err;
    }
    media.push(...(body.data || []));
    next = body.paging && body.paging.next;
    const allFeaturedFound = featuredWanted.every((ref) => media.some((m) => matchesRef(m, ref)));
    if (!next || (media.length >= needLatest + featuredWanted.length && allFeaturedFound)) break;
  }
  log(`Fetched ${media.length} posts.`);

  // Featured, in config order.
  const featured = [];
  for (const ref of featuredWanted.slice(0, config.maxFeatured)) {
    const m = media.find((x) => matchesRef(x, ref));
    if (!m) {
      warn(`Featured post "${ref.raw}" was not found in the last ${media.length} posts. Check the link, or it may be deleted or archived.`);
      continue;
    }
    if (!featured.includes(m)) featured.push(m);
  }
  if (featuredWanted.length > config.maxFeatured) {
    warn(`feed.config.json lists ${featuredWanted.length} featured posts; only the first ${config.maxFeatured} are used.`);
  }

  const latestSlots = config.keepGridFull
    ? config.maxFeatured + config.latestCount - featured.length
    : config.latestCount;

  // Media API returns newest first; sort anyway so the order never depends on that.
  const rest = media
    .filter((m) => !featured.includes(m))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  await mkdir(IMG_DIR, { recursive: true });

  const posts = [];
  for (const m of featured) {
    const p = await toPost(m, true, username);
    if (p) posts.push(p);
  }
  let latestAdded = 0;
  for (const m of rest) {
    if (latestAdded >= latestSlots) break;
    const p = await toPost(m, false, username);
    if (p) {
      posts.push(p);
      latestAdded++;
    }
  }

  const feed = {
    version: 1,
    sample: false,
    username,
    profile_url: `https://www.instagram.com/${username}/`,
    updated_at: new Date().toISOString(),
    posts,
  };

  const previous = await readJson(FEED_FILE);
  if (previous && sameContent(previous, feed)) {
    log("No changes since the last run. feed.json left as is.");
  } else {
    await writeFile(FEED_FILE, JSON.stringify(feed, null, 2) + "\n");
    log(`Wrote feed.json with ${posts.length} posts (${featured.length} featured).`);
  }

  await cleanImages(new Set(posts.map((p) => path.basename(p.image))));
}

async function loadConfig() {
  const raw = (await readJson(CONFIG_FILE)) || {};
  const int = (v, d, max) => {
    const n = Number.isInteger(v) ? v : d;
    return Math.max(0, Math.min(n, max));
  };
  return {
    featured: Array.isArray(raw.featured) ? raw.featured.map(String).filter((s) => s.trim()) : [],
    maxFeatured: int(raw.maxFeatured, 3, 12),
    latestCount: int(raw.latestCount, 3, 24),
    keepGridFull: raw.keepGridFull !== false,
  };
}

// Accepts a post link (/p/, /reel/, /tv/), a bare shortcode, or a numeric media ID.
function parseFeaturedRef(input) {
  const raw = input.trim();
  if (!raw) return null;
  const m = raw.match(/instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (m) return { raw, shortcode: m[1] };
  if (/^\d{8,}$/.test(raw)) return { raw, id: raw };
  if (/^[A-Za-z0-9_-]{5,}$/.test(raw)) return { raw, shortcode: raw };
  warn(`Could not read featured entry "${raw}". Use the post's link, like https://www.instagram.com/p/ABC123/`);
  return null;
}

function shortcodeOf(permalink) {
  const m = (permalink || "").match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

function matchesRef(m, ref) {
  if (ref.id) return m.id === ref.id;
  return shortcodeOf(m.permalink) === ref.shortcode;
}

async function toPost(m, featured, username) {
  const isVideo = m.media_type === "VIDEO";
  const src = isVideo ? m.thumbnail_url || m.media_url : m.media_url;
  if (!src) {
    warn(`Post ${m.permalink || m.id} has no image Instagram can share (often a Reel with copyrighted audio). Skipping it.`);
    return null;
  }
  const file = await downloadImage(m.id, src);
  if (!file) return null;

  const caption = (m.caption || "").trim();
  return {
    id: m.id,
    shortcode: shortcodeOf(m.permalink),
    type: isVideo ? "video" : m.media_type === "CAROUSEL_ALBUM" ? "carousel" : "image",
    featured,
    image: `images/${file}`,
    alt: (m.alt_text || "").trim() || altFromCaption(caption) || `Instagram post from @${username}`,
    caption,
    caption_short: shorten(caption, 140),
    permalink: m.permalink,
    timestamp: m.timestamp,
  };
}

async function downloadImage(id, src) {
  const safeId = String(id).replace(/[^0-9A-Za-z_-]/g, "");
  // Reuse an image already on disk for this post, so unchanged runs make no commits.
  for (const ext of ["jpg", "png", "webp"]) {
    const existing = path.join(IMG_DIR, `${safeId}.${ext}`);
    if (await exists(existing)) return `${safeId}.${ext}`;
  }
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = (res.headers.get("content-type") || "").toLowerCase();
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    if (type && !type.startsWith("image/")) throw new Error(`unexpected content type ${type}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 15 * 1024 * 1024) throw new Error("image larger than 15 MB");
    const name = `${safeId}.${ext}`;
    await writeFile(path.join(IMG_DIR, name), buf);
    return name;
  } catch (err) {
    warn(`Could not download the image for post ${id}: ${err.message}. Skipping it.`);
    return null;
  }
}

// Remove images no longer in the feed (old posts, sample images).
async function cleanImages(keep) {
  let files = [];
  try {
    files = await readdir(IMG_DIR);
  } catch {
    return;
  }
  for (const f of files) {
    if (f === ".gitkeep" || keep.has(f)) continue;
    await unlink(path.join(IMG_DIR, f));
    log(`Removed old image ${f}`);
  }
}

// First sentence of the caption, without hashtags, mentions, or links, capped at 125 characters.
function altFromCaption(caption) {
  const clean = caption
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[#@][\p{L}\p{N}_.]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "";
  const first = clean.split(/(?<=[.!?])\s/)[0];
  return shorten(first, 125);
}

function shorten(text, max) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "") + "…";
}

function sameContent(a, b) {
  const strip = ({ updated_at, ...rest }) => rest;
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

main().catch((err) => {
  if (isAuthError(err)) {
    console.log(`::error::${authHelp()}`);
  } else {
    console.log(`::error::${redact(err.message, TOKEN)}`);
  }
  process.exit(1);
});
