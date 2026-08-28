const panes = [...document.querySelectorAll('.view')];
const links = [...document.querySelectorAll('.nav a')];

function show(id) {
  const target = panes.some(p => p.id === id) ? id : 'code';
  panes.forEach(p => { p.hidden = p.id !== target; });
  links.forEach(a => {
    const on = a.dataset.pane === target;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}

show(location.hash.slice(1));
addEventListener('hashchange', () => show(location.hash.slice(1)));

// Finnish CVs write dates as 8/2023, not Aug 2023.
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// Only the text nodes: rewriting .when's innerHTML would detach the
// nested [data-t] span that holds "now".
const dateText = [];
document.querySelectorAll('.when').forEach(n => {
  n.childNodes.forEach(c => {
    if (c.nodeType === 3 && /[A-Z][a-z]{2} \d{4}/.test(c.nodeValue)) {
      dateText.push([c, c.nodeValue]);
    }
  });
});

function localiseDates(fi) {
  dateText.forEach(([node, en]) => {
    node.nodeValue = fi
      ? en.replace(/([A-Z][a-z]{2}) (\d{4})/g,
          (m, mon, year) => MONTHS.indexOf(mon) < 0 ? m : `${MONTHS.indexOf(mon) + 1}/${year}`)
      : en;
  });
}

// EN lives in the markup, so cache it before the first swap.
const nodes = [...document.querySelectorAll('[data-t]')];
const EN = new Map(nodes.map(n => [n, n.innerHTML]));
const alts = [...document.querySelectorAll('[data-alt]')];
const ALT = new Map(alts.map(n => [n, n.alt]));
const buttons = [...document.querySelectorAll('.langs button')];

function setLang(lang) {
  const fi = lang === 'fi';
  nodes.forEach(n => {
    const t = fi ? window.FI[n.dataset.t] : EN.get(n);
    if (t !== undefined) n.innerHTML = t;
  });
  alts.forEach(n => {
    const t = fi ? window.FI[n.dataset.alt] : ALT.get(n);
    if (t !== undefined) n.alt = t;
  });
  localiseDates(fi);
  document.documentElement.lang = fi ? 'fi' : 'en';
  buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  try { localStorage.setItem('lang', lang); } catch {}
}

buttons.forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

let savedLang = null;
try { savedLang = localStorage.getItem('lang'); } catch {}
setLang(savedLang || (navigator.language.startsWith('fi') ? 'fi' : 'en'));

// Theme. Follows the OS until the reader picks one, then that sticks.
const root = document.documentElement;
let savedTheme = null;
try { savedTheme = localStorage.getItem('theme'); } catch {}
if (savedTheme) root.dataset.theme = savedTheme;

function currentlyDark() {
  return root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
}

const themeButtons = [...document.querySelectorAll('[data-theme-toggle]')];
const markTheme = () =>
  themeButtons.forEach(b => b.setAttribute('aria-pressed', String(currentlyDark())));

themeButtons.forEach(b => {
  b.addEventListener('click', () => {
    const next = currentlyDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
    markTheme();
  });
});

markTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', markTheme);

/* ---- contributions ----------------------------------------------------
   The calendar runs downwards: seven columns, one per weekday, filling a
   week at a time. Clicking a day names it, which a static image could not
   do — that is why the page fetches the data and draws this itself. */
(() => {
  const grid = document.getElementById('graphGrid');
  const read = document.getElementById('graphRead');
  const range = document.querySelector('.graph-range');
  if (!grid) return;

  const DAY = 86400000;
  let days = [];
  let months = 12;
  let picked = null;

  const iso = d => d.toISOString().slice(0, 10);
  // Short month: the rail is ~100px wide and a long one wraps to a third line.
  const fmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  function draw() {
    grid.innerHTML = '';
    read.textContent = '';
    picked = null;
    if (!days.length) return;

    const last = new Date(days[days.length - 1].d + 'T00:00:00');
    const first = new Date(last.getTime() - Math.round(months * 30.44) * DAY);
    const shown = days.filter(x => new Date(x.d + 'T00:00:00') >= first);
    if (!shown.length) return;

    // Start the grid on the Sunday of the first shown week so weekdays line up
    // in their own columns; the leading blanks are spacers, not days.
    const start = new Date(shown[0].d + 'T00:00:00');
    for (let i = 0; i < start.getDay(); i++) {
      const pad = document.createElement('i');
      pad.className = 'pad';
      grid.appendChild(pad);
    }

    for (const day of shown) {
      const cell = document.createElement('i');
      if (day.l) cell.className = 'l' + day.l;
      cell.dataset.d = day.d;
      cell.dataset.c = day.c;
      cell.tabIndex = 0;
      const label = describe(day);
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', label);
      cell.title = label;
      grid.appendChild(cell);
    }
  }

  function describe(day) {
    const when = fmt.format(new Date(day.d + 'T00:00:00'));
    if (!day.c) return 'No contributions on ' + when;
    return day.c + (day.c === 1 ? ' contribution on ' : ' contributions on ') + when;
  }

  function pick(cell) {
    if (!cell || cell.classList.contains('pad')) return;
    if (picked) picked.classList.remove('pick');
    picked = cell;
    cell.classList.add('pick');
    read.textContent = describe({ d: cell.dataset.d, c: Number(cell.dataset.c) });
  }

  grid.addEventListener('click', e => pick(e.target.closest('i')));
  grid.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e.target.closest('i')); }
  });

  range.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    months = Number(b.dataset.months);
    [...range.children].forEach(x => x.classList.toggle('on', x === b));
    draw();
  });

  fetch('contributions.json')
    .then(r => r.ok ? r.json() : Promise.reject(new Error(r.status)))
    .then(data => { days = data.days || []; draw(); })
    .catch(() => { read.textContent = 'Contribution data unavailable.'; });
})();
