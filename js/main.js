'use strict';

// ============================================================
//  STATE
// ============================================================
// 'menu'    → envelope stack visible
// 'flying'  → envelope is animating open
// 'reading' → letter page is open
let state = 'menu';
let activeTarget = null;
let activeEnvIdx = 0;

// ============================================================
//  ENVELOPE STACK — scroll/swipe cycles, hover peeks, click opens
// ============================================================

const STACK_POS = [
  { x:   0, y:   0, rot:  0,   z: 40 },  // front
  { x:   8, y:   9, rot:  2.8, z: 30 },
  { x:  -5, y:  16, rot: -2.2, z: 20 },
  { x:  10, y:  22, rot:  4.0, z: 10 },
];

function updateStack() {
  document.querySelectorAll('.stack-env').forEach((env, i) => {
    const posIdx = ((i - activeEnvIdx) % 4 + 4) % 4;
    const p = STACK_POS[posIdx];
    env.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
    env.style.zIndex    = p.z;
    env.classList.toggle('is-front', posIdx === 0);
  });
  document.querySelectorAll('.stack-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === activeEnvIdx);
  });
}

function initStack() {
  updateStack();

  // ── Scroll: cycle envelopes ───────────────────────────────
  let scrollLocked = false;
  document.addEventListener('wheel', e => {
    if (state !== 'menu') return;
    e.preventDefault();
    if (scrollLocked) return;
    scrollLocked = true;
    activeEnvIdx = e.deltaY > 0
      ? (activeEnvIdx + 1) % 4
      : (activeEnvIdx - 1 + 4) % 4;
    updateStack();
    setTimeout(() => { scrollLocked = false; }, 420);
  }, { passive: false });

  // ── Touch swipe: cycle envelopes ─────────────────────────
  let touchY = 0;
  document.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (state !== 'menu') return;
    const dy = touchY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) {
      activeEnvIdx = dy > 0
        ? (activeEnvIdx + 1) % 4
        : (activeEnvIdx - 1 + 4) % 4;
      updateStack();
    }
  }, { passive: true });

  // ── Click: cycle if not front, open if front ─────────────
  document.querySelectorAll('.stack-env').forEach(env => {
    env.addEventListener('click', () => {
      if (state !== 'menu') return;
      if (!env.classList.contains('is-front')) {
        activeEnvIdx = [...document.querySelectorAll('.stack-env')].indexOf(env);
        updateStack();
        return;
      }
      state = 'flying';
      const target = env.dataset.target;
      const seEnv  = env.querySelector('.se-env');
      document.getElementById('siteHeader').classList.add('hidden');
      document.getElementById('envStack').classList.add('hidden');
      document.getElementById('stackDots').classList.add('hidden');
      openEnvelope(seEnv, () => {
        openLetter(target);
        state = 'reading';
        activeTarget = target;
      });
    });
  });
}

// ============================================================
//  OPEN ENVELOPE  — 2-phase animation
//
//  Phase 1 (180ms): lift + scale from stack envelope to full size
//  Phase 2 (650ms): flap folds open (3D)
//  Phase 3 (320ms): expand to fill the viewport
// ============================================================
async function openEnvelope(seEnv, onDone) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onDone();
    return;
  }

  const rect = seEnv.getBoundingClientRect();

  // Target full envelope size (centered)
  const ENV_W = Math.min(520, window.innerWidth  * 0.86);
  const ENV_H = Math.round(ENV_W * 0.66);
  const ex    = (window.innerWidth  - ENV_W) / 2;
  const ey    = (window.innerHeight - ENV_H) / 2;

  // Build the animation envelope
  const env = document.createElement('div');
  env.className = 'anim-env';
  env.innerHTML = `
    <div class="anim-flap-wrap">
      <div class="anim-flap">
        <div class="anim-flap-face anim-flap-front"></div>
        <div class="anim-flap-face anim-flap-back"></div>
      </div>
    </div>
    <div class="anim-body"></div>`;

  // Start at the stack envelope's exact position and size
  Object.assign(env.style, {
    left:   `${rect.left}px`,
    top:    `${rect.top}px`,
    width:  `${rect.width}px`,
    height: `${rect.height}px`,
  });
  document.body.appendChild(env);

  // ── Phase 1: lift to centre, grow to full envelope ────────
  await raf2();
  Object.assign(env.style, {
    transition: [
      'left   0.22s cubic-bezier(0.22, 1, 0.36, 1)',
      'top    0.22s cubic-bezier(0.22, 1, 0.36, 1)',
      'width  0.22s cubic-bezier(0.22, 1, 0.36, 1)',
      'height 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
    ].join(','),
    left:   `${ex}px`,
    top:    `${ey}px`,
    width:  `${ENV_W}px`,
    height: `${ENV_H}px`,
  });

  await wait(280);

  // ── Phase 2: flap folds back ──────────────────────────────
  env.querySelector('.anim-flap').classList.add('open');

  await wait(730);

  // ── Phase 3: fill the screen ──────────────────────────────
  Object.assign(env.style, {
    transition: [
      'left          0.32s ease-in',
      'top           0.32s ease-in',
      'width         0.32s ease-in',
      'height        0.32s ease-in',
      'border-radius 0.22s ease-in',
      'box-shadow    0.22s ease-in',
    ].join(','),
    left:         '0',
    top:          '0',
    width:        '100vw',
    height:       '100vh',
    borderRadius: '0',
    boxShadow:    'none',
  });

  await wait(350);
  env.remove();
  onDone();
}

function raf2() {
  return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}
function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================================
//  OPEN / CLOSE LETTER PAGES
// ============================================================
function openLetter(target) {
  const page = document.getElementById(`letter-${target}`);
  if (!page) return;
  page.style.transition = 'none';
  document.body.classList.add('reading');
  page.classList.add('active');
  requestAnimationFrame(() => { page.style.transition = ''; });
  if (target === 'skills')   renderSkills();
  if (target === 'projects') renderProjects();
  if (target === 'about')    setTimeout(animateCounters, 300);
}

function closeLetter() {
  if (state !== 'reading') return;
  const page = document.getElementById(`letter-${activeTarget}`);
  if (page) page.classList.remove('active');
  document.body.classList.remove('reading');
  document.getElementById('siteHeader').classList.remove('hidden');
  document.getElementById('envStack').classList.remove('hidden');
  document.getElementById('stackDots').classList.remove('hidden');
  state = 'menu';
  activeTarget = null;
}

document.querySelectorAll('[data-back]').forEach(btn =>
  btn.addEventListener('click', closeLetter)
);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLetter(); return; }
  if (state !== 'menu') return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    activeEnvIdx = (activeEnvIdx + 1) % 4;
    updateStack();
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    activeEnvIdx = (activeEnvIdx - 1 + 4) % 4;
    updateStack();
  } else if (e.key === 'Enter') {
    document.querySelector('.stack-env.is-front')?.click();
  }
});

// ============================================================
//  RENDER SKILLS (from data.js)
// ============================================================
function renderSkills() {
  const grid = document.getElementById('skillsGrid');
  if (!grid || grid.children.length > 0) return;
  grid.innerHTML = SKILLS.map(g => `
    <div class="skill-cat">
      <h3>${g.category}</h3>
      <div class="skill-tags">
        ${g.items.map(s => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
    </div>`).join('');
}

// ============================================================
//  RENDER PROJECTS (from data.js)
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
        ${p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy"/>` : '<span>No Preview</span>'}
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
  document.getElementById('formStatus').textContent = '感謝你的訊息！我會盡快回覆。';
  e.target.reset();
  setTimeout(() => { document.getElementById('formStatus').textContent = ''; }, 5000);
});

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initStack();
});
