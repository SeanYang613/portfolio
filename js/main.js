'use strict';

// ============================================================
//  STATE
// ============================================================
let state = 'menu';   // 'menu' | 'opening' | 'reading'
let activeTarget = null;

const desk    = document.getElementById('desk');
const overlay = document.getElementById('letterOverlay');
const envEls  = [...document.querySelectorAll('.env')];

// ============================================================
//  FAN — click to open, keyboard navigation
// ============================================================
function initFan() {
  envEls.forEach(env => {
    env.addEventListener('click', () => {
      if (state !== 'menu') return;
      openLetter(env.dataset.target, env);
    });

    env.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (state !== 'menu') return;
        openLetter(env.dataset.target, env);
      }
    });
  });
}

// ============================================================
//  OVERLAY ORIGIN — scale from the clicked envelope's centre
// ============================================================
function setOverlayOriginFrom(envEl) {
  const deskRect = desk.getBoundingClientRect();
  const envRect  = envEl.getBoundingClientRect();
  const ox = ((envRect.left + envRect.width  / 2) - deskRect.left) / deskRect.width  * 100;
  const oy = ((envRect.top  + envRect.height / 2) - deskRect.top)  / deskRect.height * 100;
  overlay.style.setProperty('--ox', ox + '%');
  overlay.style.setProperty('--oy', oy + '%');
}

// ============================================================
//  OPEN LETTER
// ============================================================
function openLetter(target, envEl) {
  state = 'opening';
  activeTarget = target;

  // Mark envelope active (flap opens + letter peeks)
  envEls.forEach(e => e.classList.toggle('active', e === envEl));
  desk.classList.add('overlay-open');

  setOverlayOriginFrom(envEl);

  // After flap + peek animation, show overlay
  setTimeout(() => {
    // Show correct letter content
    document.querySelectorAll('.letter-content').forEach(lc => {
      lc.classList.toggle('active', lc.dataset.letter === target);
    });

    // Restart CSS animation
    overlay.style.animation = 'none';
    overlay.removeAttribute('hidden');
    void overlay.offsetWidth;
    overlay.style.animation = '';

    state = 'reading';

    // Render dynamic content
    if (target === 'about')    setTimeout(animateCounters, 350);
    if (target === 'projects') renderProjects();
    if (target === 'wine')     renderWineNotes();
    if (target === 'timeline') renderTimeline();
  }, 300);
}

// ============================================================
//  CLOSE LETTER
// ============================================================
function closeLetter() {
  if (state !== 'reading') return;
  state = 'opening';

  overlay.classList.add('closing');

  overlay.addEventListener('animationend', function handler() {
    overlay.removeEventListener('animationend', handler);
    overlay.setAttribute('hidden', '');
    overlay.classList.remove('closing');
    overlay.style.animation = '';
    envEls.forEach(e => e.classList.remove('active'));
    desk.classList.remove('overlay-open');
    state = 'menu';
    activeTarget = null;
  }, { once: true });
}

document.getElementById('letterClose').addEventListener('click', closeLetter);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLetter();
});

// ============================================================
//  RENDER PROJECTS
// ============================================================
let projectsRendered = false;

function renderProjects() {
  if (projectsRendered) return;
  projectsRendered = true;

  const grid = document.getElementById('projectsGrid');
  const bar  = document.getElementById('filterBar');
  const cats = ['All', ...new Set(PROJECTS.map(p => p.category))];

  bar.innerHTML = cats.map(c =>
    `<button class="filter-btn${c === 'All' ? ' active' : ''}" data-filter="${c}">${c}</button>`
  ).join('');

  grid.innerHTML = PROJECTS.map(p => `
    <article class="project-card" data-category="${p.category}">
      <div class="project-thumb">
        ${p.image
          ? `<img src="${p.image}" alt="${p.title}" loading="lazy"/>`
          : '<span>No Preview</span>'}
      </div>
      <div class="project-body">
        <div class="project-tags">${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}</div>
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="project-links">
          ${p.demoUrl   ? `<a href="${p.demoUrl}"   class="project-link" target="_blank" rel="noopener">Live Demo</a>` : ''}
          ${p.githubUrl ? `<a href="${p.githubUrl}" class="project-link" target="_blank" rel="noopener">GitHub</a>`   : ''}
        </div>
      </div>
    </article>`).join('');

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    grid.querySelectorAll('.project-card').forEach(card =>
      card.classList.toggle('hidden', f !== 'All' && card.dataset.category !== f)
    );
  });
}

// ============================================================
//  RENDER WINE NOTES
// ============================================================
let wineRendered = false;

function renderWineNotes() {
  if (wineRendered) return;
  wineRendered = true;

  const journal = document.getElementById('wineJournal');
  journal.innerHTML = WINE_NOTES.map(w => `
    <div class="wine-entry">
      <div class="we-vintage">${w.vintage}</div>
      <div class="we-name">${w.name}</div>
      <p class="we-note">${w.note}</p>
      <div class="we-tags">${w.tags.map(t => `<span class="we-tag">${t}</span>`).join('')}</div>
    </div>`).join('');
}

// ============================================================
//  RENDER TIMELINE
// ============================================================
let timelineRendered = false;

function renderTimeline() {
  if (timelineRendered) return;
  timelineRendered = true;

  const tl = document.getElementById('timeline');
  tl.innerHTML = TIMELINE.map(t => `
    <div class="tl-item${t.highlight ? ' highlight' : ''}">
      <div class="tl-date">${t.date}</div>
      <div class="tl-role">${t.role}</div>
      <div class="tl-org">${t.org}</div>
      <p class="tl-desc">${t.desc}</p>
    </div>`).join('');
}

// ============================================================
//  STAT COUNTERS
// ============================================================
function animateCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    let cur = 0;
    const step = Math.ceil(target / 25);
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      el.textContent = cur;
      if (cur >= target) clearInterval(t);
    }, 50);
  });
}

// ============================================================
//  CONTACT FORM
// ============================================================
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  document.getElementById('formStatus').textContent = 'Thanks for your message! I\'ll get back to you soon.';
  e.target.reset();
  setTimeout(() => { document.getElementById('formStatus').textContent = ''; }, 5000);
});

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initFan();
});
