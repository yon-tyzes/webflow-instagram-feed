// Shared helpers for the feed scripts. No dependencies: Node 20+ only.

export const API_BASE = (process.env.IG_API_BASE || "https://graph.instagram.com").replace(/\/$/, "");
export const API_VERSION = process.env.IG_API_VERSION || ""; // e.g. "v23.0"; blank uses Meta's default

export function apiUrl(path, params = {}) {
  const prefix = API_VERSION ? `/${API_VERSION}` : "";
  const url = new URL(`${API_BASE}${prefix}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

export class ApiError extends Error {
  constructor(message, { status, code, subcode } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.subcode = subcode;
  }
}

// GET a Graph API URL and return parsed JSON, throwing ApiError on Meta error payloads.
export async function getJson(url) {
  let res;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (err) {
    throw new ApiError(`Network error calling Instagram: ${err.message}`);
  }
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new ApiError(`Instagram returned non-JSON (HTTP ${res.status})`, { status: res.status });
  }
  if (!res.ok || body.error) {
    const e = body.error || {};
    throw new ApiError(e.message || `HTTP ${res.status}`, {
      status: res.status,
      code: e.code,
      subcode: e.error_subcode,
    });
  }
  return body;
}

// Meta error code 190 = invalid or expired token.
export function isAuthError(err) {
  return err instanceof ApiError && (err.code === 190 || err.status === 401);
}

export function authHelp() {
  return [
    "The Instagram token is missing, invalid, or expired.",
    "Fix: generate a new token in the Meta App Dashboard",
    "(Instagram > API setup with Instagram login > Generate token),",
    "then paste it into the repo secret IG_ACCESS_TOKEN.",
  ].join(" ");
}

// Strip the token from any string before it can reach a log.
export function redact(str, token) {
  if (!token || typeof str !== "string") return str;
  return str.split(token).join("[token]");
}
