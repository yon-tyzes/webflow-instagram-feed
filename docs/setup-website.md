# Set up your website

You design the cards. The script fills them with posts. Everything below works with the sample feed, so you can do it before you have an Instagram token.

You need your feed address from [Set up GitHub](setup-github.md): `https://YOUR-USER.github.io/YOUR-REPO/feed.json`.

## How the script finds things

Put `data-ig-feed` on the element that holds your cards. That's the only required attribute.

- **Cards:** each direct child of that element is a card.
- **Photo:** the first image in each card gets the post's photo and alt text.
- **Link:** if the card is a link, it points to the post. Otherwise the first link inside the card does.

There are two ways to build the cards:

| You build | What happens |
| --- | --- |
| **Every card** (for example 6) | The script fills them in order. Interactions and hover effects on the cards keep working. If there are fewer posts than cards, the extra cards hide. |
| **One card** | The script copies it once per post, up to `data-ig-limit` (default 6). |

Building every card is the better choice on Webflow, because Webflow attaches interactions to elements when the page loads.

## Webflow

Custom code needs a paid Webflow site plan.

### 1. Build the section

```text
Section                     data-ig-section = true   (optional)
  Container
    Heading, intro text, Follow button               (normal elements)
    Grid                    data-ig-feed = https://YOUR-USER.github.io/YOUR-REPO/feed.json
      Link Block            card 1
        Div                 image wrapper
          Image
      Link Block            card 2
      ...                   up to card 6
```

Style the cards however you like. The script doesn't add or change your classes, apart from the optional [combo classes](#style-featured-posts-and-reels). On video cards it adds a [play button](#play-button-on-videos) over the image.

### 2. Add the attribute

1. Select the grid that holds the cards.
2. **Element settings** (gear icon) **> Custom attributes > +**.
3. Name: `data-ig-feed`. Value: your feed address.

Optional: select the whole section and add `data-ig-section` with the value `true`. If the feed ever fails to load, the whole section hides instead of showing placeholder boxes.

### 3. Size the images

Instagram photos come in different shapes, so let the wrapper set the shape:

- **Image wrapper:** an aspect ratio (1:1 for squares, or 3:4 to match the Instagram profile grid), and **Overflow: Hidden** if it has rounded corners. The [play button](#play-button-on-videos) is centered in this wrapper.
- **Image:** **Width 100%**, **Height 100%**, and **Fit: Cover** (under **Size > More size options**).

### 4. Add the custom code

**Page settings** (or **Site settings** to load it everywhere) **> Custom code**:

- **Inside `<head>` tag:** paste [`examples/head-code.html`](../examples/head-code.html). It hides the placeholder cards until the posts load, without shifting the layout.
- **Before `</body>` tag:** paste [`examples/footer-code.html`](../examples/footer-code.html), with your GitHub username and repository name filled in.

### 5. Publish

Custom code runs on the staged and published site, not in the Designer. Publish, open the page, and you should see the sample posts in your design.

### Add captions and the handle

Captions and the `@handle` are optional text inside each card.

1. Inside the card, below the image wrapper, add a **Text Block** for the handle. Under **Element settings > Custom attributes**, add `data-ig-handle` with the value `true`.
2. Add a second **Text Block** for the caption. Add the attribute `data-ig-caption` with the value `clean`. Clean captions leave out links and hashtags. See [Captions](#captions) for the other modes.
3. Select the caption Text Block and set **Typography > Line clamp** to 2 or 3 lines, so long captions end neatly with "…" and every card stays the same height.
4. Publish. The placeholder text in both blocks is replaced on the live page.

If you built every card by hand, add the same two Text Blocks with the same attributes to each card. A quick way is to finish one card, delete the others, and duplicate the finished one. If you built one card, the copies get them automatically.

### Links outside the grid

Set your Follow button and handle text by hand, pointing to `https://www.instagram.com/YOUR-HANDLE/`. They don't change, so they don't need the script. If you'd rather have the script fill them, see [`data-ig-follow` and `data-ig-handle`](#attribute-reference).

## Other site builders and plain HTML

Any site where you can add HTML and a script tag works. Build the same structure: an element with `data-ig-feed`, cards inside it, an image in each card. Then add the two snippets from [`examples/`](../examples): the style in the page head and the script before the closing body tag.

[`examples/minimal.html`](../examples/minimal.html) is a complete working page with six cards.

## Attribute reference

Add these under **Element settings > Custom attributes** in Webflow, or as HTML attributes. Any value works (for example `true`), except where a value is described.

| Attribute | Put it on | What it does |
| --- | --- | --- |
| `data-ig-feed` | The element holding the cards | **Required.** Value: your feed.json address. |
| `data-ig-section` | The whole section | Hidden if the feed can't load. |
| `data-ig-card` | Each card | Only needed if the grid holds other elements too. Then only marked elements are cards. |
| `data-ig-image` | An image in the card | Only needed if a card has more than one image. |
| `data-ig-link` | A link in the card | Only needed if the card isn't a link and has more than one link. |
| `data-ig-caption` | A text element in the card | Shows the caption, cut at about 140 characters. Value `short`, `full`, or `clean` sets the [caption mode](#captions) for this element. |
| `data-ig-caption-length` | The caption element | Length in characters for `clean` and `short` captions on this element. |
| `data-ig-date` | A text element in the card | Shows the post date, like "Oct 12". |
| `data-ig-featured` | A badge in the card | Shown only on featured posts. |
| `data-ig-video` | An icon in the card | Shown only on Reels and videos. Replaces the built-in [play button](#play-button-on-videos) on that card. |
| `data-ig-carousel` | An icon in the card | Shown only on multi-photo posts. |
| `data-ig-follow` | Any link on the page | Gets your profile address. |
| `data-ig-handle` | Any text on the page | Becomes your `@handle`. |

Options on the `data-ig-feed` element:

| Attribute | Value | Default |
| --- | --- | --- |
| `data-ig-limit` | Number of cards when you build one card | `6` |
| `data-ig-caption` | `short`, `full`, or `clean`. See [Captions](#captions). | `short` |
| `data-ig-caption-length` | Caption length in characters for `clean` and `short` | `140` |
| `data-ig-play` | `none` to turn off the built-in play button | play button on |

## Captions

There are three caption modes:

| Mode | Shows |
| --- | --- |
| `short` | The caption cut at about 140 characters, as written. This is the default. |
| `full` | The whole caption, as written. |
| `clean` | The caption without links and hashtags, cut at a word boundary with "…". The block of hashtags and mentions at the end is removed too. Emoji and @mentions inside sentences stay. |

`data-ig-caption-length` changes where `short` and `clean` captions are cut. It has no effect on `full`.

You can set the mode and length on the caption element itself, or on the `data-ig-feed` element for all cards. The script uses the first of these it finds:

1. The caption element's own `data-ig-caption` value, if it is `short`, `full`, or `clean`. Any other value, like `true`, is skipped.
2. The `data-ig-feed` element's `data-ig-caption` value.
3. `short`.

`data-ig-caption-length` works the same way: the caption element first, then the `data-ig-feed` element, then 140.

On Webflow, setting the mode on the caption Text Block is usually easiest, because that is the element you are already editing.

If a caption ends up empty (for example a post with only hashtags in `clean` mode), the caption element is hidden.

## Play button on videos

Reel and video cards get a round play button centered over the image, so visitors know the post is a video before they click. Clicks pass through it to the card link.

- **When it appears:** on video posts, in cards that have no element with `data-ig-video`. If a card has a `data-ig-video` element, that element is shown instead and no play button is added.
- **Where it goes:** inside the image's parent element (the image wrapper), centered. If the wrapper has no position set, the script sets it to `position: relative` so the button stays inside. It changes no other styles on your elements.
- **Turn it off:** add `data-ig-play` with the value `none` to the `data-ig-feed` element.

Restyle it with CSS variables. Set them on the grid, a card, or `body`, in your own CSS or in Webflow's custom code:

| Variable | Default |
| --- | --- |
| `--ig-play-size` | `56px` |
| `--ig-play-bg` | `rgba(0, 0, 0, 0.55)` |
| `--ig-play-color` | `#fff` |

```css
.your-grid { --ig-play-size: 44px; --ig-play-bg: rgba(255, 255, 255, 0.8); --ig-play-color: #111; }
```

The button grows slightly when the card is hovered or focused, except for visitors who ask for reduced motion. For larger changes, style the `.ig-feed-play` class. The script's own styles use single class selectors, so your CSS wins.

## Style featured posts and Reels

The script adds these classes to filled cards:

- `is-featured` on featured posts
- `is-video` on Reels and videos
- `is-carousel` on multi-photo posts

In Webflow, add a combo class with the exact same name to one card and style it. You can leave it on that card: on the live page the script adds the class to the right cards and removes it from the others. Keeping it applied also stops Webflow's **Clean up** from deleting the style as unused.

Reel cards get a [play button](#play-button-on-videos) automatically. To use your own icon instead, add it to the card with `data-ig-video`.

## Accessibility

- Each photo's alt text comes from the alt text set on Instagram. If there is none, it uses the first sentence of the caption. If the caption is empty too, it says "Instagram post from @handle". Writing alt text on Instagram gives the best result.
- When a card shows the caption and the alt text is the caption's first sentence, the image gets empty alt text (`alt=""`). The visible caption already describes the post, so screen readers don't read it twice. Alt text written on Instagram, and "Instagram post from @handle", are always kept.
- Each card link includes hidden text, "opens Instagram in a new tab", for screen reader users. On videos it says "video, opens Instagram in a new tab".
- The play button is hidden from screen readers (`aria-hidden="true"`), since the link text already says the post is a video.
- Give your cards a visible focus style so keyboard users can see where they are.
- Captions and other post text are inserted as plain text, never as HTML.
