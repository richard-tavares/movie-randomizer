function populateSelect(el, items, { valueKey, labelKey, allLabel }) {
  if (!el) return;
  el.innerHTML = `<option value="">${allLabel}</option>`;
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item[valueKey];
    opt.textContent = item[labelKey];
    el.appendChild(opt);
  });
  el.dispatchEvent(new Event('change'));
}

function posterUrl(path, size = 'MD') {
  if (!path) return null;
  return CONFIG[`IMG_${size}`] + path;
}

function backdropUrl(path, size = 'LG') {
  if (!path) return null;
  return CONFIG[`BACKDROP_${size}`] + path;
}

function formatRuntime(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) {
    const mPart = m > 0 ? ` ${m}min` : '';
    return `${h}h${mPart}`;
  }
  return `${m}min`;
}

function formatYear(dateStr) {
  if (!dateStr) return '';
  return dateStr.substring(0, 4);
}

function formatRating(value) {
  if (!value) return '—';
  return Number(value).toFixed(1);
}

function formatGenres(genreIds = [], limit = 3) {
  return genreIds
    .slice(0, limit)
    .map(id => ALL_GENRES[id] || '')
    .filter(Boolean)
    .join(', ');
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff <= 0) return 'hoje';
  if (diff === 1) return '1 dia atrás';
  if (diff < 7) return `${diff} dias atrás`;
  const weeks = Math.floor(diff / 7);
  if (weeks === 1) return '1 semana atrás';
  if (weeks < 4) return `${weeks} semanas atrás`;
  const months = Math.floor(diff / 30);
  if (months === 1) return '1 mês atrás';
  return `${months} meses atrás`;
}

function buildAiringCard(show) {
  const last = show.last_episode_to_air;
  if (!last || last.season_number === 0) return null;

  const seasonNum = last.season_number;
  const epAired = last.episode_number;
  const season = (show.seasons || []).find(s => s.season_number === seasonNum);
  const epTotal = season?.episode_count || epAired;
  const pct = Math.min(100, Math.round((epAired / epTotal) * 100));
  const poster = posterUrl(show.poster_path, 'SM');

  const el = document.createElement('div');
  el.className = 'airing-card';
  el.innerHTML = `
    <div class="airing-poster">
      ${poster
      ? `<img src="${poster}" alt="${escHtml(show.name || '')}" loading="lazy">`
      : `<div class="airing-poster-ph">
          <i class="ph ph-television"></i>
        </div>`
      }
    </div>
    <div class="airing-info">
      <div class="airing-title">${escHtml(show.name || '')}</div>
      <div class="airing-ep-row">
        <span class="airing-season">${seasonNum}ª temporada</span>
        <span class="airing-ep-count">${epAired}/${epTotal} episódios</span>
      </div>
      <div class="airing-progress-wrap">
        <div class="airing-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="airing-date">
        <i class="ph ph-calendar-blank"></i> ${timeAgo(last.air_date)}
      </div>
    </div>
  `;
  el.addEventListener('click', () => goToTitle(show.id, 'tv'));
  return el;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return dateStr; }
}

function formatMoney(amount) {
  if (amount >= 1e9) return `$${+(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${+(amount / 1e6).toFixed(1)}M`;
  return `$${amount.toLocaleString('en-US')}`;
}

function getCertification(movie) {
  if (typeof movie._cert === 'string') return movie._cert;
  const results = movie.release_dates?.results || [];
  const br = results.find(r => r.iso_3166_1 === 'BR');
  const us = results.find(r => r.iso_3166_1 === 'US');
  const source = br || us;
  if (!source) return '';
  return source.release_dates?.find(r => r.certification)?.certification || '';
}

function certBadgeHtml(cert) {
  if (!cert) return '';
  const colors = {
    'L': '#22c55e', 'G': '#22c55e',
    '10': '#06b6d4', 'PG': '#06b6d4',
    '12': '#f59e0b',
    '14': '#f97316', 'PG-13': '#f97316',
    '16': '#ef4444', 'R': '#ef4444',
    '18': '#000000', 'NC-17': '#000000',
  };
  const color = colors[cert] || '#888888';
  return `<span class="cert-badge" style="--cert-color:${color}" title="Classificação Indicativa">${escHtml(cert)}</span>`;
}

function buildCard(movie, opts = {}) {
  const { lazy = true, type } = opts;
  const id = movie.id;
  const title = movie.title || movie.name || 'Sem título';
  const year = formatYear(movie.release_date || movie.first_air_date);
  const rating = formatRating(movie.vote_average);
  const poster = posterUrl(movie.poster_path);
  const genreIds = (movie.genre_ids || []).filter(gid => type !== 'anime' || gid !== 16);
  const genres = formatGenres(genreIds);

  const entry = Watchlist.getAll()[id];
  const lazyAttr = lazy ? 'loading="lazy"' : '';
  const addedClass = entry?.want ? 'added' : '';
  const favClass = entry?.favorite ? 'faved' : '';
  const addedLabel = entry?.want ? 'Remover Salvo' : 'Salvar';
  const favLabel = entry?.favorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
  const addedIcon = entry?.want ? '<i class="ph ph-check"></i>' : '<i class="ph ph-plus"></i>';
  const favIcon = entry?.favorite ? '<i class="ph-fill ph-heart"></i>' : '<i class="ph ph-heart"></i>';
  const ratingHtml = rating === '—' ? '' : `<div class="content-card-rating"><i class="ph-fill ph-star"></i> ${rating}</div>`;

  const card = document.createElement('div');
  card.className = 'content-card';
  card.dataset.id = id;

  card.innerHTML = `
    <div class="content-card-poster">
      ${poster
      ? `<img src="${poster}" alt="${escHtml(title)}" ${lazyAttr} draggable="false">`
      : `<div class="no-poster">
          <span class="no-poster-icon">
            <i class="ph ph-image"></i>
          </span>
          <span>${escHtml(title)}</span>
        </div>`
    }
      ${ratingHtml}
      <div class="content-card-overlay">
        <button class="content-card-add ${addedClass}" aria-label="${addedLabel}" title="${addedLabel}">${addedIcon}</button>
        <button class="content-card-fav ${favClass}" aria-label="${favLabel}" title="${favLabel}">${favIcon}</button>
      </div>
    </div>
    <div class="content-card-info">
      <div class="content-card-title">${escHtml(title)}</div>
      ${year ? `<div class="content-card-year">${year}</div>` : ''}
    </div>
  `;

  const contentType = opts.type || movie._type || movie.media_type || 'movie';

  card.querySelector('.content-card-add').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleWatchlist(movie, e.currentTarget, 'want');
  });
  card.querySelector('.content-card-fav').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleWatchlist(movie, e.currentTarget, 'favorite');
  });

  card.addEventListener('click', () => goToTitle(id, contentType));
  return card;
}

function toggleWatchlist(movie, btn, list = 'want') {
  const isFav = list === 'favorite';
  const isActive = !!Watchlist.getAll()[movie.id]?.[list];

  if (isActive) {
    Watchlist.remove(movie.id, list);
    btn.innerHTML = isFav ? '<i class="ph ph-heart"></i>' : '<i class="ph ph-plus"></i>';
    const removeLabel = isFav ? 'Adicionar aos Favoritos' : 'Salvar';
    btn.title = removeLabel;
    btn.setAttribute('aria-label', removeLabel);
    showToast('Removido da lista', 'info');
  } else {
    Watchlist.add(movie, list);
    btn.innerHTML = isFav ? '<i class="ph-fill ph-heart"></i>' : '<i class="ph ph-check"></i>';
    const addLabel = isFav ? 'Remover dos Favoritos' : 'Remover Salvo';
    btn.title = addLabel;
    btn.setAttribute('aria-label', addLabel);
    const toast = isFav ? 'Adicionado aos favoritos!' : `"${movie.title || movie.name}" adicionado!`;
    showToast(toast, 'success');
  }
}

function goToTitle(id, type = 'movie') {
  globalThis.location.href = `title.html?type=${encodeURIComponent(type)}&id=${id}`;
}

function getContentType(item) {
  return item._type || (item.media_type === 'tv' ? 'tv' : 'movie');
}

function typeBadgeHtml(contentType, extraClass = '') {
  const { icon, label } = CONTENT_TYPE_META[contentType] || CONTENT_TYPE_META.movie;
  const cls = ['badge', 'badge-type', extraClass].filter(Boolean).join(' ');
  return `<span class="${cls}"><i class="${icon}"></i> ${label}</span>`;
}

function buildActionButtons(movie, contentType) {
  const entry = Watchlist.getAll()[movie.id];

  const trailerBtn = document.createElement('button');
  trailerBtn.className = 'btn btn-primary';
  trailerBtn.innerHTML = '<i class="ph-fill ph-play"></i> Assistir Trailer';
  trailerBtn.addEventListener('click', () => Trailer.open(movie.id, contentType));

  const detailBtn = document.createElement('button');
  detailBtn.className = 'btn btn-secondary';
  detailBtn.title = 'Detalhes';
  detailBtn.setAttribute('aria-label', 'Detalhes');
  detailBtn.innerHTML = '<i class="ph ph-info"></i> Detalhes';
  detailBtn.addEventListener('click', () => goToTitle(movie.id, contentType));

  const wlBtn = document.createElement('button');
  wlBtn.className = 'btn-icon btn-icon-lg';
  const wlLabel = entry?.want ? 'Remover Salvo' : 'Salvar';
  wlBtn.title = wlLabel;
  wlBtn.setAttribute('aria-label', wlLabel);
  wlBtn.innerHTML = entry?.want ? '<i class="ph ph-check"></i>' : '<i class="ph ph-plus"></i>';
  wlBtn.addEventListener('click', () => toggleWatchlist(movie, wlBtn, 'want'));

  const favBtn = document.createElement('button');
  favBtn.className = 'btn-icon btn-icon-lg btn-fav';
  const favLabel = entry?.favorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
  favBtn.title = favLabel;
  favBtn.setAttribute('aria-label', favLabel);
  favBtn.innerHTML = entry?.favorite ? '<i class="ph-fill ph-heart"></i>' : '<i class="ph ph-heart"></i>';
  favBtn.addEventListener('click', () => toggleWatchlist(movie, favBtn, 'favorite'));

  const frag = document.createDocumentFragment();
  frag.append(trailerBtn, detailBtn, wlBtn, favBtn);
  return frag;
}

function initAllDice() {
  const faces = ['ph-dice-one', 'ph-dice-two', 'ph-dice-three', 'ph-dice-four', 'ph-dice-five', 'ph-dice-six'];
  document.querySelectorAll('.rand-dice-icon:not([data-dice-init])').forEach((icon, idx) => {
    icon.dataset.diceInit = '1';
    let current = faces.findIndex(f => icon.classList.contains(f));
    if (current === -1) current = 4;
    setTimeout(() => {
      setInterval(() => {
        let next;
        do { next = Math.floor(Math.random() * 6); } while (next === current);
        icon.classList.remove(faces[current]);
        icon.classList.add(faces[next]);
        current = next;
      }, 3000);
    }, idx * 600);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  _renderNavbar();
  _renderFooter();
  if (typeof CustomSelect !== 'undefined') CustomSelect.initAll();
  initAllDice();
});

function _updateWlBadge() {
  const badge = document.getElementById('wlBadge');
  if (!badge) return;
  const c = typeof Watchlist === 'undefined' ? 0 : Watchlist.count();
  badge.textContent = c;
  badge.style.display = c > 0 ? 'flex' : 'none';
}

function _renderNavbar() {
  const placeholder = document.getElementById('app-navbar');
  if (!placeholder) return;

  const path = globalThis.location.pathname;
  const isHome = path.endsWith('index.html') || path === '/' || path.endsWith('/');

  placeholder.insertAdjacentHTML('afterend', `
    <header class="navbar" id="navbar">
      <a class="navbar-brand" href="index.html" aria-label="Movie Randomizer">
        <img class="navbar-logo" src="assets/img/favicon.svg" alt="MovieRandomizer">
        <span class="navbar-name">Movie<span class="navbar-name-grad">Randomizer</span></span>
      </a>
      <nav class="navbar-nav" aria-label="Navegação principal">
        <a class="nav-link" href="explore.html?type=movie">Filmes</a>
        <a class="nav-link" href="explore.html?type=tv">Séries</a>
        <a class="nav-link" href="explore.html?type=anime">Animes</a>
        <a class="nav-link" href="upcoming.html">Em Breve</a>
      </nav>
      <div class="navbar-actions">
        <button class="btn-nav-icon" id="searchBtn" aria-label="Buscar filmes" title="Buscar (Ctrl+K)">
          <i class="ph ph-magnifying-glass"></i>
        </button>
        <button class="btn-nav-icon" id="wlBtn" aria-label="Listas">
          <i class="ph ph-bookmark-simple"></i>
          <span id="wlBadge" class="wl-badge"></span>
        </button>
        <button class="nav-toggle" id="navToggle" aria-label="Menu" aria-expanded="false">
          <i class="ph ph-list nav-toggle-icon-open"></i>
          <i class="ph ph-x nav-toggle-icon-close"></i>
        </button>
      </div>
    </header>
    <nav class="mobile-nav" id="mobileNav" aria-label="Menu mobile">
      <button class="nav-link nav-link-btn" id="searchBtnMobile">
        <i class="ph ph-magnifying-glass"></i> Buscar
      </button>
      <button class="nav-link nav-link-btn" id="wlBtnMobile">
        <i class="ph ph-bookmark-simple"></i> Listas
      </button>
      <a class="nav-link" href="explore.html?type=movie">
        <i class="ph ph-film-slate"></i> Filmes
      </a>
      <a class="nav-link" href="explore.html?type=tv">
        <i class="ph ph-television"></i> Séries
      </a>
      <a class="nav-link" href="explore.html?type=anime">
        <i class="ph ph-star-four"></i> Animes
      </a>
      <a class="nav-link" href="upcoming.html">
        <i class="ph ph-calendar-dots"></i> Em Breve
      </a>
    </nav>
  `);
  placeholder.remove();

  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');

  const onScroll = throttle(() => navbar?.classList.toggle('scrolled', globalThis.scrollY > 40), 80);
  globalThis.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toggle?.addEventListener('click', () => {
    const open = mobileNav?.classList.toggle('open');
    toggle.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileNav?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      toggle?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  if (isHome) {
    document.querySelectorAll('[data-vibe-nav]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('vibe')?.scrollIntoView({ behavior: 'smooth' });
        mobileNav?.classList.remove('open');
        toggle?.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  const search = globalThis.location.search;
  if (path.includes('explore.html')) {
    const type = new URLSearchParams(search).get('type') || 'movie';
    const activeHref = `explore.html?type=${type}`;
    document.querySelectorAll('.navbar-nav .nav-link, .mobile-nav .nav-link').forEach(el => {
      el.classList.toggle('active', el.getAttribute('href') === activeHref);
    });
  }
  if (path.includes('upcoming.html')) {
    document.querySelectorAll('.navbar-nav .nav-link, .mobile-nav .nav-link').forEach(el => {
      el.classList.toggle('active', el.getAttribute('href') === 'upcoming.html');
    });
  }

  _updateWlBadge();
  globalThis.addEventListener('watchlist:change', _updateWlBadge);

  if (isHome) return;

  const toHome = () => { globalThis.location.href = 'index.html'; };
  document.getElementById('searchBtn')?.addEventListener('click', toHome);
  document.getElementById('searchBtnMobile')?.addEventListener('click', toHome);
}

function _renderFooter() {
  const el = document.getElementById('app-footer');
  if (!el) return;
  const year = new Date().getFullYear();
  el.className = 'footer';
  el.innerHTML = `
    <div class="footer-content">
      <div class="footer-brand">
        <img class="navbar-logo" src="assets/img/favicon.svg" alt="MovieRandomizer">
        <div class="footer-brand-text">
          <span class="navbar-name">Movie<span class="navbar-name-grad">Randomizer</span></span>
          <div class="footer-tagline">Sorteador de filmes, séries e animes.</div>
        </div>
      </div>
      <div class="footer-social">
        <a class="footer-tmdb-link" href="https://www.themoviedb.org" target="_blank" rel="noopener" aria-label="TMDB">
          <img src="assets/img/tmdb.svg" alt="TMDB" class="footer-tmdb-logo">
        </a>
        <a class="footer-social-btn" href="https://github.com/richard-tavares" target="_blank" rel="noopener" aria-label="GitHub">
          <i class="devicon-github-original"></i>
        </a>
        <a class="footer-social-btn" href="https://www.linkedin.com/in/richard-tavares" target="_blank" rel="noopener" aria-label="LinkedIn">
          <i class="devicon-linkedin-plain"></i>
        </a>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© ${year} Richard Tavares</div>
    </div>
  `;
}

function buildSkeletonCards(count = 8) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'skeleton-card';
    el.innerHTML = `<div class="skeleton skeleton-poster"></div>`;
    frag.appendChild(el);
  }
  return frag;
}

let _toastContainer = null;

function showToast(message, type = 'info', duration = 5000) {
  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.className = 'toast-container';
    document.body.appendChild(_toastContainer);
  }

  const icons = {
    success: '<i class="ph ph-check-circle"></i>',
    error: '<i class="ph ph-x-circle"></i>',
    info: '<i class="ph ph-info"></i>',
    warning: '<i class="ph ph-warning"></i>',
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.setProperty('--toast-duration', `${duration}ms`);
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '<i class="ph ph-chat-circle"></i>'}</span>
    <span>${escHtml(message)}</span>
    <div class="toast-progress"></div>
  `;
  _toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function throttle(fn, limit = 200) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= limit) { last = now; fn(...args); }
  };
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isAnime(item) {
  return item.genre_ids?.includes(16) && item.original_language === 'ja';
}

function stripAnime(data) {
  if (data?.results) data.results = data.results.filter(r => !isAnime(r));
  return data;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

async function batchedAll(items, fn, size = 5) {
  const results = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = await Promise.all(items.slice(i, i + size).map(fn));
    results.push(...batch);
  }
  return results;
}

function updateDualRange(wrapId, minEl, maxEl) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const fill = wrap.querySelector('.dual-range-fill');
  if (!fill) return;
  const lo = +minEl.min, hi = +minEl.max;
  const span = hi - lo;
  const left = ((+minEl.value - lo) / span) * 100;
  const right = ((+maxEl.value - lo) / span) * 100;
  fill.style.left = left + '%';
  fill.style.width = (right - left) + '%';
}

function updateSingleRange(wrapId, inputEl) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const fill = wrap.querySelector('.dual-range-fill');
  if (!fill) return;
  const lo = +inputEl.min, hi = +inputEl.max;
  const pct = ((+inputEl.value - lo) / (hi - lo)) * 100;
  fill.style.left = '0%';
  fill.style.width = pct + '%';
}
