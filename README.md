# MoHeat Evo — campaign site

Live: https://moheat-evo.github.io/

Static site, no build step.

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

## Device control page
`control.html` (+ `control.css`, `control.js`) drives the MoHeat Evo firmware over Web Serial. Desktop Chrome/Edge only; not linked from the main page.
- **Device**: ports you've authorized are listed automatically (and refresh on plug/unplug); "+ Add device…" authorizes a new USB or paired Bluetooth (SPP) port; "Connect" opens it at 115200 baud.
- **Source**: paste a YouTube link, then "Start thermal sync" and share *This tab* with *Share tab audio* on. An audio file works too.
- **Mapping** (matches the firmware): slider −100…+100 × per-channel level → heat `H0–200` / cool `C35–80`, sent as `LH… RH…` at most 10×/s, only when it changes. All zero → `stop`.
- **Safety**: `stop` on pause, end, sync off, disconnect, page close, and the Emergency stop button.
- The firmware in `arduino/` is kept out of the repo (`.gitignore`).

## Publishing updates
```bash
git add -A && git commit -m "Describe the change" && git push
```
When you change `styles.css` or `script.js`, bump the `?v=` number on their tags in `index.html` so browsers (especially phones) load the new files instead of a cached copy.

## Before the Kickstarter launch
- Point the "Get notified at launch" button (`#back` section) to the live campaign URL.
- Verify rights/permissions for third-party reaction videos, media screenshots and logos.

## Page order
Hero (joint-research badge, SIGGRAPH Asia 2026 film, key points) → interactive thermal demo → voice use cases 01–04 → media use cases 05–08 + partner strip → media wall + press coverage → exhibitions → UTokyo × Suntory joint research → Kickstarter notify → contact form.

## Contact form
Messages go to `moheat-evo@outlook.com` (`CONTACT_EMAIL` in `script.js`).
- **With a key** (current, set in `WEB3FORMS_KEY`): submissions are delivered automatically. Without a key, "Send message" opens the visitor's mail app instead.
- To use another inbox, create a free Access Key at [web3forms.com](https://web3forms.com) for that address and paste it into `WEB3FORMS_KEY` in `script.js`. Submissions are then delivered automatically; if sending fails, the form offers an "Email us directly" link instead.
- The Access Key is designed to be public in front-end code; it can only send form messages to your inbox.
