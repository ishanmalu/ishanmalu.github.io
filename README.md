# ishanmalu.github.io

Personal site. Static HTML, CSS and a little JS. No framework, no build step.

    index.html        content, both languages marked with data-t
    lang.js           Finnish strings
    app.js            section switching + language toggle
    styles.css
    update-graph.py   regenerates graph-{light,dark}.svg from GitHub's calendar

Run it locally with any static server:

    python3 -m http.server 4599

Refresh the contribution graph:

    python3 update-graph.py ishanmalu 6

A GitHub Action does that weekly and commits the result.
