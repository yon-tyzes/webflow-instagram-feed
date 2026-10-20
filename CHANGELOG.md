# Changelog

All notable changes to this project are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Changes that rename or remove fields in `feed.json` or `feed.config.json`, or attributes used by `ig-feed.js`, are breaking changes and bump the major version.

## [Unreleased]

## [1.1.0] - 2026-10-19

### Added

- Built-in play button on video and Reel cards that have no `data-ig-video` element. It sits centered over the image, lets clicks through to the card link, and is hidden from screen readers.
- CSS variables `--ig-play-size`, `--ig-play-bg`, and `--ig-play-color` to restyle the play button, and `data-ig-play="none"` on the `data-ig-feed` element to turn it off.
- `clean` caption mode: the caption without links, hashtags, or the trailing block of hashtags and mentions, cut at a word boundary. Emoji and @mentions inside sentences stay.
- `data-ig-caption-length` to set where `clean` and `short` captions are cut (default 140).
- Caption mode and length can be set on the caption element itself, which takes priority over the `data-ig-feed` element.
- Webflow walkthrough for adding captions and the handle to cards, and new troubleshooting entries for the play button.

### Changed

- When a card shows the caption and the image's alt text is the caption's first sentence, the image gets empty alt text so screen readers don't read the same text twice. Alt text written on Instagram is kept.
- The hidden link text on video cards now says "video, opens Instagram in a new tab".
- The preview page uses the built-in play button, a handle line, and clean captions. The sample feed has realistic captions with hashtags, links, and mentions.

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

[Unreleased]: https://github.com/yon-tyzes/webflow-instagram-feed/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/yon-tyzes/webflow-instagram-feed/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yon-tyzes/webflow-instagram-feed/releases/tag/v1.0.0
