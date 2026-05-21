'use strict';

// ============================================================
//  STATE
// ============================================================
// 'menu' → user sees orbiting letters + centre menu
// 'flying' → letter is animating to full screen
// 'reading' → letter page is open
let state = 'menu';
let activeTarget = null;


// ============================================================
//  CREATE ORBIT
//  Generates mini envelopes that orbit the viewport centre.
//  Three rings of letters at different radii and speeds,
//  all rotating clockwise.
// ============================================================
function createOrbit() {
  const stage = document.getElementById('orbitStage');

  const rings = [
    // { radius range vmin, orbit-speed range s, self-spin range s, count }
    { r: [20, 28], orb: [5,  9],  spin: [1.8, 3.5], n: 4  },
    { r: [36, 46], orb: [9,  14], spin: [2.5, 4.5], n: 5  },
    { r: [54, 66], orb: [13, 20], spin: [3.0, 5.5], n: 4  },
  ];

  let globalIdx = 0;

  rings.forEach(ring => {
    for (let i = 0; i < ring.n; i++) {
      const r        = rand(ring.r[0], ring.r[1]);
      const orbSpeed = rand(ring.orb[0], ring.orb[1]);
      const spinSpd  = rand(ring.spin[0], ring.spin[1]);
      const startDeg = (globalIdx / 13) * 360 + rand(0, 20);
      const delay    = -rand(0, orbSpeed);        // random phase
      const w        = Math.round(rand(60, 96));  // envelope width px
      const opacity  = rand(0.5, 0.95);

      // Orbit pivot: zero-size, sits at viewport centre, rotates
      const pivot = document.createElement('div');
      pivot.className = 'orbit-pivot';
      pivot.style.cssText =
        `--start:${startDeg}deg; --speed:${orbSpeed}s; --delay:${delay}s; --r:${r}vmin;`;

      // Arm tip wrapper: positioned at radius, spins on own axis
      const wrap = document.createElement('div');
      wrap.className = 'orbit-wrap';
      wrap.style.cssText = `--spin:${spinSpd}s;`;

      // Mini envelope
      const fl = document.createElement('div');
      fl.className = 'fl';
      fl.style.cssText = `--w:${w}px; opacity:${opacity};`;
      fl.innerHTML = `
        <div class="fl-flap"></div>
        <div class="fl-stamp"></div>
        <div class="fl-lines">
          <div class="fl-line" style="width:58%"></div>
          <div class="fl-line" style="width:80%"></div>
        </div>`;

      wrap.appendChild(fl);
      pivot.appendChild(wrap);
      stage.appendChild(pivot);

      globalIdx++;
    }
  });
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// ============================================================
//  LETTER TRAY — hover lifts letter, click opens it
// ============================================================
function initTray() {
  document.querySelectorAll('.tray-letter').forEach(letter => {
    function openThis() {
      if (state !== 'menu') return;
      state = 'flying';

      const target = letter.dataset.target;
      const env    = letter.querySelector('.tray-env');

      document.getElementById('orbitStage').classList.add('dimmed');
      document.getElementById('siteHeader').classList.add('hidden');
      document.getElementById('letterTray').classList.add('hidden');

      flyAndOpen(env, () => {
        openLetter(target);
        state = 'reading';
        activeTarget = target;
      });
    }

    letter.addEventListener('click', openThis);
    letter.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThis(); }
    });
  });
}

// ============================================================
//  FLY AND OPEN  — 3-phase envelope animation
//
//  Phase 1 (350ms): orbit letter flies to centre, grows into
//                   a full envelope shape
//  Phase 2 (650ms): envelope flap rotates open (3D)
//  Phase 3 (300ms): envelope expands to fill the viewport
// ============================================================
async function flyAndOpen(fl, onDone) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onDone();
    return;
  }

  const rect  = fl.getBoundingClientRect();

  // Target envelope dimensions (responsive)
  const ENV_W = Math.min(520, window.innerWidth  * 0.86);
  const ENV_H = Math.round(ENV_W * 0.66);
  const ex    = (window.innerWidth  - ENV_W) / 2;   // left when centred
  const ey    = (window.innerHeight - ENV_H) / 2;   // top  when centred

  // Build the full envelope element
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

  // Start: same position and size as the orbit letter
  Object.assign(env.style, {
    left:   `${rect.left}px`,
    top:    `${rect.top}px`,
    width:  `${rect.width}px`,
    height: `${rect.height}px`,
  });
  document.body.appendChild(env);

  // ── Phase 1: swoop to centre, grow to full envelope ──────────
  await raf2();
  Object.assign(env.style, {
    transition: [
      'left   0.38s cubic-bezier(0.22, 1, 0.36, 1)',
      'top    0.38s cubic-bezier(0.22, 1, 0.36, 1)',
      'width  0.38s cubic-bezier(0.22, 1, 0.36, 1)',
      'height 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
    ].join(','),
    left:   `${ex}px`,
    top:    `${ey}px`,
    width:  `${ENV_W}px`,
    height: `${ENV_H}px`,
  });

  await wait(460);  // phase 1 duration + brief landing pause

  // ── Phase 2: flip flap open ───────────────────────────────────
  env.querySelector('.anim-flap').classList.add('open');

  await wait(730);  // flap animation (650ms) + brief pause

  // ── Phase 3: envelope expands to fill screen ──────────────────
  Object.assign(env.style, {
    transition: [
      'left          0.32s ease-in',
      'top           0.32s ease-in',
      'width         0.32s ease-in',
      'height        0.32s ease-in',
      'border-radius 0.2s  ease-in',
      'box-shadow    0.2s  ease-in',
    ].join(','),
    left:        '0',
    top:         '0',
    width:       '100vw',
    height:      '100vh',
    borderRadius:'0',
    boxShadow:   'none',
  });

  await wait(340);
  env.remove();
  onDone();
}

// Utility: wait for two animation frames (ensures initial paint before transition)
function raf2() {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

// Utility: promise-based setTimeout
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
//  OPEN / CLOSE LETTER PAGES
// ============================================================
function openLetter(target) {
  const page = document.getElementById(`letter-${target}`);
  if (!page) return;

  // Show instantly (clone already fills screen; seamless handoff)
  page.style.transition = 'none';
  document.body.classList.add('reading');
  page.classList.add('active');

  // Restore transition for the close animation
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
  document.getElementById('orbitStage').classList.remove('dimmed');
  document.getElementById('siteHeader').classList.remove('hidden');
  document.getElementById('letterTray').classList.remove('hidden');

  state = 'menu';
  activeTarget = null;
}

document.querySelectorAll('[data-back]').forEach(btn =>
  btn.addEventListener('click', closeLetter)
);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLetter();
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
  createOrbit();
  initTray();
});
