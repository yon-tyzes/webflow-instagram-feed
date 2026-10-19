# Security

## Reporting a problem

If you find a way this project could expose a token, run untrusted content as code on a website, or publish something it shouldn't, please report it privately through GitHub's **Report a vulnerability** option on the repository's Security tab. Do not open a public issue.

Include the steps to reproduce it, using a test account or the mock API in `test/`, and what you saw. We aim to respond within five business days.

**Never include a real token** in a report, issue, or pull request, even an expired one.

## How tokens are handled

- The Instagram token and the GitHub token are stored only as GitHub Actions repository secrets. No file in the repository holds them.
- The scripts redact the token from every message they print, and mask a renewed token before anything else can log it.
- A renewed token is written to a temporary file with owner-only permissions, saved to the secret, then deleted.
- The update workflow does not run on pull requests, so changes proposed from forks never run with your secrets.
- `.gitignore` excludes `.env` files and common token file names.

## How post content is handled

- Captions and alt text from Instagram are inserted into your page as plain text (`textContent`), never as HTML, so a caption can't inject markup or scripts.
- Post links point only to the permalinks Instagram's API returns.
- Images are downloaded only if the server reports an image type, and are capped at 15 MB.

## Using this project safely

- **Keep tokens out of files, issues, and chats.** If one leaks, follow [If a token leaks](docs/setup-instagram.md#if-a-token-leaks).
- **Request one permission.** The feed only needs `instagram_business_basic`. Remove any others from your Meta app.
- **Scope the GitHub token.** Give `GH_PAT` access to the feed repository only, with **Secrets: Read and write** and nothing else.
- **Limit who can write to the repository.** Anyone with write access can change a workflow and use its secrets. Add collaborators you trust.
- **Load the script from your own repository.** Point your site at your own GitHub Pages address, not someone else's copy, so only you control the code running on your site.

## Supported versions

Only the latest release receives fixes.
