'use strict';

// ============================================================
//  STATE
// ============================================================
// 'menu' → user sees orbiting letters + centre menu
// 'flying' → letter is animating to full screen
// 'reading' → letter page is open
let state = 'menu';
let activeTarget = null;

// References to the 4 "menu-linked" orbit letter elements
const menuLetterEls = [];

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

      // First 4 letters become the menu-linked ones (one per ring-1 letter)
      if (globalIdx < 4) menuLetterEls.push(fl);
      globalIdx++;
    }
  });
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// ============================================================
//  MENU CLICKS
// ============================================================
function initMenu() {
  document.querySelectorAll('.cm-item').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      if (state !== 'menu') return;
      state = 'flying';

      const target = btn.dataset.target;
      const fl = menuLetterEls[i % menuLetterEls.length];

      // Dim orbiting letters and hide menu
      document.getElementById('orbitStage').classList.add('dimmed');
      document.getElementById('centerMenu').classList.add('hidden');

      // Letter swoops to centre, expands to full screen, then content opens
      flyToCenter(fl, () => {
        openLetter(target);
        state = 'reading';
        activeTarget = target;
      });
    });
  });
}

// ============================================================
//  FLY LETTER TO FULL SCREEN
//  Captures the current screen position of the chosen orbit
//  letter, clones it as a fixed div, then transitions it to
//  cover the entire viewport before revealing the letter page.
// ============================================================
function flyToCenter(fl, onDone) {
  // Skip animation for users who prefer reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onDone();
    return;
  }

  const rect = fl.getBoundingClientRect();

  // Offset from letter centre → viewport centre
  // Using transform:translate keeps the element in its original DOM position
  // while appearing to fly toward the viewer — GPU-composited, no layout reflow
  const lx = rect.left + rect.width  / 2;
  const ly = rect.top  + rect.height / 2;
  const tx = window.innerWidth  / 2 - lx;
  const ty = window.innerHeight / 2 - ly;

  // Scale factor so the letter covers the entire viewport
  const scale = Math.max(
    window.innerWidth  / rect.width,
    window.innerHeight / rect.height
  ) * 1.25;

  const clone = document.createElement('div');
  clone.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top:  ${rect.top}px;
    width:  ${rect.width}px;
    height: ${rect.height}px;
    background:    #FDF8F0;
    border:        1px solid #D4C4A8;
    border-radius: 2px;
    box-shadow:    0 8px 40px rgba(0,0,0,0.6);
    z-index:       500;
    pointer-events: none;
    will-change:   transform;
    transform-origin: center center;
    transform: translate(0,0) scale(1);
    transition: none;
  `;
  document.body.appendChild(clone);

  // Two-frame trick: paint initial state first, then kick off transition
  requestAnimationFrame(() => requestAnimationFrame(() => {
    clone.style.transition = [
      'transform 0.52s cubic-bezier(0.22, 1, 0.36, 1)',  // ease-out exponential — feels like a fast swoop
      'border-radius 0.2s ease-out 0.28s',
      'box-shadow 0.3s ease-out',
    ].join(',');

    // Fly to centre and fill screen in one transform — no layout shift
    clone.style.transform     = `translate(${tx}px, ${ty}px) scale(${scale})`;
    clone.style.borderRadius  = '0';
    clone.style.boxShadow     = 'none';
  }));

  setTimeout(() => {
    clone.remove();
    onDone();
  }, 560);
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
  document.getElementById('centerMenu').classList.remove('hidden');

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
  initMenu();
});
