#!/usr/bin/env python3
"""Fetch the GitHub contribution graph and write it out as a static graph.svg.

No API key: GitHub serves this publicly. Re-run whenever you want the graph
refreshed (or wire it to a cron / GitHub Action).

    python3 update-graph.py [username] [months]

Defaults to the last 6 months. Pass 12 for the full year.
"""
import datetime as dt
import re
import subprocess
import sys

USER = sys.argv[1] if len(sys.argv) > 1 else "ishanmalu"
MONTHS = int(sys.argv[2]) if len(sys.argv) > 2 else 6
CELL, GAP = 11, 3  # px

# GitHub's own range params, so this is a real 6-month window rather than a
# crop of the year. The range can span two calendar years, so ask for both.
today = dt.date.today()
start = today - dt.timedelta(days=round(MONTHS * 30.44))
url = (f"https://github.com/users/{USER}/contributions"
       f"?from={start.isoformat()}&to={today.isoformat()}")
html = subprocess.run(
    ["curl", "-sSfL", "--max-time", "30", "-A", "portfolio-graph", url],
    capture_output=True, text=True, check=True,
).stdout

days = [
    (dt.date.fromisoformat(d), int(l))
    for d, l in re.findall(r'data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"', html)
]
if not days:
    sys.exit(f"no contribution data found for {USER} — did the page shape change?")

days = sorted(d for d in days if start <= d[0] <= today)
if not days:
    sys.exit(f"no contributions in the last {MONTHS} months for {USER}")
first = days[0][0]
origin = first - dt.timedelta(days=(first.weekday() + 1) % 7)  # back to Sunday

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

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="GitHub contributions for {USER}">
<style>
.l0{{fill:#e4e4e1}} .l1{{fill:#b7dcae}} .l2{{fill:#71bd63}} .l3{{fill:#41924a}} .l4{{fill:#256b33}}
@media (prefers-color-scheme: dark){{
.l0{{fill:#1e1e1d}} .l1{{fill:#1f4a2c}} .l2{{fill:#2f6b2c}} .l3{{fill:#4f9c46}} .l4{{fill:#8fbf7a}}
}}
</style>
{"".join(cells)}
</svg>'''

with open("graph.svg", "w") as f:
    f.write(svg)

active = sum(1 for _, l in days if l)
print(f"graph.svg written — last {MONTHS} months: {len(days)} days, "
      f"{active} with contributions, {first} to {days[-1][0]}")
