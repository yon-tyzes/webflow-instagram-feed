#!/usr/bin/env node
// Extends the Instagram token by another 60 days.
// Writes the refreshed token to the file named in NEW_TOKEN_FILE so the
// workflow can save it back into the repo secret. Never prints the token.

import { writeFile } from "node:fs/promises";
import { apiUrl, getJson, isAuthError, authHelp, redact } from "./lib.mjs";

const TOKEN = (process.env.IG_ACCESS_TOKEN || "").trim();
const OUT = process.env.NEW_TOKEN_FILE;

async function main() {
  if (!TOKEN) {
    console.log("No IG_ACCESS_TOKEN set. Nothing to refresh.");
    return;
  }
  const body = await getJson(
    apiUrl("/refresh_access_token", { grant_type: "ig_refresh_token", access_token: TOKEN })
  );
  const fresh = body.access_token;
  if (!fresh) throw new Error("Instagram did not return a token.");

  // Hide the new value from GitHub logs before anything else can print it.
  console.log(`::add-mask::${fresh}`);

  const days = Math.round((body.expires_in || 0) / 86400);
  console.log(`Token refreshed. Valid for about ${days} more days.`);

  if (OUT) await writeFile(OUT, fresh, { mode: 0o600 });
  if (fresh === TOKEN) console.log("Instagram returned the same token string; the expiry was still extended.");
}

main().catch((err) => {
  const msg = redact(err.message, TOKEN);
  // Meta refuses to refresh a token less than 24 hours old. That is harmless.
  if (/24 hours|too new|not old enough/i.test(msg)) {
    console.log(`Skipped: ${msg}`);
    return;
  }
  console.log(`::error::${isAuthError(err) ? authHelp() : msg}`);
  process.exit(1);
});
