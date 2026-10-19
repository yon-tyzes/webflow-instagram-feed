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
 *   data-ig-caption       text element: post caption (about 140 characters)
 *   data-ig-date          text element: post date
 *   data-ig-featured      element shown only on featured posts
 *   data-ig-video         element shown only on Reels/videos
 *   data-ig-carousel      element shown only on multi-photo posts
 *   data-ig-section       on the whole section: hidden if the feed can't load
 *   data-ig-follow        any link on the page: gets the profile URL
 *   data-ig-handle        any text on the page: gets "@username"
 *
 * Options on the data-ig-feed element:
 *   data-ig-limit="6"         max cards (single-card mode only)
 *   data-ig-caption="full"    full caption instead of the short one
 *
 * Each filled card also gets combo classes is-featured, is-video, is-carousel.
 */
(function () {
  "use strict";

  var HIDDEN_LABEL_STYLE =
    "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0";

  function $(root, sel) {
    return root.querySelector(sel);
  }
  function $$(root, sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }
  function show(el, on) {
    if (el) el.style.display = on ? "" : "none";
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

  function fillCard(card, post, feedUrl, captionMode) {
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
      var text = captionMode === "full" ? post.caption : post.caption_short;
      caption.textContent = text || "";
      show(caption, !!text);
    }

    var date = $(card, "[data-ig-date]");
    if (date) {
      date.textContent = formatDate(post.timestamp);
      if (date.tagName === "TIME") date.setAttribute("datetime", post.timestamp);
    }

    show($(card, "[data-ig-featured]"), post.featured);
    show($(card, "[data-ig-video]"), post.type === "video");
    show($(card, "[data-ig-carousel]"), post.type === "carousel");

    // Combo-class hooks: style ".your-card.is-featured" etc. in the Designer.
    card.classList.toggle("is-featured", !!post.featured);
    card.classList.toggle("is-video", post.type === "video");
    card.classList.toggle("is-carousel", post.type === "carousel");

    var link = card.tagName === "A" ? card : $(card, "[data-ig-link]") || $(card, "a");
    if (link) {
      link.href = post.permalink;
      link.target = "_blank";
      link.rel = "noopener";
      // Tell screen reader users the link leaves the site.
      if (!$(link, "[data-ig-newtab]")) {
        var note = document.createElement("span");
        note.setAttribute("data-ig-newtab", "");
        note.setAttribute("style", HIDDEN_LABEL_STYLE);
        note.textContent = " (opens Instagram in a new tab)";
        link.appendChild(note);
      }
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

    var captionMode = container.getAttribute("data-ig-caption") || "short";
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
            fillCard(card, post, feedUrl, captionMode);
            parent.insertBefore(card, template);
          });
          parent.removeChild(template);
          reinitWebflowInteractions();
        } else {
          cards.forEach(function (card, i) {
            if (posts[i]) {
              fillCard(card, posts[i], feedUrl, captionMode);
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
