# Helix Signals

Training tools for communicators, hosted on GitHub Pages at
<https://helix-is-here.github.io>.

## Tools

- **Morse Table** (`/morse-table/`): reference grid of letters and numbers.
- **Morse Drop** (`/morse-drop/`): flashing-light trainer that sends random
  groups and reveals them afterwards. Settings are saved in the browser.
- **ADF Ranks Quiz** (`/adf-ranks-quiz/`): multiple-choice quiz matching rank
  insignia and rank names across the Navy, Army and Air Force. Rank data is in
  `adf-ranks-quiz/ranks.js`; insignia are drawn in `insignia.js`, and any rank
  can use a real image instead by adding an `image` path.

## Structure

Plain HTML, CSS and JavaScript with no build step. Bootstrap's CSS is loaded
from a CDN for layout and the navbar.

```
index.html        home page
components.js     shared navbar and footer
styles.css        shared colours and base styles
morse-table/      Morse Table page
morse-drop/       Morse Drop page
adf-ranks-quiz/   ADF Ranks Quiz page
assets/           images and icons
```

## Adding a page

1. Create a folder with an `index.html` that loads `../styles.css` and
   `../components.js`, and includes `<div data-site-navbar></div>` and
   `<div data-site-footer></div>`.
2. Add (or un-strike) its entry in `NAV_LINKS` in `components.js` by giving it
   an `href`.

## Running locally

Serve the repository root, for example:

```
python3 -m http.server 8000
```

then open <http://localhost:8000>. Opening the files directly won't work,
because pages use root-relative paths such as `/assets/...`.
