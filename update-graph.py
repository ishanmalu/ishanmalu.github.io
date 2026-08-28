#!/usr/bin/env python3
"""Write contributions.json from a GitHub profile's contribution calendar.

    python3 update-graph.py [username] [months]

Defaults to 12 months, which is what the page needs to offer its 3/6/12
ranges without refetching. No API key needed.

The page used to ship two pre-rendered SVGs. Those could not be clicked and
could not change range, so this writes the data instead and the page draws
the grid itself.
"""
import datetime as dt
import json
import re
import subprocess
import sys

USER = sys.argv[1] if len(sys.argv) > 1 else "ishanmalu"
MONTHS = int(sys.argv[2]) if len(sys.argv) > 2 else 12

today = dt.date.today()
start = today - dt.timedelta(days=round(MONTHS * 30.44))

# The endpoint ignores from/to and answers with the whole calendar year, so a
# window that straddles New Year needs one request per year.
html = ""
for year in range(start.year, today.year + 1):
    url = (f"https://github.com/users/{USER}/contributions"
           f"?from={year}-01-01&to={year}-12-31")
    html += subprocess.run(
        ["curl", "-sSfL", "--max-time", "30", "-A", "portfolio-graph", url],
        capture_output=True, text=True, check=True,
    ).stdout

# Each day is a <td> carrying the date and level. The count lives only in the
# <tool-tip> that points back at the cell's id, so the two have to be joined.
cells = re.findall(
    r'<td[^>]*?id="(contribution-day-component-[\d-]+)"[^>]*?'
    r'data-date="(\d{4}-\d{2}-\d{2})"[^>]*?data-level="(\d)"',
    html,
)
if not cells:
    # Attribute order is not guaranteed; try the other arrangement before failing.
    cells = [
        (m.group("id"), m.group("date"), m.group("level"))
        for m in re.finditer(
            r'<td(?=[^>]*id="(?P<id>contribution-day-component-[\d-]+)")'
            r'(?=[^>]*data-date="(?P<date>\d{4}-\d{2}-\d{2})")'
            r'(?=[^>]*data-level="(?P<level>\d)")[^>]*>',
            html,
        )
    ]
if not cells:
    sys.exit(f"no contribution cells found for {USER} — did the page shape change?")

counts = {}
for cell_id, text in re.findall(r'<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)</tool-tip>', html):
    m = re.match(r"([\d,]+) contribution", text)
    counts[cell_id] = int(m.group(1).replace(",", "")) if m else 0

days = {}
for cell_id, date, level in cells:
    d = dt.date.fromisoformat(date)
    if start <= d <= today:
        days[d] = (int(level), counts.get(cell_id, 0))
if not days:
    sys.exit(f"no contributions in the last {MONTHS} months for {USER}")

ordered = sorted(days.items())
payload = {
    "user": USER,
    "generated": today.isoformat(),
    "from": ordered[0][0].isoformat(),
    "to": ordered[-1][0].isoformat(),
    "days": [{"d": d.isoformat(), "l": lvl, "c": cnt} for d, (lvl, cnt) in ordered],
}
with open("contributions.json", "w") as f:
    json.dump(payload, f, separators=(",", ":"))

total = sum(c for _, c in days.values())
active = sum(1 for _, c in days.values() if c)
print(f"contributions.json written — last {MONTHS} months: {len(ordered)} days, "
      f"{active} active, {total} contributions, {payload['from']} to {payload['to']}")
