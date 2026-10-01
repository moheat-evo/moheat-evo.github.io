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
`control.html` (+ `control.css`, `control.js`) drives the MoHeat Evo firmware over Web Serial. Desktop Chrome/Edge only; not linked from the main page. One-screen layout: device bar on top, large video, controls on the right.
- **Device**: authorized ports are listed automatically (refresh on plug/unplug); "+ Add" authorizes a new USB or paired Bluetooth (SPP) port; "Connect" opens it at 115200 baud.
- **Source**: paste a YouTube link (then "Start thermal sync", share *This tab* with *Share tab audio*), or upload a local video/audio file (no sharing needed).
- **Level response**: *Auto-normalize* (default) tracks the loudest recent passage so peaks reach full output; a noise gate zeroes background noise; with auto off, *Sensitivity* (×1–×10) scales the level instead.
- **Mapping**: slider −100…+100 × per-channel drive → heat `H heatMin–heatMax` / cool `C coolMin–coolMax` (defaults 0–200 / 35–80 from the firmware; up to 255). Sent as `LH… RH…` at most 10×/s, only on change; all zero → `stop`. Settings persist in the browser.
- **Safety**: `stop` on pause, end, sync off, disconnect, page close, and the STOP button.
- The firmware in `arduino/` is kept out of the repo (`.gitignore`).

## Output test page
`test.html` (+ `test.css`, `test.js`) sets each ear directly with one bar: −100 % (max cool) … 0 (off) … +100 % (max warm), plus −100/−50/Off/+50/+100 presets; a gauge shows the % and resulting PWM.
- **Output range**: Heat min–max and Cool min–max (PWM). 0 % is off; 1–100 % maps linearly to min–max. The range is stored in the browser and **shared with `control.html`**; a warning appears above the firmware maxima (heat 200, cool 80).
- Sends `L<H|C><pwm> R<H|C><pwm>` (≤10×/s, on change); both off → `stop`. *Link left & right* mirrors one ear onto the other.
- *Auto-off* (default 10 s) stops output after the last change; *All off* and *STOP* send `stop` immediately.
- A raw command box sends any firmware line (`BH100`, `ID:6`, `stop`).
- Both pages share the serial connection code in `device.js`.

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
