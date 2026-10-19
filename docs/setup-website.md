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

Style the cards however you like. The script doesn't add or change your classes, apart from the optional [combo classes](#style-featured-posts-and-reels).

### 2. Add the attribute

1. Select the grid that holds the cards.
2. **Element settings** (gear icon) **> Custom attributes > +**.
3. Name: `data-ig-feed`. Value: your feed address.

Optional: select the whole section and add `data-ig-section` with the value `true`. If the feed ever fails to load, the whole section hides instead of showing placeholder boxes.

### 3. Size the images

Instagram photos come in different shapes, so let the wrapper set the shape:

- **Image wrapper:** an aspect ratio (1:1 for squares, or 3:4 to match the Instagram profile grid), and **Overflow: Hidden** if it has rounded corners.
- **Image:** **Width 100%**, **Height 100%**, and **Fit: Cover** (under **Size > More size options**).

### 4. Add the custom code

**Page settings** (or **Site settings** to load it everywhere) **> Custom code**:

- **Inside `<head>` tag:** paste [`examples/head-code.html`](../examples/head-code.html). It hides the placeholder cards until the posts load, without shifting the layout.
- **Before `</body>` tag:** paste [`examples/footer-code.html`](../examples/footer-code.html), with your GitHub username and repository name filled in.

### 5. Publish

Custom code runs on the staged and published site, not in the Designer. Publish, open the page, and you should see the sample posts in your design.

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
| `data-ig-caption` | A text element in the card | Shows the caption, cut at about 140 characters. |
| `data-ig-date` | A text element in the card | Shows the post date, like "Oct 12". |
| `data-ig-featured` | A badge in the card | Shown only on featured posts. |
| `data-ig-video` | An icon in the card | Shown only on Reels and videos. |
| `data-ig-carousel` | An icon in the card | Shown only on multi-photo posts. |
| `data-ig-follow` | Any link on the page | Gets your profile address. |
| `data-ig-handle` | Any text on the page | Becomes your `@handle`. |

Options on the `data-ig-feed` element:

| Attribute | Value | Default |
| --- | --- | --- |
| `data-ig-limit` | Number of cards when you build one card | `6` |
| `data-ig-caption` | `full` to show the whole caption | short caption |

## Style featured posts and Reels

The script adds these classes to filled cards:

- `is-featured` on featured posts
- `is-video` on Reels and videos
- `is-carousel` on multi-photo posts

In Webflow, add a combo class with the exact same name to one card and style it. You can leave it on that card: on the live page the script adds the class to the right cards and removes it from the others. Keeping it applied also stops Webflow's **Clean up** from deleting the style as unused.

A small play icon on Reel cards is worth adding. Without it, visitors expect a photo and land on a video.

## Accessibility

- Each photo's alt text comes from the alt text set on Instagram. If there is none, it uses the first sentence of the caption. If the caption is empty too, it says "Instagram post from @handle". Writing alt text on Instagram gives the best result.
- Each card link includes hidden text, "opens Instagram in a new tab", for screen reader users.
- Give your cards a visible focus style so keyboard users can see where they are.
- Captions and other post text are inserted as plain text, never as HTML.
