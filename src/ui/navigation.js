export const VIEWS = ['home', 'editor', 'solve', 'practice', 'learn', 'settings', 'help'];
const LABELS = { home: 'Home', editor: 'Cube Editor', solve: 'Solve', practice: 'Practice', learn: 'Learn', settings: 'Settings', help: 'Help' };

export function createNavigation({ nav, menuBtn, onChange }) {
  nav.innerHTML = VIEWS.map((v) => `<button data-view="${v}">${LABELS[v]}</button>`).join('');
  function show(view) {
    document.body.dataset.view = view;
    VIEWS.forEach((v) => { document.getElementById(`view-${v}`).hidden = v !== view; });
    nav.querySelectorAll('button').forEach((b) => { if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false');
    onChange(view);
  }
  nav.addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) show(b.dataset.view); });
  document.addEventListener('click', (e) => { const g = e.target.closest('[data-go]'); if (g) show(g.dataset.go); });
  menuBtn.addEventListener('click', () => { const o = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', String(o)); });
  return { show };
}
