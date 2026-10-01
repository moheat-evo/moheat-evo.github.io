# MoHeat Evo Kickstarter landing page prototype

Static prototype: no build step required.

## Open locally
Open `index.html` in a browser, or run:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Project structure
```
index.html            Page markup
styles.css            All styles
script.js             Reveal animations, thermal demo, video modal, contact form
assets/
  images/             Use-case card images (use-*.jpg, media-*.jpg)
  posters/            Video cover frames
  video/              Web-compressed videos (720p H.264)
```

## Publishing updates
```bash
git add -A && git commit -m "Describe the change" && git push
```
When you change `styles.css` or `script.js`, bump the `?v=` number on their tags in `index.html` so browsers (especially phones) load the new files instead of a cached copy.

## Replace before launch
- Replace the Kickstarter CTA placeholder `href="#"` with the live campaign URL.
- Verify rights/permissions for third-party reaction videos, media screenshots and logos.

## Suggested content order
Hero (joint research badge, SIGGRAPH Asia 2026 film, key points) → interactive demo → voice use cases 01–04 → media use cases 05–08 + partner strip → CES / SIGGRAPH Asia / NHK videos → UTokyo × Suntory joint research → Kickstarter CTA → Contact.

## Contact form
Messages go to `moheat-evo@outlook.com` (`CONTACT_EMAIL` in `script.js`).
- **With a key** (current, set in `WEB3FORMS_KEY`): submissions are delivered automatically. Without a key, "Send message" opens the visitor's mail app instead.
- To use another inbox, create a free Access Key at [web3forms.com](https://web3forms.com) for that address and paste it into `WEB3FORMS_KEY` in `script.js`. Submissions are then delivered automatically; if sending fails, the form offers an "Email us directly" link instead.
- The Access Key is designed to be public in front-end code; it can only send form messages to your inbox.
