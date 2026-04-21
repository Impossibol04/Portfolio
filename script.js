// ─── CONFIG ───────────────────────────────────────
const GITHUB_USER = 'Impossibol04'
// Never ship personal access tokens in client-side code.
// Leave empty to use unauthenticated requests (rate limited by GitHub).
const GITHUB_TOKEN = '';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

// ─── LANGUAGE COLORS ──────────────────────────────
const LANG_COLORS = {
  JavaScript: '#f1e05a', Python: '#3572A5', TypeScript: '#2b7489',
  Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c',
  'C++': '#f34b7d', C: '#555555', Java: '#b07219', Ruby: '#701516',
  Go: '#00ADD8', Rust: '#dea584', PHP: '#4F5D95', Swift: '#ffac45',
  Kotlin: '#F18E33', Lua: '#000080', Dockerfile: '#384d54', Vue: '#2c3e50',
  default: '#8b949e'
};
function langColor(lang) { return LANG_COLORS[lang] || LANG_COLORS.default; }

// ─── CURSOR (seulement si supporté) ───────────────
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX - 5 + 'px';
    cursor.style.top  = e.clientY - 5 + 'px';
    ring.style.left   = e.clientX - 16 + 'px';
    ring.style.top    = e.clientY - 16 + 'px';
  });
  document.querySelectorAll('a, button, .skill-badge, .project-card, .build-card, .stat-box, .gh-stat, .gh-repo-item, .contact-link').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.style.transform = 'scale(1.8)'; cursor.style.transform = 'scale(0.5)'; });
    el.addEventListener('mouseleave', () => { ring.style.transform = 'scale(1)'; cursor.style.transform = 'scale(1)'; });
  });
}

// ─── MOBILE MENU WITH ANIMATION ──────────────────
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active');
    
    if (!isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Keep nav state coherent when resizing from narrow to wide screens.
  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) {
      navLinks.classList.remove('active');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

// ─── NAVBAR SCROLL ────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

// ─── REVEAL ON SCROLL ─────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) setTimeout(() => entry.target.classList.add('visible'), i * 80);
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─── CONTACT FORM ─────────────────────────────────
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    formStatus.textContent = '⌛ Envoi en cours...';
    formStatus.style.color = 'var(--muted)';
    try {
      const response = await fetch(e.target.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        formStatus.style.color = 'var(--green)';
        formStatus.textContent = '✓ Merci ! Ton message a été envoyé.';
        contactForm.reset();
      } else {
        throw new Error();
      }
    } catch (error) {
      formStatus.style.color = 'var(--red)';
      formStatus.textContent = '❌ Erreur lors de l\'envoi. Réessaie plus tard.';
    }
    setTimeout(() => { formStatus.textContent = ''; }, 5000);
  });
}

// ─── TOOLTIP ──────────────────────────────────────
const tooltip = document.getElementById('tooltip');
function showTooltip(e, text) {
  tooltip.textContent = text;
  tooltip.style.opacity = '1';
  tooltip.style.left = e.clientX + 16 + 'px';
  tooltip.style.top = e.clientY - 10 + 'px';
}
function hideTooltip() { tooltip.style.opacity = '0'; }

// ─── GITHUB API ───────────────────────────────────
const cache = {};
async function ghFetch(url) {
  if (cache[url] && Date.now() - cache[url].ts < CACHE_TTL) return cache[url].data;
  
  const headers = {};
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  
  const r = await fetch(url, { headers });
  if (!r.ok) {
    if (r.status === 403 || r.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    throw new Error(`GitHub API ${r.status}`);
  }
  const data = await r.json();
  cache[url] = { data, ts: Date.now() };
  return data;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months/12)}y ago`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// ─── CONTRIBUTION GRAPH ───────────────────────────
function buildContribGraph(repos) {
  const grid = document.getElementById('contrib-grid');
  const monthsEl = document.getElementById('contrib-months');
  if (!grid || !monthsEl) return;
  grid.innerHTML = ''; monthsEl.innerHTML = '';

  const now = new Date();
  const weeks = 52;
  const totalDays = weeks * 7;
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - totalDays + 1);

  const activityMap = {};
  repos.forEach(repo => {
    if (repo.pushed_at) {
      const d = new Date(repo.pushed_at);
      for (let i = 0; i < 3; i++) {
        const key = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i).toDateString();
        activityMap[key] = (activityMap[key] || 0) + 1;
      }
    }
    if (repo.created_at) {
      const d = new Date(repo.created_at);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
      activityMap[key] = (activityMap[key] || 0) + 2;
    }
  });

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let lastMonth = -1;
  const monthSpans = [];

  for (let w = 0; w < weeks; w++) {
    const weekEl = document.createElement('div');
    weekEl.className = 'gh-contrib-week';
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + w * 7 + d);
      if (date > now) {
        const empty = document.createElement('div');
        empty.className = 'gh-contrib-day';
        empty.style.opacity = '0';
        weekEl.appendChild(empty);
        continue;
      }
      const count = activityMap[date.toDateString()] || 0;
      let level = 0;
      if (count >= 4) level = 4;
      else if (count >= 3) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      const day = document.createElement('div');
      day.className = 'gh-contrib-day';
      if (level > 0) day.setAttribute('data-level', level);
      day.addEventListener('mouseenter', e => showTooltip(e, date.toDateString()));
      day.addEventListener('mouseleave', hideTooltip);
      weekEl.appendChild(day);

      if (date.getMonth() !== lastMonth && d === 0) {
        lastMonth = date.getMonth();
        monthSpans.push({ label: monthNames[date.getMonth()], weekIndex: w });
      }
    }
    grid.appendChild(weekEl);
  }

  // Affichage des mois
  monthSpans.forEach((m, index) => {
    const span = document.createElement('span');
    if (index > 0) {
      const prevWeek = monthSpans[index-1].weekIndex;
      const gapWeeks = m.weekIndex - prevWeek;
      span.style.marginLeft = `${gapWeeks * 15}px`;
    } else {
      span.style.marginLeft = `${m.weekIndex * 15}px`;
    }
    span.textContent = m.label;
    monthsEl.appendChild(span);
  });
}

// ─── LOAD GITHUB ──────────────────────────────────
async function loadGitHub(force = false) {
  if (force) { Object.keys(cache).forEach(k => delete cache[k]); }

  // Afficher des loaders si refresh forcé
  if (force) {
    const langList = document.getElementById('lang-list');
    const reposList = document.getElementById('gh-repos-list');
    if (langList) langList.innerHTML = '<div class="gh-loading">Fetching languages<div class="gh-loading-dots"><span></span><span></span><span></span></div></div>';
    if (reposList) reposList.innerHTML = '<div class="gh-loading">Fetching repos<div class="gh-loading-dots"><span></span><span></span><span></span></div></div>';
    const contribGrid = document.getElementById('contrib-grid');
    const contribMonths = document.getElementById('contrib-months');
    if (contribGrid) contribGrid.innerHTML = '';
    if (contribMonths) contribMonths.innerHTML = '';
  }

  try {
    const profile = await ghFetch(`https://api.github.com/users/${GITHUB_USER}`);

    const navLabel = document.getElementById('nav-gh-label');
    if (navLabel) navLabel.textContent = `${profile.login} · ${profile.public_repos} repos`;
    const heroRepos = document.getElementById('hero-repos');
    const heroFollowers = document.getElementById('hero-followers');
    if (heroRepos) heroRepos.textContent = profile.public_repos;
    if (heroFollowers) heroFollowers.textContent = profile.followers;
    const statRepos = document.getElementById('stat-repos');
    const statFollowers = document.getElementById('stat-followers');
    if (statRepos) statRepos.textContent = profile.public_repos;
    if (statFollowers) statFollowers.textContent = profile.followers;
    const jsonName = document.getElementById('json-name');
    const jsonRepos = document.getElementById('json-repos');
    const jsonFollowers = document.getElementById('json-followers');
    if (jsonName) jsonName.textContent = `"${profile.name || profile.login}"`;
    if (jsonRepos) jsonRepos.textContent = `"${profile.public_repos} public repos"`;
    if (jsonFollowers) jsonFollowers.textContent = `"${profile.followers} followers"`;

    const avatarImg = document.getElementById('gh-avatar-img');
    if (avatarImg) avatarImg.src = profile.avatar_url;
    const displayName = document.getElementById('gh-display-name');
    const ghLogin = document.getElementById('gh-login');
    const ghBio = document.getElementById('gh-bio');
    const ghLocation = document.getElementById('gh-location');
    const ghBlog = document.getElementById('gh-blog');
    const ghJoined = document.getElementById('gh-joined');
    const ghReposCount = document.getElementById('gh-repos-count');
    const ghFollowersCount = document.getElementById('gh-followers-count');
    const ghFollowingCount = document.getElementById('gh-following-count');
    if (displayName) displayName.textContent = profile.name || profile.login;
    if (ghLogin) ghLogin.textContent = `@${profile.login}`;
    if (ghBio) ghBio.textContent = profile.bio || 'No bio set.';
    if (ghLocation) ghLocation.textContent = profile.location || '—';
    if (ghBlog) ghBlog.textContent = profile.blog || '—';
    if (ghJoined) ghJoined.textContent = formatDate(profile.created_at);
    if (ghReposCount) ghReposCount.textContent = profile.public_repos;
    if (ghFollowersCount) ghFollowersCount.textContent = profile.followers;
    if (ghFollowingCount) ghFollowingCount.textContent = profile.following;

    const syncTime = document.getElementById('sync-time');
    if (syncTime) syncTime.textContent = `Synced at ${new Date().toLocaleTimeString()}`;

    const repos = await ghFetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`);

    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
    const statStars = document.getElementById('stat-stars');
    const heroStars = document.getElementById('hero-stars');
    if (statStars) statStars.textContent = totalStars;
    if (heroStars) heroStars.textContent = totalStars;

    // Languages
    const langCount = {};
    repos.forEach(r => { if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1; });
    const sorted = Object.entries(langCount).sort((a,b) => b[1]-a[1]);
    const total = sorted.reduce((s, [,c]) => s + c, 0);

    const bar = document.getElementById('lang-bar');
    const list = document.getElementById('lang-list');
    if (bar) bar.innerHTML = '';
    if (list) list.innerHTML = '';

    if (sorted.length > 0 && bar && list) {
      sorted.slice(0, 6).forEach(([lang, count]) => {
        const pct = ((count / total) * 100).toFixed(1);
        const color = langColor(lang);
        const seg = document.createElement('div');
        seg.className = 'lang-bar-seg';
        seg.style.width = pct + '%';
        seg.style.background = color;
        seg.title = `${lang}: ${pct}%`;
        bar.appendChild(seg);

        const row = document.createElement('div');
        row.className = 'lang-row';
        row.innerHTML = `
          <div class="lang-dot" style="background:${color}"></div>
          <span class="lang-name">${lang}</span>
          <span class="lang-pct">${pct}%</span>
          <span class="lang-count">${count} repos</span>
        `;
        list.appendChild(row);
      });
    } else if (list) {
      list.innerHTML = '<div class="gh-loading">No language data available</div>';
    }

    // Ajouter badges langages dans skills
    const skillsGrid = document.getElementById('skills-grid');
    if (skillsGrid) {
      document.querySelectorAll('.dynamic-lang-badge').forEach(b => b.remove());
      sorted.slice(0, 4).forEach(([lang]) => {
        const badge = document.createElement('div');
        badge.className = 'skill-badge dynamic-lang-badge';
        badge.innerHTML = `
          <span class="skill-icon" style="font-size:18px; width:20px; height:20px; border-radius:50%; background:${langColor(lang)}; display:inline-block;"></span>
          <span class="skill-name">${lang}</span>
        `;
        skillsGrid.prepend(badge);
      });
    }

    // Recent repos
    const reposList = document.getElementById('gh-repos-list');
    if (reposList) {
      reposList.innerHTML = '';
      repos.slice(0, 8).forEach(repo => {
        const item = document.createElement('a');
        item.className = 'gh-repo-item';
        item.href = repo.html_url;
        item.target = '_blank';
        item.rel = 'noopener';
        item.innerHTML = `
          <div class="gh-repo-name">
            ${repo.name}
            ${repo.fork ? '<span class="gh-repo-fork-badge">fork</span>' : ''}
            ${repo.archived ? '<span class="gh-repo-fork-badge">archived</span>' : ''}
          </div>
          <div class="gh-repo-desc">${repo.description || 'No description.'}</div>
          <div class="gh-repo-meta">
            ${repo.language ? `<div class="gh-repo-lang"><div class="gh-repo-lang-dot" style="background:${langColor(repo.language)}"></div>${repo.language}</div>` : ''}
            ${repo.stargazers_count > 0 ? `<div class="gh-repo-stars">⭐ ${repo.stargazers_count}</div>` : ''}
            <div class="gh-repo-updated">${timeAgo(repo.pushed_at)}</div>
          </div>
        `;
        reposList.appendChild(item);
      });
    }

    buildContribGraph(repos);

  } catch (err) {
    console.error('GitHub fetch failed:', err);
    const navLabel = document.getElementById('nav-gh-label');
    if (navLabel) navLabel.textContent = 'API unavailable';
    const syncTime = document.getElementById('sync-time');
    if (syncTime) syncTime.textContent = 'Failed to sync — rate limited?';
    const ghBio = document.getElementById('gh-bio');
    if (ghBio) ghBio.textContent = '⚠️ GitHub API rate limit may have been reached. Try again in a minute.';
  }
}

// Initial load
loadGitHub();
setInterval(() => loadGitHub(), 5 * 60 * 1000);

// ─── UI ENHANCEMENTS ─────────────────────────────────
// Smooth scroll for same-page anchors
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href && href.length > 1) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  });
});

// Avatar lazy loading
const avatarImg = document.getElementById('gh-avatar-img');
if (avatarImg) avatarImg.loading = 'lazy';

// Repos "Show more" toggle
function attachReposToggle() {
  const reposList = document.getElementById('gh-repos-list');
  if (!reposList) return;
  const existing = document.getElementById('repos-toggle');
  if (existing) return;
  const parent = reposList.parentElement;
  if (!parent) return;
  const btn = document.createElement('button');
  btn.id = 'repos-toggle';
  btn.className = 'refresh-btn';
  btn.textContent = 'Show more';
  btn.addEventListener('click', async () => {
    const expanded = btn.getAttribute('data-expanded') === 'true';
    if (!expanded) {
      try {
        const repos = await ghFetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`);
        reposList.innerHTML = '';
        repos.forEach(repo => {
          const item = document.createElement('a');
          item.className = 'gh-repo-item';
          item.href = repo.html_url;
          item.target = '_blank';
          item.rel = 'noopener';
          item.innerHTML = `
            <div class="gh-repo-name">
              ${repo.name}
              ${repo.fork ? '<span class="gh-repo-fork-badge">fork</span>' : ''}
              ${repo.archived ? '<span class="gh-repo-fork-badge">archived</span>' : ''}
            </div>
            <div class="gh-repo-desc">${repo.description || 'No description.'}</div>
            <div class="gh-repo-meta">
              ${repo.language ? `<div class="gh-repo-lang"><div class="gh-repo-lang-dot" style="background:${langColor(repo.language)}"></div>${repo.language}</div>` : ''}
              ${repo.stargazers_count > 0 ? `<div class="gh-repo-stars">⭐ ${repo.stargazers_count}</div>` : ''}
              <div class="gh-repo-updated">${timeAgo(repo.pushed_at)}</div>
            </div>
          `;
          reposList.appendChild(item);
        });
        btn.textContent = 'Show less';
        btn.setAttribute('data-expanded', 'true');
      } catch (err) {
        console.error('Failed to expand repos', err);
        btn.textContent = 'Error';
        setTimeout(() => btn.textContent = 'Show more', 2500);
      }
    } else {
      try {
        const repos = await ghFetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`);
        reposList.innerHTML = '';
        repos.slice(0,8).forEach(repo => {
          const item = document.createElement('a');
          item.className = 'gh-repo-item';
          item.href = repo.html_url;
          item.target = '_blank';
          item.rel = 'noopener';
          item.innerHTML = `
            <div class="gh-repo-name">${repo.name}</div>
            <div class="gh-repo-desc">${repo.description || 'No description.'}</div>
            <div class="gh-repo-meta">
              ${repo.language ? `<div class="gh-repo-lang"><div class="gh-repo-lang-dot" style="background:${langColor(repo.language)}"></div>${repo.language}</div>` : ''}
              ${repo.stargazers_count > 0 ? `<div class="gh-repo-stars">⭐ ${repo.stargazers_count}</div>` : ''}
              <div class="gh-repo-updated">${timeAgo(repo.pushed_at)}</div>
            </div>
          `;
          reposList.appendChild(item);
        });
        btn.textContent = 'Show more';
        btn.setAttribute('data-expanded', 'false');
      } catch (err) { console.error(err); }
    }
  });
  parent.appendChild(btn);
}

// Attach toggle after each GitHub load
const origLoadGitHub = loadGitHub;
loadGitHub = async function(force = false) {
  await origLoadGitHub(force);
  attachReposToggle();
};