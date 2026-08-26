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
