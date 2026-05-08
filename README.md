# Summerland Cottage Site

Static landing page scaffold for the Summerland Cottage direct-booking site.

## Current image status

Instagram exposes only public profile metadata from this machine/session. The account has 22 posts, but the post grid is behind an Instagram login wall, so only `assets/instagram-profile.jpg` was downloadable without credentials.

Once logged in or exported, put the Instagram post images here:

```text
assets/instagram/
  01-hero.jpg
  02-living-room.jpg
  03-kitchen.jpg
  ...
```

Then replace the placeholder gallery blocks in `index.html` with real `<img>` tags.

## Preview

Open `index.html` in a browser, or run:

```bash
python3 -m http.server 8080
```

from this folder.
