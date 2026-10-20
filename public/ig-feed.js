/*!
 * ig-feed.js
 * Fills cards built in the Webflow Designer with posts from feed.json.
 *
 * Minimum setup: ONE custom attribute on the grid that holds your cards:
 *   data-ig-feed="https://YOUR-USER.github.io/YOUR-REPO/feed.json"
 *
 * By default, each direct child of that grid is a card, the first <img> in a
 * card gets the photo, and a card that is a Link Block gets the post link.
 *
 * Two ways to build cards:
 *   - Build every card (e.g. 6 Link Blocks). They are filled in place, so
 *     Webflow interactions on them keep working. Extra cards are hidden if
 *     there are fewer posts.
 *   - Build one card. It is copied once per post (up to data-ig-limit).
 *
 * Optional attributes (Element settings > Custom attributes, any value):
 *   data-ig-card          mark the cards, if the grid holds other elements too
 *   data-ig-image         the image to fill, if a card has more than one
 *   data-ig-link          the link to fill, if the card itself is not a Link Block
 *   data-ig-caption       text element: post caption (about 140 characters).
 *                         Value "short", "full", or "clean" sets the mode for
 *                         this element only.
 *   data-ig-caption-length  on a caption element: its length (clean and short)
 *   data-ig-date          text element: post date
 *   data-ig-featured      element shown only on featured posts
 *   data-ig-video         element shown only on Reels/videos (replaces the
 *                         built-in play button)
 *   data-ig-carousel      element shown only on multi-photo posts
 *   data-ig-section       on the whole section: hidden if the feed can't load
 *   data-ig-follow        any link on the page: gets the profile URL
 *   data-ig-handle        any text on the page: gets "@username"
 *
 * Options on the data-ig-feed element:
 *   data-ig-limit="6"           max cards (single-card mode only)
 *   data-ig-caption="full"      full caption instead of the short one
 *   data-ig-caption="clean"     caption without links and hashtags
 *   data-ig-caption-length="140"  caption length in clean and short modes
 *   data-ig-play="none"         no built-in play button on videos
 *
 * Each filled card also gets combo classes is-featured, is-video, is-carousel.
 *
 * Video cards without a data-ig-video element get a play button over the
 * image. Restyle it with CSS variables: --ig-play-size, --ig-play-bg,
 * --ig-play-color.
 */
(function () {
  "use strict";

  var HIDDEN_LABEL_STYLE =
    "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0";

  var CAPTION_MODES = { short: true, full: true, clean: true };
  var DEFAULT_CAPTION_LENGTH = 140;

  var SVG_NS = "http://www.w3.org/2000/svg";

  // Single-class selectors, inserted first in <head>, so a site's own CSS wins.
  // Each var() has a plain fallback line before it for older browsers.
  var PLAY_CSS =
    ".ig-feed-play{position:absolute;top:50%;left:50%;display:flex;align-items:center;justify-content:center;" +
    "width:56px;width:var(--ig-play-size,56px);height:56px;height:var(--ig-play-size,56px);" +
    "margin:0;padding:0;border-radius:50%;" +
    "background:rgba(0,0,0,0.55);background:var(--ig-play-bg,rgba(0,0,0,0.55));" +
    "color:#fff;color:var(--ig-play-color,#fff);" +
    "-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);pointer-events:none;" +
    "-webkit-transform:translate(-50%,-50%);transform:translate(-50%,-50%);transition:transform 0.2s ease}" +
    ".ig-feed-play-icon{display:block;width:44%;height:44%;margin-left:8%;fill:currentColor}" +
    ":where(a:hover,a:focus-visible,.is-video:hover) .ig-feed-play{transform:translate(-50%,-50%) scale(1.08)}" +
    "@media (prefers-reduced-motion:reduce){.ig-feed-play{transition:none}" +
    ":where(a:hover,a:focus-visible,.is-video:hover) .ig-feed-play{transform:translate(-50%,-50%)}}";

  // Caption cleanup patterns. No \p{...} or lookbehind, so older browsers can parse them.
  // A link ends before closing punctuation, so "(https://x.org)." keeps its period.
  var URL_RE = /(?:https?:\/\/|www\.)[^\s()<>]*[^\s()<>.,!?;:'"]/gi;
  var TAG_WORD_RE = /^(?:#\S+|@[A-Za-z0-9_.]+|[.\u2022\u00b7|_-]+)$/;
  // Hashtags and mentions at the very end, separated by spaces.
  var TRAILING_RUN_RE = /(?:(?:^|\s+)(?:#[^\s#@.,!?;:()\[\]{}"'\u2026]+|@[A-Za-z0-9_.]+))+\s*$/;
  // After one of these, a run of mentions is a tag list, not part of a sentence.
  var SENTENCE_END_RE = /[.!?\n\u2026\u2600-\u27bf\udc00-\udfff\ufe0f]/;
  var INLINE_TAG_RE = /#[^\s#@.,!?;:()\[\]{}"'\u2026]+/g;
  // Letters, digits, "_" and ".": what the feed builder strips after # and @ when it makes alt text.
  var ALT_TOKEN_RE = /[#@][^\s!-\-\/:-@\[-\^`{-~\u2000-\u206f\u2600-\u27bf\u3000-\u303f\ud800-\udfff]+/g;

  function $(root, sel) {
    return root.querySelector(sel);
  }
  function $$(root, sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }
  function show(el, on) {
    if (el) el.style.display = on ? "" : "none";
  }
  function trim(s) {
    return s.replace(/^\s+|\s+$/g, "");
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var opts = { month: "short", day: "numeric" };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
    return d.toLocaleDateString(undefined, opts);
  }

  function fail(container, reason) {
    if (window.console) console.warn("[ig-feed] " + reason);
    var section = container.closest("[data-ig-section]");
    show(section || container, false);
  }

  function findCards(container) {
    var marked = $$(container, "[data-ig-card]");
    if (marked.length) return marked;
    return Array.prototype.slice.call(container.children).filter(function (el) {
      return el.tagName !== "SCRIPT" && el.tagName !== "STYLE";
    });
  }

  function captionModeOf(el) {
    var v = trim((el && el.getAttribute("data-ig-caption")) || "").toLowerCase();
    return CAPTION_MODES.hasOwnProperty(v) ? v : null;
  }
  function captionLengthOf(el) {
    var n = el ? parseInt(el.getAttribute("data-ig-caption-length"), 10) : NaN;
    return n > 0 ? n : null;
  }

  // Same cut as the feed builder's caption_short: at a word boundary, with a
  // trailing ellipsis. anySpace (clean mode) cuts at the last space even when
  // it comes early, instead of mid-word.
  function shorten(text, max, anySpace) {
    var t = trim(text.replace(/\s+/g, " "));
    if (t.length <= max) return t;
    var cut = t.slice(0, max);
    if (/[\ud800-\udbff]$/.test(cut)) cut = cut.slice(0, -1); // don't split an emoji
    var lastSpace = cut.lastIndexOf(" ");
    var atSpace = anySpace ? lastSpace > 0 : lastSpace > max * 0.6;
    return (atSpace ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "") + "\u2026";
  }

  // Drops the hashtags and mentions at the end of a caption. Mentions right
  // after words ("Photo by @name") stay; after a sentence or an emoji they go.
  function stripTrailingTags(text) {
    var m = text.match(TRAILING_RUN_RE);
    if (!m) return text;
    var start = m.index;
    if (start === 0 || SENTENCE_END_RE.test(text.charAt(start - 1))) return text.slice(0, start);
    var firstTag = m[0].search(/(?:^|\s)#/);
    return firstTag === -1 ? text : text.slice(0, start + firstTag);
  }

  // A line of only hashtags, mentions, or dots, like the tag block under a caption.
  function isTagLine(line) {
    var words = trim(line).split(/\s+/);
    for (var i = 0; i < words.length; i++) {
      if (words[i] && !TAG_WORD_RE.test(words[i])) return false;
    }
    return true;
  }

  // Caption without links, hashtags, or the tag list at the end.
  function cleanCaption(caption, max) {
    var lines = (caption || "").replace(URL_RE, "").split(/\r?\n/);
    while (lines.length && isTagLine(lines[lines.length - 1])) lines.pop();
    var text = stripTrailingTags(lines.join("\n"))
      .replace(INLINE_TAG_RE, "")
      .replace(/\(\s*\)|\[\s*\]/g, "")
      .replace(/\s+/g, " ")
      .replace(/ ([.,!?;:])/g, "$1")
      // "Details: <link>" at the end loses its link; drop the lead-in too.
      .replace(/([.!?\u2026])[^.!?\u2026]*:\s*$/, "$1")
      .replace(/[\s:|\u2022\u00b7\u2013-]+$/, "");
    return shorten(trim(text), max, true);
  }

  // True when post.alt is the fallback the feed builder made from the caption.
  function altFromCaption(post) {
    var alt = trim((post.alt || "").replace(/\u2026$/, ""));
    if (!alt || !post.caption) return false;
    var plain = trim(post.caption.replace(/https?:\/\/\S+/g, "").replace(ALT_TOKEN_RE, "").replace(/\s+/g, " "));
    return plain.indexOf(alt) === 0;
  }

  function captionText(post, mode, length) {
    if (mode === "full") return post.caption;
    if (mode === "clean") return cleanCaption(post.caption, length);
    if (length === DEFAULT_CAPTION_LENGTH) return post.caption_short;
    return post.caption ? shorten(post.caption, length) : post.caption_short;
  }

  function injectStyles() {
    if (document.getElementById("ig-feed-styles")) return;
    var style = document.createElement("style");
    style.id = "ig-feed-styles";
    style.textContent = PLAY_CSS;
    var head = document.head || document.documentElement;
    head.insertBefore(style, head.firstChild);
  }

  function removePlay(card) {
    $$(card, "[data-ig-play-overlay]").forEach(function (el) {
      el.parentNode.removeChild(el);
    });
  }

  function addPlay(img) {
    var wrap = img.parentNode;
    if (!wrap || wrap.nodeType !== 1) return;
    injectStyles();
    if (window.getComputedStyle(wrap).position === "static") wrap.style.position = "relative";

    var play = document.createElement("span");
    play.className = "ig-feed-play";
    play.setAttribute("aria-hidden", "true");
    play.setAttribute("data-ig-play-overlay", "");
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "ig-feed-play-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("focusable", "false");
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z");
    svg.appendChild(path);
    play.appendChild(svg);
    wrap.appendChild(play);
  }

  function fillCard(card, post, feedUrl, opts) {
    var isVideo = post.type === "video";
    removePlay(card);

    var img = $(card, "[data-ig-image]") || (card.tagName === "IMG" ? card : $(card, "img"));
    if (img) {
      // Webflow adds srcset/sizes to uploaded images; drop them or the
      // browser keeps showing the placeholder.
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      img.src = new URL(post.image, feedUrl).toString();
      img.alt = post.alt || "";
      img.setAttribute("decoding", "async");
    }

    var caption = $(card, "[data-ig-caption]");
    if (caption) {
      var mode = captionModeOf(caption) || opts.captionMode;
      var length = captionLengthOf(caption) || opts.captionLength;
      var text = captionText(post, mode, length);
      caption.textContent = text || "";
      show(caption, !!text);
      // The visible caption already describes the post; don't read it twice.
      if (text && img && altFromCaption(post)) img.alt = "";
    }

    var date = $(card, "[data-ig-date]");
    if (date) {
      date.textContent = formatDate(post.timestamp);
      if (date.tagName === "TIME") date.setAttribute("datetime", post.timestamp);
    }

    var videoBadge = $(card, "[data-ig-video]");
    show($(card, "[data-ig-featured]"), post.featured);
    show(videoBadge, isVideo);
    show($(card, "[data-ig-carousel]"), post.type === "carousel");
    if (isVideo && !videoBadge && opts.play && img && img !== card) addPlay(img);

    // Combo-class hooks: style ".your-card.is-featured" etc. in the Designer.
    card.classList.toggle("is-featured", !!post.featured);
    card.classList.toggle("is-video", isVideo);
    card.classList.toggle("is-carousel", post.type === "carousel");

    var link = card.tagName === "A" ? card : $(card, "[data-ig-link]") || $(card, "a");
    if (link) {
      link.href = post.permalink;
      link.target = "_blank";
      link.rel = "noopener";
      // Tell screen reader users the link leaves the site.
      var note = $(link, "[data-ig-newtab]");
      if (!note) {
        note = document.createElement("span");
        note.setAttribute("data-ig-newtab", "");
        note.setAttribute("style", HIDDEN_LABEL_STYLE);
        link.appendChild(note);
      }
      note.textContent = isVideo ? " (video, opens Instagram in a new tab)" : " (opens Instagram in a new tab)";
    }
  }

  // Copied cards need Webflow interactions re-attached.
  function reinitWebflowInteractions() {
    try {
      if (window.Webflow && window.Webflow.require) {
        var ix2 = window.Webflow.require("ix2");
        if (ix2 && ix2.init) ix2.init();
      }
    } catch (e) {
      /* interactions are optional */
    }
  }

  function render(container) {
    var feedAttr = container.getAttribute("data-ig-feed");
    if (!feedAttr || feedAttr === "true") return fail(container, "data-ig-feed needs the feed.json URL as its value.");
    var feedUrl = new URL(feedAttr, document.baseURI).toString();

    var cards = findCards(container);
    if (!cards.length) return fail(container, "No cards found inside the data-ig-feed element.");

    var opts = {
      captionMode: captionModeOf(container) || "short",
      captionLength: captionLengthOf(container) || DEFAULT_CAPTION_LENGTH,
      play: container.getAttribute("data-ig-play") !== "none"
    };
    var singleTemplate = cards.length === 1;
    var limit = singleTemplate ? parseInt(container.getAttribute("data-ig-limit"), 10) || 6 : cards.length;

    fetch(feedUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("feed.json returned HTTP " + res.status);
        return res.json();
      })
      .then(function (feed) {
        var posts = (feed.posts || []).slice(0, limit);
        if (!posts.length) return fail(container, "feed.json has no posts.");
        if (feed.sample && window.console) {
          console.info("[ig-feed] Showing sample posts. Add the Instagram token to go live.");
        }

        if (singleTemplate) {
          var template = cards[0];
          var parent = template.parentNode;
          posts.forEach(function (post) {
            var card = template.cloneNode(true);
            card.removeAttribute("id");
            // Insert first: the play button reads the wrapper's computed style,
            // which a detached element doesn't have.
            parent.insertBefore(card, template);
            fillCard(card, post, feedUrl, opts);
          });
          parent.removeChild(template);
          reinitWebflowInteractions();
        } else {
          cards.forEach(function (card, i) {
            if (posts[i]) {
              fillCard(card, posts[i], feedUrl, opts);
              show(card, true);
            } else {
              show(card, false);
            }
          });
        }

        $$(document, "[data-ig-follow]").forEach(function (a) {
          if (feed.profile_url) {
            a.href = feed.profile_url;
            a.target = "_blank";
            a.rel = "noopener";
          }
        });
        $$(document, "[data-ig-handle]").forEach(function (el) {
          if (feed.username) el.textContent = "@" + feed.username;
        });

        container.setAttribute("data-ig-ready", "");
      })
      .catch(function (err) {
        fail(container, err.message);
      });
  }

  function init() {
    $$(document, "[data-ig-feed]").forEach(render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
