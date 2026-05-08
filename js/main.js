// ============================================================
//  NAVBAR — scroll effect & mobile toggle
// ============================================================
const navbar   = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
  updateActiveNavLink();
});

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close mobile menu when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Highlight current section in navbar
function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.scrollY + 120;

  sections.forEach(section => {
    const top    = section.offsetTop;
    const height = section.offsetHeight;
    const id     = section.getAttribute('id');
    const link   = document.querySelector(`.nav-links a[href="#${id}"]`);
    if (!link) return;
    link.classList.toggle('active', scrollY >= top && scrollY < top + height);
  });
}

// ============================================================
//  SKILLS — render from data.js
// ============================================================
function renderSkills() {
  const container = document.getElementById('skillsContainer');
  if (!container) return;

  container.innerHTML = SKILLS.map(group => `
    <div class="skill-category">
      <h3>${group.category}</h3>
      <div class="skill-tags">
        ${group.items.map(item => `<span class="skill-tag">${item}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// ============================================================
//  PROJECTS — render & filter from data.js
// ============================================================
function renderProjects() {
  const grid      = document.getElementById('projectsGrid');
  const filterBar = document.getElementById('filterBar');
  if (!grid) return;

  // Build unique category filters
  const categories = ['All', ...new Set(PROJECTS.map(p => p.category))];
  filterBar.innerHTML = categories.map(cat => `
    <button class="filter-btn${cat === 'All' ? ' active' : ''}" data-filter="${cat}">
      ${cat}
    </button>
  `).join('');

  // Render cards
  grid.innerHTML = PROJECTS.map(project => `
    <article class="project-card" data-category="${project.category}">
      <div class="project-thumb">
        ${project.image
          ? `<img src="${project.image}" alt="${project.title}" loading="lazy" />`
          : `<span>No Preview</span>`}
      </div>
      <div class="project-body">
        <div class="project-tags">
          ${project.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
        </div>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="project-links">
          ${project.demoUrl ? `<a href="${project.demoUrl}" class="project-link" target="_blank" rel="noopener">Live Demo</a>` : ''}
          ${project.githubUrl ? `<a href="${project.githubUrl}" class="project-link" target="_blank" rel="noopener">GitHub</a>` : ''}
        </div>
      </div>
    </article>
  `).join('');

  // Filter logic
  filterBar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    grid.querySelectorAll('.project-card').forEach(card => {
      const match = filter === 'All' || card.dataset.category === filter;
      card.classList.toggle('hidden', !match);
    });
  });
}

// ============================================================
//  STATS COUNTER
// ============================================================
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      let current  = 0;
      const step   = Math.ceil(target / 30);
      const timer  = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
      }, 40);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// ============================================================
//  CONTACT FORM — basic client-side handler
// ============================================================
function initContactForm() {
  const form   = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    // Replace this with your preferred form service (Formspree, EmailJS, etc.)
    status.textContent = '感謝你的訊息！我會盡快回覆。';
    form.reset();
    setTimeout(() => (status.textContent = ''), 5000);
  });
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderSkills();
  renderProjects();
  animateCounters();
  initContactForm();
  updateActiveNavLink();
});
