/* Landing TIC IES N.º 9 — JavaScript autónomo. Sin frameworks ni servicios externos. */
'use strict';

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrollBehavior = reducedMotion ? 'auto' : 'smooth';

// Menú móvil accesible.
const menuButton = $('#menu-toggle');
const navLinks = $('#nav-links');
function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  navLinks.classList.toggle('is-open', open);
}
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
$$('#nav-links a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', e => { if (!e.target.closest('.nav') && navLinks.classList.contains('is-open')) setMenu(false); });

// Animaciones de entrada discretas con IntersectionObserver.
const revealItems = $$('[data-reveal]');
if ('IntersectionObserver' in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } });
  }, { threshold: .09, rootMargin: '0px 0px -20px 0px' });
  revealItems.forEach(item => revealObserver.observe(item));
} else revealItems.forEach(item => item.classList.add('is-visible'));

const progressBar = $('#scroll-progress');
let scrollScheduled = false;
window.addEventListener('scroll', () => {
  if (scrollScheduled) return;
  scrollScheduled = true;
  requestAnimationFrame(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = `${maxScroll > 0 ? Math.min(100, window.scrollY / maxScroll * 100) : 0}%`;
    scrollScheduled = false;
  });
}, { passive: true });

// Perfiles de futuros estudiantes. Ejemplos orientativos, no requisitos formales.
const profiles = {
  curioso: { index: '01', title: 'Explorador/a digital', description: 'Te encanta descubrir cómo funcionan las tecnologías y buscar nuevas soluciones. En TIC podés convertir esa curiosidad en experiencias para enseñar.', image: 'assets/robot-academia.webp', alt: 'Robot curioso con una computadora' },
  creativo: { index: '02', title: 'Creador/a de ideas', description: 'Disfrutás inventar, diseñar, producir contenidos y probar herramientas digitales. Acá la creatividad se combina con objetivos educativos.', image: 'assets/ideas-tic.webp', alt: 'Bombilla de ideas tecnológicas' },
  docente: { index: '03', title: 'Futuro/a docente', description: 'Te entusiasma compartir conocimientos, acompañar a otros y hacer que aprender sea una experiencia significativa.', image: 'assets/aula-tic.webp', alt: 'Docente y estudiantes en un aula con computadoras' },
  transformador: { index: '04', title: 'Impulsor/a del cambio', description: 'Creés que la tecnología puede ayudar a mejorar la educación. Vas a poder diseñar proyectos y soluciones para contextos diversos.', image: 'assets/universo-digital.webp', alt: 'Tecnologías digitales conectadas' }
};
$$('[data-profile]').forEach(button => button.addEventListener('click', () => {
  const profile = profiles[button.dataset.profile];
  $$('[data-profile]').forEach(item => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
  $('#profile-result').innerHTML = `<div class="profile-art"><img src="${profile.image}" alt="${profile.alt}" width="235" height="235" loading="lazy"></div><span class="tag">TU PERFIL / ${profile.index}</span><h3>${profile.title}</h3><p>${profile.description}</p><span class="profile-foot">TODOS LOS CAMINOS PUEDEN LLEVAR A TIC ✳</span>`;
}));

// EXPLORADOR DE CORRELATIVIDADES.
// Requisitos cA/cR/rA tomados directamente del HTML original compartido.
const subjects = Array.isArray(window.TIC_MATERIAS) ? window.TIC_MATERIAS : [];
const subjectById = new Map(subjects.map(s => [Number(s.id), s]));
const yearNames = { 1: '1.º año', 2: '2.º año', 3: '3.º año', 4: '4.º año' };
const state = { year: '1', query: '', activeId: null, previousId: null };
const listEl = $('#subjects-list');
const searchEl = $('#subject-search');

function cleanSearch(str) { return String(str).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
function safeText(str) { return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function setYear(year, { clearSearch = false } = {}) {
  state.year = year;
  state.activeId = null;
  state.previousId = null;
  if (clearSearch) { searchEl.value = ''; state.query = ''; }
  renderSubjects();
}
$$('.year-btn').forEach(button => button.addEventListener('click', () => setYear(button.dataset.year, { clearSearch: true })));
searchEl.addEventListener('input', () => { state.query = cleanSearch(searchEl.value); state.activeId = null; state.previousId = null; renderSubjects(); });

function getVisibleSubjects() {
  return subjects.filter(item => {
    const matchesYear = state.query || state.year === 'all' || String(item.year) === state.year;
    const matchesQuery = !state.query || cleanSearch(`${item.name} ${item.id} ${item.field} ${yearNames[item.year]}`).includes(state.query);
    return matchesYear && matchesQuery;
  });
}
function requirementChips(ids, style) {
  if (!ids.length) return '<p>No se indican materias previas.</p>';
  return `<div class="req-chips">${ids.map(id => {
    const s = subjectById.get(Number(id));
    return s ? `<button type="button" class="req-chip ${style}" data-jump="${s.id}" title="Ir a ${safeText(s.name)}"><span class="req-id">#${s.id}</span> ${safeText(s.name)} ↗</button>` : '';
  }).join('')}</div>`;
}
function detailMarkup(subject) {
  const req = subject.requirements;
  // El HTML original incluye algunos IDs tanto en 'aprobadas' como 'regulares'.
  // Cuando ya debe estar aprobada, no repetirla como mera regular en pantalla.
  const approved = [...new Set(req.cA.map(Number))];
  const regular = [...new Set(req.cR.map(Number))].filter(id => !approved.includes(id));
  const finals = [...new Set(req.rA.map(Number))];
  const previous = state.previousId && state.previousId !== subject.id ? subjectById.get(state.previousId) : null;
  const backButton = previous ? `<button type="button" class="subject-back" data-back="${previous.id}" aria-label="Volver a ${safeText(previous.name)}">← Volver a ${safeText(previous.name)}</button>` : '';
  return `<div class="subject-body" id="details-${subject.id}">${backButton}<div class="subject-meta"><span>${safeText(subject.field)}</span><span>${safeText(subject.regime)}</span><span>${subject.hours} h cátedra</span><span>${safeText(subject.accreditation)}</span></div>
  <div class="req-block"><h4>Para cursar · tener aprobadas</h4>${requirementChips(approved, 'approved')}</div>
  <div class="req-block"><h4>Para cursar · tener regulares</h4>${requirementChips(regular, 'regular')}</div>
  <div class="req-block"><h4>Para rendir / promocionar · tener aprobadas</h4>${requirementChips(finals, 'exam')}</div></div>`;
}
function renderSubjects() {
  $$('.year-btn').forEach(button => { const active = !state.query && state.year === button.dataset.year; button.classList.toggle('is-active',active); button.setAttribute('aria-pressed',String(active)); });
  const visible = getVisibleSubjects();
  $('#subject-count').textContent = `${visible.length} ${visible.length === 1 ? 'materia' : 'materias'}`;
  if (!subjects.length) { listEl.innerHTML = '<div class="empty-subjects">No se pudo cargar el plan. Revisá los archivos de la carpeta assets.</div>'; return; }
  if (!visible.length) { listEl.innerHTML = '<div class="empty-subjects">No encontramos materias con ese nombre. Probá otra búsqueda.</div>'; return; }
  const selected = state.activeId == null ? null : subjectById.get(state.activeId);
  const a = selected ? new Set(selected.requirements.cA.map(Number)) : new Set();
  const r = selected ? new Set(selected.requirements.cR.map(Number)) : new Set();
  listEl.innerHTML = visible.map(s => {
    const open = state.activeId === s.id;
    const cls = [open ? 'is-open is-selected' : '', a.has(s.id) ? 'is-req-approved' : '', !a.has(s.id) && r.has(s.id) ? 'is-req-regular' : ''].filter(Boolean).join(' ');
    return `<article class="subject-item ${cls}" id="subject-${s.id}"><button type="button" class="subject-head" data-open="${s.id}" aria-expanded="${open}" aria-controls="details-${s.id}"><span class="subject-number">${s.id}</span><span class="subject-main"><strong>${safeText(s.name)}</strong><small>${yearNames[s.year]} · ${safeText(s.format)} · ${s.hours} h cátedra</small></span><span class="subject-expand"><svg class="ico"><use href="#i-chevron"/></svg></span></button>${open ? detailMarkup(s) : `<div id="details-${s.id}" hidden></div>`}</article>`;
  }).join('');
}
function navigateToSubject(id) {
  const subject = subjectById.get(id);
  if (!subject) return;
  state.previousId = state.activeId && state.activeId !== id ? state.activeId : state.previousId;
  state.year = String(subject.year);
  state.query = '';
  searchEl.value = '';
  state.activeId = id;
  renderSubjects();
  const target = $(`#subject-${id}`);
  if (target) {
    target.scrollIntoView({ behavior: scrollBehavior, block: 'center' });
    // Avoid stealing screen-reader focus through a changing container when possible.
    const button = $('.subject-head', target);
    if (button) { button.focus({ preventScroll: true }); }
  }
}
listEl.addEventListener('click', e => {
  const back = e.target.closest('[data-back]');
  if (back) { const id = Number(back.dataset.back); state.previousId = null; navigateToSubject(id); return; }
  const jump = e.target.closest('[data-jump]');
  if (jump) { navigateToSubject(Number(jump.dataset.jump)); return; }
  const head = e.target.closest('[data-open]');
  if (!head) return;
  const id = Number(head.dataset.open);
  state.activeId = state.activeId === id ? null : id;
  state.previousId = null;
  renderSubjects();
  const newHead = $(`#subject-${id} .subject-head`);
  if (newHead) newHead.focus({ preventScroll: true });
});
renderSubjects();

// Lista de inscripción: estado local de la visita, sin registro ni servidor.
const checkboxes = $$('#checklist-items input[type="checkbox"]');
function updateChecklist() {
  const complete = checkboxes.filter(checkbox => checkbox.checked).length;
  $('#checklist-count').textContent = complete;
  $('#checklist-progress').style.width = `${complete / checkboxes.length * 100}%`;
}
checkboxes.forEach(checkbox => checkbox.addEventListener('change', updateChecklist));
updateChecklist();

// Visor de imágenes con elementos nativos del navegador.
const galleryButtons = $$('.gallery-card');
const modal = $('#image-dialog');
const modalImage = $('#dialog-image');
let galleryIndex = 0;
function showGalleryImage(index) {
  galleryIndex = (index + galleryButtons.length) % galleryButtons.length;
  const source = galleryButtons[galleryIndex];
  modalImage.src = source.dataset.full;
  modalImage.alt = source.dataset.alt;
  $('#dialog-caption').textContent = source.dataset.alt;
  $('#dialog-counter').textContent = `${galleryIndex + 1} / ${galleryButtons.length}`;
}
galleryButtons.forEach((button,i) => button.addEventListener('click', () => { showGalleryImage(i); if (!modal.open) modal.showModal(); }));
$('#dialog-close').addEventListener('click', () => modal.close());
$('#dialog-prev').addEventListener('click', () => showGalleryImage(galleryIndex - 1));
$('#dialog-next').addEventListener('click', () => showGalleryImage(galleryIndex + 1));
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
modal.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); showGalleryImage(galleryIndex - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); showGalleryImage(galleryIndex + 1); }
});


// En el visor móvil, deslizar lateralmente cambia de imagen sin impedir el scroll vertical.
let touchStartPoint = null;
modalImage.addEventListener('touchstart', event => {
  if (event.touches.length !== 1) { touchStartPoint = null; return; }
  touchStartPoint = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}, { passive: true });
modalImage.addEventListener('touchend', event => {
  if (!touchStartPoint || !event.changedTouches.length) return;
  const dx = event.changedTouches[0].clientX - touchStartPoint.x;
  const dy = event.changedTouches[0].clientY - touchStartPoint.y;
  touchStartPoint = null;
  if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.3) showGalleryImage(galleryIndex + (dx < 0 ? 1 : -1));
}, { passive: true });
