# ishanmalu.github.io

Personal site. Static HTML, CSS and a little JS. No framework, no build step.

    index.html        content, both languages marked with data-t
    lang.js           Finnish strings
    app.js            section switching + language toggle
    styles.css
    update-graph.py   writes contributions.json from GitHub's calendar
    og.html           source for the 1200x630 social card; re-render to og.png after edits

Run it locally with any static server:

    python3 -m http.server 4599

Refresh the contribution graph:

    python3 update-graph.py ishanmalu 12

A GitHub Action does that daily and commits the result.

Re-render the social card after editing og.html:

    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
      --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
      --window-size=1200,630 --screenshot="$PWD/og.png" "file://$PWD/og.html"
