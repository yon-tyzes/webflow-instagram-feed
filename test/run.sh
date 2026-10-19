#!/usr/bin/env bash
# End-to-end test against a local mock of the Instagram API.
# Runs on a temporary copy of the repo, so your real public/ folder is untouched.
# Usage: bash test/run.sh
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
cp -r "$REPO" "$WORK/repo"
cd "$WORK/repo"
export IG_API_BASE=http://127.0.0.1:8787

node test/mock-server.mjs >/dev/null 2>&1 &
MOCK=$!
trap 'kill $MOCK 2>/dev/null || true; rm -rf "$WORK"' EXIT
sleep 0.5

pass() { echo "PASS  $1"; }
fail() { echo "FAIL  $1"; exit 1; }

# 1. No token: sample feed stays.
node scripts/fetch-feed.mjs >/dev/null
[ "$(node -p "require('./public/feed.json').sample")" = "true" ] && pass "no token keeps sample feed" || fail "no token"

# 2. Live run with featured posts, one of them on page 2 and one missing.
cat > feed.config.json <<'J'
{ "featured": ["https://www.instagram.com/p/CODE27/?igsh=abc", "CODE05", "https://www.instagram.com/p/missing123/"],
  "maxFeatured": 3, "latestCount": 3, "keepGridFull": true }
J
IG_ACCESS_TOKEN=good-token node scripts/fetch-feed.mjs >/dev/null
ORDER="$(node -p "require('./public/feed.json').posts.map(p=>p.shortcode).join(',')")"
[ "$ORDER" = "CODE27,CODE05,CODE00,CODE01,CODE03,CODE04" ] && pass "featured first, grid filled to 6, Reel without image skipped" || fail "order was $ORDER"
[ "$(ls public/images | grep -c '\.jpg$')" = "6" ] && pass "6 images downloaded" || fail "image count"
ls public/images | grep -q sample && fail "sample images not cleaned" || pass "sample images removed"
[ "$(node -p "require('./public/feed.json').posts[3].type")" = "video" ] && pass "Reel uses its thumbnail" || fail "video type"

# 3. Second run with no Instagram changes writes nothing.
BEFORE="$(sha1sum public/feed.json)"
IG_ACCESS_TOKEN=good-token node scripts/fetch-feed.mjs | grep -q "No changes" && [ "$BEFORE" = "$(sha1sum public/feed.json)" ] \
  && pass "unchanged run leaves feed.json alone" || fail "unchanged run"

# 4. Bad token fails loudly so GitHub emails you.
if IG_ACCESS_TOKEN=bad node scripts/fetch-feed.mjs >/dev/null; then fail "bad token should exit 1"; else pass "bad token exits with an error"; fi

# 5. Token refresh writes the new token to a file.
IG_ACCESS_TOKEN=good-token NEW_TOKEN_FILE="$WORK/tok" node scripts/refresh-token.mjs >/dev/null
[ "$(cat "$WORK/tok")" = "new-token" ] && pass "token refresh" || fail "token refresh"

# 6. API versions without alt_text: retries and falls back to the caption.
kill $MOCK; sleep 0.3
MOCK_NO_ALT=1 node test/mock-server.mjs >/dev/null 2>&1 &
MOCK=$!; sleep 0.5
rm -f public/feed.json
IG_ACCESS_TOKEN=good-token node scripts/fetch-feed.mjs >/dev/null
[ "$(node -p "require('./public/feed.json').posts[2].alt")" = "Post number 0." ] && pass "alt text falls back to caption" || fail "alt fallback"

echo "All tests passed."
