#!/usr/bin/env python3
"""Write graph.svg from a GitHub profile's contribution calendar.

    python3 update-graph.py [username] [months]

Defaults to 6 months. No API key needed.
"""
import datetime as dt
import re
import subprocess
import sys

USER = sys.argv[1] if len(sys.argv) > 1 else "ishanmalu"
MONTHS = int(sys.argv[2]) if len(sys.argv) > 2 else 6
CELL, GAP = 11, 3  # px

# The endpoint only answers within one calendar year, so a window that
# straddles New Year needs a request per year, merged.
today = dt.date.today()
start = today - dt.timedelta(days=round(MONTHS * 30.44))

html = ""
for year in range(start.year, today.year + 1):
    frm = max(start, dt.date(year, 1, 1))
    to = min(today, dt.date(year, 12, 31))
    url = (f"https://github.com/users/{USER}/contributions"
           f"?from={frm.isoformat()}&to={to.isoformat()}")
    html += subprocess.run(
        ["curl", "-sSfL", "--max-time", "30", "-A", "portfolio-graph", url],
        capture_output=True, text=True, check=True,
    ).stdout

days = [
    (dt.date.fromisoformat(d), int(l))
    for d, l in re.findall(r'data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"', html)
]
if not days:
    sys.exit(f"no contribution data found for {USER} — did the page shape change?")

days = sorted({d: l for d, l in days if start <= d <= today}.items())
if not days:
    sys.exit(f"no contributions in the last {MONTHS} months for {USER}")
first = days[0][0]
origin = first - dt.timedelta(days=(first.weekday() + 1) % 7)  # nearest Sunday

cells = []
for date, level in days:
    col = (date - origin).days // 7
    row = (date.weekday() + 1) % 7
    x, y = col * (CELL + GAP), row * (CELL + GAP)
    cells.append(
        f'<rect x="{x}" y="{y}" width="{CELL}" height="{CELL}" rx="2" '
        f'class="l{level}"><title>{date} · level {level}</title></rect>'
    )

w = (max((d - origin).days // 7 for d, _ in days) + 1) * (CELL + GAP) - GAP
h = 7 * (CELL + GAP) - GAP

PALETTES = {
    "light": ("#e4e4e1", "#b7dcae", "#71bd63", "#41924a", "#256b33"),
    "dark":  ("#1e1e1d", "#1f4a2c", "#2f6b2c", "#4f9c46", "#8fbf7a"),
}

# two files rather than a media query, so the page's theme toggle drives them
for mode, p in PALETTES.items():
    style = " ".join(f".l{i}{{fill:{c}}}" for i, c in enumerate(p))
    svg = (f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '''
           f'''width="{w}" height="{h}" role="img" aria-label="GitHub contributions for {USER}">'''
           f"<style>{style}</style>{''.join(cells)}</svg>")
    with open(f"graph-{mode}.svg", "w") as f:
        f.write(svg)

active = sum(1 for _, l in days if l)
print(f"graph-light.svg + graph-dark.svg written — last {MONTHS} months: {len(days)} days, "
      f"{active} with contributions, {first} to {days[-1][0]}")
