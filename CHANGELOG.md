# Changelog

All notable changes to this project are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Changes that rename or remove fields in `feed.json` or `feed.config.json`, or attributes used by `ig-feed.js`, are breaking changes and bump the major version.

## [Unreleased]

## [1.0.0] - 2026-10-19

### Added

- Scheduled GitHub Action that reads posts through the Instagram API with Instagram Login, downloads the photos, and publishes `feed.json` to GitHub Pages.
- Featured posts listed in `feed.config.json`, shown first, with the latest posts filling the rest of the grid.
- Weekly token renewal that saves the renewed token back to the repository secret.
- Weekly heartbeat commit so GitHub doesn't pause the schedule on quiet accounts.
- Browser script `ig-feed.js` that fills cards built in Webflow or plain HTML, using one required attribute. Fills existing cards in place so Webflow interactions keep working, or copies a single card.
- Optional attributes for captions, dates, featured and Reel badges, the profile link, and the handle, plus `is-featured`, `is-video`, and `is-carousel` classes.
- Alt text from Instagram, with a fallback to the caption's first sentence, and hidden "opens Instagram in a new tab" text on card links.
- Section hides itself when the feed can't load.
- Sample feed so the site can be designed before a token exists. Scheduled runs stay idle until a token is added.
- Configuration and feed validation, an end-to-end test against a mock Instagram API, and continuous integration.
- Setup guides for GitHub, Instagram, and websites, plus configuration and troubleshooting references.

[Unreleased]: https://github.com/yon-tyzes/webflow-instagram-feed/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yon-tyzes/webflow-instagram-feed/releases/tag/v1.0.0
