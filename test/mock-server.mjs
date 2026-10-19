// Local stand-in for graph.instagram.com, used by test/run.sh.
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const BASE = `http://127.0.0.1:${PORT}`;
const NO_ALT = process.env.MOCK_NO_ALT === "1";

// 30 posts, newest first. Post 27 is old and sits on page 2.
const posts = Array.from({ length: 30 }, (_, i) => {
  const id = `179000000000000${String(30 - i).padStart(2, "0")}`; // IDs are strings; real ones exceed JS number precision
  const code = `CODE${String(i).padStart(2, "0")}`;
  const p = {
    id,
    caption: `Post number ${i}. We packed 140 bags today with @friend_org #community https://example.org`,
    media_type: "IMAGE",
    media_url: `${BASE}/img/${i % 7}.jpg`,
    permalink: `https://www.instagram.com/p/${code}/`,
    timestamp: new Date(Date.UTC(2026, 9, 18) - i * 86400000).toISOString().replace(".000Z", "+0000"),
  };
  if (i === 1) { p.media_type = "VIDEO"; p.media_url = `${BASE}/video.mp4`; p.thumbnail_url = `${BASE}/img/1.jpg`; p.permalink = `https://www.instagram.com/reel/${code}/`; }
  if (i === 2) { p.media_type = "VIDEO"; delete p.media_url; } // copyrighted-audio Reel: no media_url, no thumbnail
  if (i === 3) { p.media_type = "CAROUSEL_ALBUM"; }
  if (i === 4) { p.caption = ""; }
  if (!NO_ALT && i === 0) p.alt_text = "Volunteers stacking grocery bags on a folding table";
  return p;
});

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "Content-Type": type });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, BASE);
    const token = url.searchParams.get("access_token");
    if (url.pathname.startsWith("/img/")) {
      const f = path.join(DIR, "fixtures", path.basename(url.pathname));
      try { return send(res, 200, await readFile(f), "image/jpeg"); } catch { return send(res, 404, "no"); }
    }
    if (token !== "good-token" && token !== "new-token") {
      return send(res, 400, { error: { message: "Error validating access token", type: "OAuthException", code: 190 } });
    }
    if (url.pathname === "/me") return send(res, 200, { id: "1", username: "test_org" });
    if (url.pathname === "/refresh_access_token") return send(res, 200, { access_token: "new-token", token_type: "bearer", expires_in: 5184000 });
    if (url.pathname === "/me/media") {
      const fields = url.searchParams.get("fields") || "";
      if (NO_ALT && fields.includes("alt_text")) {
        return send(res, 400, { error: { message: "(#100) Tried accessing nonexisting field (alt_text)", code: 100 } });
      }
      const limit = Number(url.searchParams.get("limit") || 25);
      const after = Number(url.searchParams.get("after") || 0);
      const data = posts.slice(after, after + limit);
      const body = { data };
      if (after + limit < posts.length) {
        const n = new URL(url);
        n.searchParams.set("after", String(after + limit));
        body.paging = { next: n.toString() };
      }
      return send(res, 200, body);
    }
    send(res, 404, { error: { message: "unknown path", code: 803 } });
  })
  .listen(PORT, "127.0.0.1", () => console.log(`mock on ${BASE}`));
