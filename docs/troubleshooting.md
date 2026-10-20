# Troubleshooting

GitHub emails you when the workflow fails. Open the **Actions** tab, click the failed run, and look for the red error line.

## Workflow errors and warnings

| Message | Fix |
| --- | --- |
| The Instagram token is missing, invalid, or expired | [Generate a new token](setup-instagram.md#generate-the-token) and replace the `IG_ACCESS_TOKEN` secret. |
| Instagram issued a new token but GH_PAT is not set | [Add `GH_PAT`](setup-github.md#automatic-token-renewal). Without it the feed stops about 60 days after your last manual token. |
| `gh: HTTP 403` or `Resource not accessible` when saving the token | `GH_PAT` expired or lacks **Secrets: Read and write** on this repository. Make a new one. |
| Featured post "…" was not found | Check the link in `feed.config.json`. The post may be deleted, archived, or older than about 200 posts. |
| Post … has no image Instagram can share | Usually a Reel with copyrighted music. Nothing to fix; the next post takes its place. |
| Could not download the image for post … | Usually temporary. The next run tries again. |
| Pages step fails with a permissions error | **Settings > Actions > General > Workflow permissions > Read and write permissions**. Also check **Settings > Pages > Source** is **GitHub Actions**. |
| `Skipped: ... 24 hours` during token refresh | The token is less than a day old. Harmless; it renews next Monday. |

## The feed on your site

| You see | Check |
| --- | --- |
| The whole section is gone | The feed didn't load. Open your `data-ig-feed` address in a browser; it should show text starting with `{"version"`. Check for typos and that the address starts with `https://`. |
| Placeholder images, never replaced | The script isn't loading. Check the footer snippet's address opens a JavaScript file. On Webflow, custom code only runs on the published or staged site, not in the Designer. |
| Cards stay blank | Each card needs an image inside it. If a card has several images, mark the one to fill with `data-ig-image`. |
| Photos stretched or not filling the box | Set the image to width 100%, height 100%, fit cover, and give its wrapper an aspect ratio. See [Size the images](setup-website.md#3-size-the-images). |
| Sample posts still showing after adding the token | Run the workflow by hand. Browsers and GitHub Pages cache feed.json for up to 10 minutes. |
| Hover effects stopped working | Build every card in the Designer rather than one card. See [How the script finds things](setup-website.md#how-the-script-finds-things). |
| Play button is not centered on the photo | The button centers in the image's parent element. Wrap the image in its own Div (the image wrapper), so the wrapper is the same size as the photo. |
| Play button shows but you want your own icon | Add your icon to the card with `data-ig-video`, or turn the button off with `data-ig-play="none"` on the `data-ig-feed` element. |
| The wrong elements are filled | The grid has elements besides cards. Add `data-ig-card` to each card. |

The browser console shows messages that start with `[ig-feed]` when something goes wrong.

## Schedule stopped

GitHub pauses scheduled workflows in repositories with no activity for 60 days. The weekly token renewal commits a small file to prevent this, but if the schedule does pause, go to **Actions > Update feed** and click **Enable workflow**.

## Still stuck?

[Open an issue](../../../issues/new/choose) with the error line and what you've tried. Never include your token.
