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
  document.documentElement.lang = fi ? 'fi' : 'en';
  buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  try { localStorage.setItem('lang', lang); } catch {}
}

buttons.forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

let saved = null;
try { saved = localStorage.getItem('lang'); } catch {}
setLang(saved || (navigator.language.startsWith('fi') ? 'fi' : 'en'));
