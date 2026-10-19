# Contributing

Thanks for helping improve this project. Contributions of every size are welcome, from a typo fix to a guide for another site builder.

## Before you start

- **Never include a token**, real account data, or someone else's posts in issues, examples, or tests. The tests use a mock API in `test/` with made-up posts.
- For anything larger than a small fix, open an issue first so we can agree on the approach.
- The project has no runtime dependencies on purpose. Please keep it that way, so anyone can read every line that runs with their token.

## Ways to help

- Report a problem: what you expected, what happened, and the error line from the workflow log.
- Add a setup guide for another site builder.
- Improve accessibility of the browser script.
- Make the setup steps clearer, especially where Meta's dashboard has changed.

## Development setup

You need Node.js 20 or later and Bash. No packages to install.

```sh
npm run check     # syntax and configuration
npm test          # end-to-end test against a mock Instagram API
npm run preview   # preview page at http://localhost:8000
```

## Making a change

1. Fork the repository and create a branch from `main`.
2. Make your change. Keep each pull request to one purpose.
3. Run `npm run check` and `npm test`.
4. Update `CHANGELOG.md` under **Unreleased**.
5. Open a pull request and fill in the template.

### Changing the browser script

`public/ig-feed.js` runs on other people's live websites. In the pull request, describe the markup you tested with and the browsers you checked. Keep it free of build steps and dependencies, and keep inserting post content as text, never as HTML.

### Changing feed.json or feed.config.json

Sites read `feed.json` directly, and people have edited `feed.config.json`. Renaming or removing a field breaks them. Add fields instead, update `scripts/validate.mjs`, the tests, and `docs/configuration.md` together, and note breaking changes under **Changed** in the changelog.

## Style

- JavaScript: plain modern JavaScript in `scripts/`; the browser script stays compatible with older browsers (no build step).
- Markdown: one idea per sentence, plain words, short paragraphs.
- JSON: two-space indent.

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By taking part, you agree to follow it.
