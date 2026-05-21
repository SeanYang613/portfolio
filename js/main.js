// ============================================================
//  STATE MACHINE:  'closed' → 'open' → 'reading'
// ============================================================
let state = 'closed';
let activeLetter = null;

const envelope  = document.getElementById('envelope');
const waxSeal   = document.getElementById('waxSeal');
const stageHint = document.getElementById('stageHint');
const openHint  = document.getElementById('openHint');

// ============================================================
//  OPEN ENVELOPE
// ============================================================
waxSeal.addEventListener('click', () => {
  if (state !== 'closed') return;
  state = 'open';

  // Seal crack animation then envelope opens
  waxSeal.style.transition = 'transform 0.15s ease, opacity 0.3s 0.15s';
  waxSeal.style.transform = 'translateX(-50%) scale(1.15) rotate(4deg)';

  setTimeout(() => {
    envelope.classList.add('open');
    stageHint.classList.add('hidden');
  }, 150);

  setTimeout(() => openHint.classList.add('visible'), 900);
});

// ============================================================
//  SELECT LETTER (tab click)
// ============================================================
document.getElementById('letterTabs').addEventListener('click', e => {
  const tab = e.target.closest('.ltab');
  if (!tab || state !== 'open') return;
  openLetter(tab.dataset.target);
});

function openLetter(target) {
  const page = document.getElementById(`letter-${target}`);
  if (!page) return;

  state = 'reading';
  activeLetter = target;

  document.body.classList.add('reading');
  page.classList.add('active');

  if (target === 'skills')   renderSkills();
  if (target === 'projects') renderProjects();
  if (target === 'about')    setTimeout(animateCounters, 350);
}

// ============================================================
//  CLOSE LETTER (back button)
// ============================================================
document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', closeLetter);
});

function closeLetter() {
  if (state !== 'reading') return;
  const page = document.getElementById(`letter-${activeLetter}`);
  if (page) page.classList.remove('active');
  document.body.classList.remove('reading');
  state = 'open';
  activeLetter = null;
}

// Keyboard: Escape closes letter
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state === 'reading') closeLetter();
});

// ============================================================
//  RENDER SKILLS
// ============================================================
function renderSkills() {
  const grid = document.getElementById('skillsGrid');
  if (!grid || grid.children.length > 0) return;

  grid.innerHTML = SKILLS.map(group => `
    <div class="skill-cat">
      <h3>${group.category}</h3>
      <div class="skill-tags">
        ${group.items.map(item => `<span class="skill-tag">${item}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// ============================================================
//  RENDER PROJECTS
// ============================================================
let projectsRendered = false;

function renderProjects() {
  if (projectsRendered) return;
  projectsRendered = true;

  const grid      = document.getElementById('projectsGrid');
  const filterBar = document.getElementById('filterBar');

  const categories = ['All', ...new Set(PROJECTS.map(p => p.category))];
  filterBar.innerHTML = categories.map(cat =>
    `<button class="filter-btn${cat === 'All' ? ' active' : ''}" data-filter="${cat}">${cat}</button>`
  ).join('');

  grid.innerHTML = PROJECTS.map(p => `
    <article class="project-card" data-category="${p.category}">
      <div class="project-thumb">
        ${p.image
          ? `<img src="${p.image}" alt="${p.title}" loading="lazy" />`
          : `<span>No Preview</span>`}
      </div>
      <div class="project-body">
        <div class="project-tags">
          ${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
        </div>
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="project-links">
          ${p.demoUrl   ? `<a href="${p.demoUrl}"   class="project-link" target="_blank" rel="noopener">Live Demo</a>` : ''}
          ${p.githubUrl ? `<a href="${p.githubUrl}" class="project-link" target="_blank" rel="noopener">GitHub</a>`   : ''}
        </div>
      </div>
    </article>
  `).join('');

  filterBar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    grid.querySelectorAll('.project-card').forEach(card => {
      card.classList.toggle('hidden', f !== 'All' && card.dataset.category !== f);
    });
  });
}

// ============================================================
//  STAT COUNTERS
// ============================================================
function animateCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    let current  = 0;
    const step   = Math.ceil(target / 25);
    const timer  = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 50);
  });
}

// ============================================================
//  CONTACT FORM
// ============================================================
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  // Replace with Formspree or EmailJS for real sending
  document.getElementById('formStatus').textContent = '感謝你的訊息！我會盡快回覆。';
  e.target.reset();
  setTimeout(() => document.getElementById('formStatus').textContent = '', 5000);
});
