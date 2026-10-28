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
$$('[data-year]').forEach(button => button.addEventListener('click', () => setYear(button.dataset.year, { clearSearch: true })));
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
  $$('[data-year]').forEach(button => { const active = !state.query && state.year === button.dataset.year; button.classList.toggle('is-active',active); button.setAttribute('aria-pressed',String(active)); });
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

// EXPLORADOR DE COMPETENCIAS E INCUMBENCIAS DOCENTES (Resoluciones N.º 3959-E-24 y N.º 141-E-26).
const competencies = [
  // BACHILLERATOS ORIENTADOS (16 espacios)
  { id: 1, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Bachiller en Informática', name: 'Tecnología de los Sistemas Informáticos', course: '3.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 11134-E-18)', note: 'Competencia Docente titular para el dictado del espacio curricular en Nivel Secundario.' },
  { id: 2, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Bachiller en Informática', name: 'Ciencia, Tecnología y Sociedad', course: '3.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 11134-E-18)', note: 'Competencia Docente para el abordaje crítico, reflexivo y social de las tecnologías.' },
  { id: 3, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Bachiller en Informática', name: 'Sistemas Digitales de Información', course: '4.º año', role: 'DOCENTE', res: 'Res. N.º 141-E-26 (Art. 1.º y 2.º) y Res. N.º 3959-E-24', note: 'Único título que acredita plena competencia DOCENTE en este espacio (las demás titulaciones revisten carácter Habilitante).' },
  { id: 4, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Bachiller en Informática', name: 'Tecnología de la Conectividad, Investigación y Desarrollo', course: '4.º año', role: 'DOCENTE', res: 'Res. N.º 141-E-26 (Art. 1.º y 2.º) y Res. N.º 3959-E-24', note: 'Único título que acredita plena competencia DOCENTE en este espacio (las demás titulaciones revisten carácter Habilitante).' },
  { id: 5, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Bachiller en Informática', name: 'Seguridad y Legislación en Informática', course: '4.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 11134-E-18)', note: 'Competencia Docente para la cobertura del espacio en el Ciclo Orientado.' },
  { id: 6, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Bachiller en Informática', name: 'Tecnología del Software Libre', course: '5.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 11134-E-18)', note: 'Competencia Docente para la cobertura del espacio en el Ciclo Orientado.' },
  { id: 7, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Bachiller en Informática', name: 'Programación', course: '5.º año', role: 'DOCENTE', res: 'Rectificado por Res. N.º 141-E-26 (Anexo Único)', note: 'Denominación adecuada a la Estructura Curricular vigente con alcance de competencia Docente.' },
  { id: 8, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Bachiller en Informática', name: 'Diseño y Desarrollo Web', course: '5.º año', role: 'HABILITANTE', res: 'Rectificado por Res. N.º 141-E-26 (Anexo Único)', note: 'Denominación adecuada a la Estructura Curricular vigente con carácter Habilitante.' },
  { id: 9, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Bachiller en Informática', name: 'Proyecto Tecnológico en Informática', course: '5.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 11134-E-18)', note: 'Competencia Docente para formulación y gestión de proyectos tecnológicos escolares.' },
  { id: 10, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Bachiller en Comunicación', name: 'Producción Audiovisual', course: '3.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 11134-E-18)', note: 'Competencia Habilitante en el Ciclo Orientado en Comunicación.' },
  { id: 11, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Bachiller en Comunicación', name: 'Taller de Producción Gráfica y Digital', course: '4.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 11134-E-18)', note: 'Competencia Docente para producción gráfica y medios digitales.' },
  { id: 12, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Bachiller en Comunicación', name: 'Producción y Gestión de la Comunicación', course: '5.º año', role: 'DOCENTE', res: 'Rectificado por Res. N.º 141-E-26 (Anexo Único)', note: 'Denominación rectificada (antes Planificación, Producción y Gestión de la Comunicación Digital) con competencia Docente.' },
  { id: 13, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Robótica y Programación', name: 'Introducción a la Programación', course: '3.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 182-E-19)', note: 'Competencia Habilitante en el Bachillerato Orientado en Robótica y Programación.' },
  { id: 14, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Robótica y Programación', name: 'Arte Multimedial', course: '3.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 182-E-19)', note: 'Competencia Habilitante en el Bachillerato Orientado en Robótica y Programación.' },
  { id: 15, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Robótica y Programación', name: 'Sistemas de Comunicación', course: '4.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 182-E-19)', note: 'Competencia Docente en el Bachillerato Orientado en Robótica y Programación.' },
  { id: 16, category: 'bachiller', modality: 'Bachillerato Orientado', orientation: 'Ciencias Naturales', name: 'Biotecnología', course: '5.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 11134-E-18)', note: 'Competencia Habilitante en el Bachillerato Orientado en Ciencias Naturales.' },

  // EDUCACIÓN PARA JÓVENES Y ADULTOS - EPJA (3 espacios)
  { id: 17, category: 'epja', modality: 'Jóvenes y Adultos (EPJA)', orientation: 'Ciclo Básico · Ciudadanía', name: 'Educación Digital', course: '1.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 13995-E-19)', note: 'Competencia Docente para el Universo Situacional Ciudadanía (Ciclo Básico EPJA).' },
  { id: 18, category: 'epja', modality: 'Jóvenes y Adultos (EPJA)', orientation: 'Ciclo Orientado · Comunicación, Cultura y Autonomía', name: 'Taller de Producción Gráfica y Digital', course: '1.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 13995-E-19)', note: 'Competencia Docente para el Universo Situacional Comunicación, Cultura y Autonomía.' },
  { id: 19, category: 'epja', modality: 'Jóvenes y Adultos (EPJA)', orientation: 'Ciclo Orientado · Comunicación, Cultura y Autonomía', name: 'Educación Digital', course: '1.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 13995-E-19)', note: 'Competencia Docente para el Ciclo de Orientación en la modalidad EPJA.' },

  // ESCUELAS TÉCNICAS Y AGROTÉCNICAS (34 espacios)
  { id: 20, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Taller de Informática I', course: '1.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Habilitante en formación técnica informática de 1.º año.' },
  { id: 21, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Taller de Informática II', course: '2.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Habilitante en formación técnica informática de 2.º año.' },
  { id: 22, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Taller de Informática III', course: '3.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Habilitante en formación técnica informática de 3.º año.' },
  { id: 23, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Introducción a la Programación', course: '3.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Habilitante en la especialidad Informática Personal y Profesional.' },
  { id: 24, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Instalación de Software', course: '3.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Docente en Escuelas de Educación Técnica.' },
  { id: 25, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Legislación Informática', course: '4.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Habilitante en la especialidad Informática Personal y Profesional.' },
  { id: 26, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Sistemas Digitales', course: '4.º año', role: 'DOCENTE', res: 'Rectificado por Res. N.º 141-E-26 (Anexo Único)', note: 'Denominación rectificada (antes Sistemas Digitales de Información) con competencia Docente.' },
  { id: 27, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Programación I', course: '4.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Habilitante en la especialidad Informática Personal y Profesional.' },
  { id: 28, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Mantenimiento de Software', course: '4.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Docente en Escuelas de Educación Técnica.' },
  { id: 29, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Asistencia sobre Utilitarios', course: '4.º año', role: 'DOCENTE', res: 'Rectificado por Res. N.º 141-E-26 (Anexo Único)', note: 'Denominación rectificada (antes Asistencia de Utilitarios) con competencia Docente.' },
  { id: 30, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Instalación de Hardware Monousuario', course: '4.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Docente en Escuelas de Educación Técnica.' },
  { id: 31, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Estructura de Datos', course: '4.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Habilitante en la especialidad Informática Personal y Profesional.' },
  { id: 32, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Mantenimiento Hardware Monousuario', course: '5.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Docente en Escuelas de Educación Técnica.' },
  { id: 33, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Mantenimiento y Reparación de Datos', course: '5.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Habilitante en la especialidad Informática Personal y Profesional.' },
  { id: 34, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Configuración y Adaptación del Sistema Operativo', course: '5.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Docente en Escuelas de Educación Técnica.' },
  { id: 35, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Programación II', course: '5.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Habilitante en la especialidad Informática Personal y Profesional.' },
  { id: 36, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Instalación y Administración de Redes Locales y Extendidas', course: '5.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Docente en Escuelas de Educación Técnica.' },
  { id: 37, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Asistencia sobre Aplicaciones Específicas', course: '5.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Docente en Escuelas de Educación Técnica.' },
  { id: 38, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Organización y Planeamiento de Emprendimientos Informáticos', course: '6.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Habilitante en 6.º año de la especialidad Informática.' },
  { id: 39, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Adaptación y Complementación de Programas', course: '6.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Docente en 6.º año de Escuelas de Educación Técnica.' },
  { id: 40, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Seguridad Informática', course: '6.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Docente en 6.º año de Escuelas de Educación Técnica.' },
  { id: 41, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Programación III', course: '6.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Habilitante en 6.º año de la especialidad Informática.' },
  { id: 42, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Adaptación del Ambiente de Trabajo', course: '6.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Docente en 6.º año de Escuelas de Educación Técnica.' },
  { id: 43, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Administración y Mantenimiento de Redes Locales y Extendidas', course: '6.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Docente en 6.º año de Escuelas de Educación Técnica.' },
  { id: 44, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Informática Personal y Profesional', name: 'Sistemas de Información', course: '6.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 054-E-11)', note: 'Competencia Habilitante en 6.º año de la especialidad Informática.' },
  { id: 45, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Equipos e Instalaciones Electromecánicas', name: 'Procesos Productivos', course: '5.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 1703-E-12)', note: 'Competencia Habilitante en la especialidad Equipos e Instalaciones Electromecánicas.' },
  { id: 46, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Electrónica', name: 'Técnicas Digitales I', course: '4.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 1699-E-12)', note: 'Competencia Habilitante en la especialidad Electrónica.' },
  { id: 47, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Electrónica', name: 'Comunicaciones y Enlaces I', course: '4.º año', role: 'HABILITANTE', res: 'Rectificado por Res. N.º 141-E-26 (Anexo Único)', note: 'Denominación rectificada (antes Comunicación y Enlace) con competencia Habilitante.' },
  { id: 48, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Electrónica', name: 'Técnicas Digitales II', course: '5.º año', role: 'HABILITANTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 1699-E-12)', note: 'Competencia Habilitante en la especialidad Electrónica.' },
  { id: 49, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Técnico en Electrónica', name: 'Comunicaciones y Enlaces II', course: '5.º año', role: 'HABILITANTE', res: 'Rectificado por Res. N.º 141-E-26 (Anexo Único)', note: 'Denominación y curso rectificados (5.º año) con competencia Habilitante.' },
  { id: 50, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Gestión y Administración de las Organizaciones', name: 'Informática para la Gestión', course: '4.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 3151-1983)', note: 'Competencia Docente en la especialidad Gestión y Administración de las Organizaciones.' },
  { id: 51, category: 'tecnica', modality: 'Escuela Técnica', orientation: 'Gestión y Administración de las Organizaciones', name: 'Informática Aplicada al Diseño', course: '5.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 3151-1983)', note: 'Competencia Docente en la especialidad Gestión y Administración de las Organizaciones.' },
  { id: 52, category: 'tecnica', modality: 'Escuela Agrotécnica', orientation: 'Técnico en Producción Agropecuaria', name: 'Tecnología de la Información y la Comunicación I', course: '1.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 1704-E-12)', note: 'Competencia Docente en Escuelas Agrotécnicas (Producción Agropecuaria).' },
  { id: 53, category: 'tecnica', modality: 'Escuela Agrotécnica', orientation: 'Técnico en Producción Agropecuaria', name: 'Tecnología de la Información y la Comunicación II', course: '2.º año', role: 'DOCENTE', res: 'Res. N.º 3959-E-24 (Diseño Res. N.º 1704-E-12)', note: 'Competencia Docente en Escuelas Agrotécnicas (Producción Agropecuaria).' }
];

const compState = { filter: 'bachiller', query: '', activeId: null };
const compListEl = $('#comp-list');
const compSearchEl = $('#comp-search');
const compCountEl = $('#comp-count');

function getVisibleCompetencies() {
  return competencies.filter(item => {
    const matchesFilter = compState.query || compState.filter === 'all' || (compState.filter === 'docente' ? item.role === 'DOCENTE' : item.category === compState.filter);
    const matchesQuery = !compState.query || cleanSearch(`${item.name} ${item.orientation} ${item.modality} ${item.course} ${item.role} ${item.res}`).includes(compState.query);
    return matchesFilter && matchesQuery;
  });
}

function compDetailMarkup(item) {
  const badgeStyle = item.role === 'DOCENTE' ? 'approved' : 'regular';
  return `<div class="subject-body" id="comp-details-${item.id}">
    <div class="subject-meta">
      <span>${safeText(item.modality)}</span>
      <span>${safeText(item.course)}</span>
      <span>${safeText(item.res)}</span>
    </div>
    <div class="req-block">
      <h4>Orientación / Especialidad</h4>
      <div class="req-chips"><span class="req-chip exam">${safeText(item.orientation)}</span></div>
    </div>
    <div class="req-block">
      <h4>Alcance de competencia y normativa</h4>
      <div class="req-chips"><span class="req-chip ${badgeStyle}">Carácter ${safeText(item.role)}</span></div>
      <p style="margin-top:8px">${safeText(item.note)}</p>
    </div>
  </div>`;
}

function renderCompetencies() {
  if (!compListEl) return;
  $$('[data-comp-filter]').forEach(button => {
    const active = !compState.query && compState.filter === button.dataset.compFilter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const visible = getVisibleCompetencies();
  compCountEl.textContent = `${visible.length} ${visible.length === 1 ? 'espacio' : 'espacios'}`;
  if (!visible.length) {
    compListEl.innerHTML = '<div class="empty-subjects">No encontramos espacios curriculares con ese criterio. Probá otra búsqueda.</div>';
    return;
  }
  compListEl.innerHTML = visible.map(item => {
    const open = compState.activeId === item.id;
    const roleClass = item.role === 'DOCENTE' ? 'is-req-approved' : 'is-req-regular';
    const badgeClass = item.role === 'DOCENTE' ? 'is-docente' : 'is-habilitante';
    const cls = [open ? 'is-open is-selected' : '', roleClass].filter(Boolean).join(' ');
    return `<article class="subject-item ${cls}" id="comp-item-${item.id}">
      <button type="button" class="subject-head" data-comp-open="${item.id}" aria-expanded="${open}" aria-controls="comp-details-${item.id}">
        <span class="subject-number">${item.id}</span>
        <span class="subject-main">
          <strong>${safeText(item.name)}</strong>
          <small>${safeText(item.orientation)} · ${safeText(item.course)}</small>
        </span>
        <span class="comp-role-badge ${badgeClass}">${safeText(item.role)}</span>
        <span class="subject-expand"><svg class="ico"><use href="#i-chevron"/></svg></span>
      </button>
      ${open ? compDetailMarkup(item) : `<div id="comp-details-${item.id}" hidden></div>`}
    </article>`;
  }).join('');
}

if (compListEl && compSearchEl) {
  $$('[data-comp-filter]').forEach(button => button.addEventListener('click', () => {
    compState.filter = button.dataset.compFilter;
    compState.activeId = null;
    compState.query = '';
    compSearchEl.value = '';
    renderCompetencies();
  }));
  compSearchEl.addEventListener('input', () => {
    compState.query = cleanSearch(compSearchEl.value);
    compState.activeId = null;
    renderCompetencies();
  });
  compListEl.addEventListener('click', e => {
    const head = e.target.closest('[data-comp-open]');
    if (!head) return;
    const id = Number(head.dataset.compOpen);
    compState.activeId = compState.activeId === id ? null : id;
    renderCompetencies();
    const newHead = $(`#comp-item-${id} .subject-head`);
    if (newHead) newHead.focus({ preventScroll: true });
  });
  renderCompetencies();
}

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
