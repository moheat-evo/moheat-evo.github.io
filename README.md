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

## Replace before launch
- Replace the Kickstarter CTA placeholder `href="#"` with the live campaign URL.
- Verify rights/permissions for third-party reaction videos, media screenshots and logos.

## Suggested content order
Hero (joint research badge, SIGGRAPH Asia 2026 film, key points) → interactive demo → voice use cases 01–04 → media use cases 05–08 + partner strip → CES / SIGGRAPH Asia / NHK videos → UTokyo × Suntory joint research → Kickstarter CTA → Contact.

## Contact form
The Contact form posts to [FormSubmit](https://formsubmit.co) and is delivered to `xujiayi19950614@gmail.com` (set in `script.js` as `CONTACT_EMAIL`).
- The first submission triggers an activation email from FormSubmit to that inbox — click the link once, and later messages are delivered normally.
- Test it from a local server or the deployed site (not by opening `index.html` directly via `file://`).
- If sending fails, the form shows a "Email us directly" link that opens the visitor's mail app instead.
