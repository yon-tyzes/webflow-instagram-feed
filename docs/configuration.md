# Configuration

## feed.config.json

The one file you edit. Saving it on GitHub rebuilds the feed within a couple of minutes.

```json
{
  "featured": [
    "https://www.instagram.com/p/ABC123xyz/",
    "https://www.instagram.com/reel/DEF456uvw/"
  ],
  "maxFeatured": 3,
  "latestCount": 3,
  "keepGridFull": true
}
```

| Setting | What it does | Default |
| --- | --- | --- |
| `featured` | Posts to show first, in this order. | `[]` |
| `maxFeatured` | How many featured posts to use, at most (0 to 12). | `3` |
| `latestCount` | How many recent posts to show after the featured ones (0 to 24). | `3` |
| `keepGridFull` | When you feature fewer than `maxFeatured` posts, fill the empty spots with more recent posts. | `true` |

With the defaults the feed always has 6 posts: up to 3 featured, then recent posts.

### Featured post links

In Instagram, open the post and use **Share > Copy link**. All of these work:

- `https://www.instagram.com/p/ABC123xyz/`
- `https://www.instagram.com/reel/ABC123xyz/?igsh=...` (extra parts are ignored)
- `ABC123xyz` (the code from the link)

The workflow searches your last 200 or so posts. If a featured post isn't found (deleted, archived, older than that, or mistyped), the run shows a warning and the rest of the feed still updates.

A featured post is never repeated in the recent posts.

### Why not read pinned posts from Instagram?

Instagram's API returns posts newest first and doesn't say which ones are pinned. Listing featured posts here is the reliable alternative, and it lets you feature a post on your site without pinning it.

## Changing the schedule

The schedule is in [`.github/workflows/update-feed.yml`](../.github/workflows/update-feed.yml):

```yaml
schedule:
  - cron: "23 */6 * * *"   # check for new posts every 6 hours
  - cron: "41 7 * * 1"     # Mondays: also refresh the token
```

Times are in UTC. For hourly checks, change the first line to `"23 * * * *"`. If you change the second line, change the matching `github.event.schedule == '41 7 * * 1'` line in the same file, or the token stops renewing.

GitHub may start scheduled runs a few minutes late at busy times.

## feed.json format

For anyone building their own front end. The file is published at `https://YOUR-USER.github.io/YOUR-REPO/feed.json`.

```json
{
  "version": 1,
  "sample": false,
  "username": "your_handle",
  "profile_url": "https://www.instagram.com/your_handle/",
  "updated_at": "2026-10-19T14:23:05.000Z",
  "posts": [
    {
      "id": "17900000000000030",
      "shortcode": "ABC123xyz",
      "type": "image",
      "featured": true,
      "image": "images/17900000000000030.jpg",
      "alt": "Volunteers stacking grocery bags on a folding table",
      "caption": "Full caption text",
      "caption_short": "Caption cut at about 140 characters…",
      "permalink": "https://www.instagram.com/p/ABC123xyz/",
      "timestamp": "2026-10-17T15:00:00+0000"
    }
  ]
}
```

| Field | Notes |
| --- | --- |
| `sample` | `true` until a token is added. |
| `updated_at` | When the post list last changed, not when the workflow last ran. |
| `posts` | Featured posts first, in `feed.config.json` order, then newest first. |
| `type` | `image`, `video` (Reels included), or `carousel`. |
| `image` | Relative to feed.json. Videos use their cover image; carousels use the first photo. |
| `alt` | From Instagram's alt text, else the caption's first sentence, else "Instagram post from @handle". |

GitHub Pages allows requests from any website, so you can read feed.json from your own code.
