let heroMovies = [];
let heroIndex = 0;
let heroTimer = null;
let _diceRafId = null;

async function initHero() {
  try {
    const data = await API.getTrendingAll('week');
    heroMovies = (data.results || []).filter(m => m.backdrop_path && m.poster_path && m.overview && m.media_type !== 'person').slice(0, 10);
    if (heroMovies.length) {
      renderHero(heroMovies[0], true);
      buildHeroDots();
      heroTimer = setInterval(advanceHero, 7000);
    }
  } catch (err) {
    console.warn('Hero failed:', err);
  }
}

function renderHero(movie, instant = false) {
  const backdrop = document.querySelector('.hero-backdrop');
  const titleEl = document.getElementById('heroTitle');
  const metaEl = document.getElementById('heroMeta');
  const synopsisEl = document.getElementById('heroSynopsis');
  const btns = document.getElementById('heroActions');
  if (!backdrop) return;

  const url = backdropUrl(movie.backdrop_path, 'LG') || backdropUrl(movie.backdrop_path, 'SM');

  function restartZoom() {
    backdrop.style.animation = 'none';
    backdrop.offsetHeight;
    backdrop.style.animation = '';
  }

  if (url) {
    if (instant) {
      backdrop.style.backgroundImage = `url('${url}')`;
      restartZoom();
    } else {
      backdrop.classList.add('fading');
      setTimeout(() => {
        backdrop.style.backgroundImage = `url('${url}')`;
        backdrop.classList.remove('fading');
        restartZoom();
      }, 600);
    }
  }

  if (titleEl) titleEl.textContent = movie.title || movie.name || '';
  if (metaEl) metaEl.innerHTML = _heroMeta(movie);
  if (synopsisEl) synopsisEl.textContent = movie.overview || '';

  if (btns) {
    btns.innerHTML = '';
    const contentType = getContentType(movie);
    btns.appendChild(buildActionButtons(movie, contentType));
  }

  updateHeroDot(heroIndex);
}

function _heroMeta(movie) {
  const parts = [];
  const year = formatYear(movie.release_date || movie.first_air_date);
  const rating = formatRating(movie.vote_average);
  if (rating !== '—') parts.push(`<span class="rating-value"><i class="ph-fill ph-star"></i> ${rating}</span>`);
  if (year) parts.push(`<span>${year}</span>`);
  if (movie.genre_ids?.length) parts.push(`<span>${formatGenres(movie.genre_ids, 2)}</span>`);
  parts.push(typeBadgeHtml(getContentType(movie)));
  return parts.join('<span class="dot"></span>');
}

function buildHeroDots() {
  const container = document.getElementById('heroDots');
  if (!container || !heroMovies.length) return;
  container.innerHTML = '';
  heroMovies.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Filme ${i + 1}`);
    dot.addEventListener('click', () => { heroIndex = i; renderHero(heroMovies[i]); resetHeroTimer(); });
    container.appendChild(dot);
  });
}

function updateHeroDot(idx) {
  document.querySelectorAll('.hero-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
    d.setAttribute('aria-current', i === idx ? 'true' : 'false');
  });
}

function advanceHero() {
  if (!heroMovies.length) return;
  heroIndex = (heroIndex + 1) % heroMovies.length;
  renderHero(heroMovies[heroIndex]);
}

function resetHeroTimer() {
  clearInterval(heroTimer);
  heroTimer = setInterval(advanceHero, 7000);
}

function initSearch() {
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const searchBtn = document.getElementById('searchBtn');
  const closeSearchBtn = document.getElementById('closeSearch');
  const clearSearchBtn = document.getElementById('clearSearch');

  const navbar = document.getElementById('navbar');

  function openSearch() {
    searchOverlay?.classList.add('open');
    navbar?.classList.add('search-active');
    setTimeout(() => searchInput?.focus(), 150);
  }
  function closeSearch() {
    searchOverlay?.classList.remove('open');
    navbar?.classList.remove('search-active');
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
  }
  function clearSearch() {
    if (searchInput) { searchInput.value = ''; searchInput.focus(); }
    if (searchResults) searchResults.innerHTML = '';
  }

  searchBtn?.addEventListener('click', openSearch);
  document.getElementById('searchBtnMobile')?.addEventListener('click', openSearch);
  closeSearchBtn?.addEventListener('click', closeSearch);
  clearSearchBtn?.addEventListener('click', clearSearch);
  searchOverlay?.addEventListener('click', e => { if (e.target === searchOverlay) closeSearch(); });

  const doSearch = debounce(async (query) => {
    if (!query || query.length < 2) { searchResults.innerHTML = ''; return; }
    searchResults.innerHTML = '<div class="search-loading"><i class="ph ph-magnifying-glass"></i> Buscando...</div>';
    try {
      const data = await API.searchMulti(query);
      const items = (data.results || []).filter(m => m.poster_path && m.media_type !== 'person').slice(0, 20);
      if (!items.length) { searchResults.innerHTML = '<div class="search-empty">Nenhum resultado encontrado.</div>'; return; }
      searchResults.innerHTML = '';
      items.forEach(m => searchResults.appendChild(buildCard(m, { lazy: false, type: m.media_type })));
    } catch {
      searchResults.innerHTML = '<div class="search-empty">Erro na busca.</div>';
    }
  }, 350);

  searchInput?.addEventListener('input', () => doSearch(searchInput.value));
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape' && searchOverlay?.classList.contains('open')) closeSearch();
  });
}

function initVibeSelector() {
  const grid = document.getElementById('vibeGrid');
  if (grid) {
    Object.entries(VIBES).forEach(([key, vibe]) => {
      const btn = document.createElement('button');
      btn.className = 'vibe-card';
      btn.dataset.vibe = key;
      btn.setAttribute('aria-label', `${vibe.label}: ${vibe.desc}`);
      btn.innerHTML = `
        <span class="vibe-icon"><i class="ph ${vibe.icon}"></i></span>
        <span class="vibe-label">${vibe.label}</span>
        <span class="vibe-desc">${vibe.desc}</span>
      `;
      grid.appendChild(btn);
    });
  }

  const cards = document.querySelectorAll('.vibe-card[data-vibe]');

  async function fetchVibe(vibe) {
    const vibeResultsWrap = document.getElementById('vibeResults');
    if (!vibeResultsWrap) return;

    const vibeLabel = VIBES[vibe]?.label ?? '';
    vibeResultsWrap.classList.remove('hidden');
    vibeResultsWrap.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-title-icon">
            <i class="ph ${VIBES[vibe]?.icon}"></i>
          </span> ${vibeLabel}
        </h2>
      </div>
      <div class="carousel-wrap">
        <button class="carousel-btn carousel-btn-prev" aria-label="${vibeLabel}: anterior">
          <i class="ph ph-caret-left"></i>
        </button>
        <div class="carousel-track-outer">
          <div class="carousel-track" id="vibeTrack"></div>
        </div>
        <button class="carousel-btn carousel-btn-next" aria-label="${vibeLabel}: próximo">
          <i class="ph ph-caret-right"></i>
        </button>
      </div>
    `;

    const track = document.getElementById('vibeTrack');
    if (!track) return;

    const cacheKey = `mr_vibe_${vibe}`;
    const cached = sessionGet(cacheKey);
    if (cached) {
      cached.forEach(m => track.appendChild(buildCard(m, { lazy: false })));
      requestAnimationFrame(() => createCarousel(track)?.updateBtns());
      return;
    }

    track.appendChild(buildSkeletonCards(8));

    try {
      const first = await API.getByMood(vibe, 1);
      const safeMax = Math.min(first.total_pages || 1, 3);
      const page = Math.floor(Math.random() * safeMax) + 1;
      const data = page === 1 ? first : await API.getByMood(vibe, page);
      const items = (data.results || []).filter(m => m.poster_path);
      track.innerHTML = '';
      if (!items.length) { track.innerHTML = '<p class="text-dimmed text-sm" style="padding:1rem">Nenhum filme encontrado.</p>'; return; }
      sessionSet(cacheKey, items);
      items.forEach(m => track.appendChild(buildCard(m, { lazy: false })));
      requestAnimationFrame(() => createCarousel(track)?.updateBtns());
    } catch (err) {
      if (err.name === 'AbortError') return;
      track.innerHTML = '<p class="text-dimmed text-sm" style="padding:1rem">Erro ao carregar.</p>';
    }
  }

  cards.forEach(card => {
    card.addEventListener('click', async () => {
      const vibe = card.dataset.vibe;
      const wasActive = card.classList.contains('active');
      cards.forEach(c => c.classList.remove('active'));
      if (wasActive) {
        document.getElementById('vibeResults')?.classList.add('hidden');
        return;
      }
      card.classList.add('active');
      await fetchVibe(vibe);
    });
  });
}

let _genreCurrentType = 'movie';
let _genreGen = 0;
let _genreController = null;

function _startGenreLoad(track) {
  _genreController?.abort();
  _genreController = new AbortController();
  API.setAbortSignal(_genreController.signal);
  track.innerHTML = '';
  track.appendChild(buildSkeletonCards(10));
}

function _endGenreLoad() {
  API.clearAbortSignal();
}

function _buildGenreStrip(contentType) {
  _genreCurrentType = contentType;
  const strip = document.getElementById('genreStrip');
  if (!strip) return;

  strip.innerHTML = '';

  const genreList = FEATURED_GENRES.filter(g => {
    if (contentType === 'anime') return g.mediaType === 'tv' || g.mediaType === 'both';
    if (contentType === 'tv') return g.mediaType === 'tv' || g.mediaType === 'both';
    return g.mediaType === 'movie' || g.mediaType === 'both';
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  genreList.forEach(g => {
    const pill = document.createElement('button');
    pill.className = 'genre-pill';
    pill.dataset.id = g.id;
    pill.innerHTML = escHtml(g.name);
    pill.addEventListener('click', async () => {
      strip.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const track = document.getElementById('genreCarouselTrack');
      if (!track) return;

      const cacheKey = `mr_genre_${contentType}_${g.id}`;
      const cached = sessionGet(cacheKey);
      if (cached) {
        track.innerHTML = '';
        cached.forEach(m => track.appendChild(buildCard(m, { type: contentType === 'anime' ? 'anime' : contentType })));
        requestAnimationFrame(() => createCarousel(track)?.updateBtns());
        return;
      }

      const gen = ++_genreGen;
      _startGenreLoad(track);

      try {
        let data;
        if (contentType === 'anime') {
          data = await API.discoverTV({ with_genres: g.id, with_original_language: 'ja', sort_by: 'popularity.desc' });
        } else if (contentType === 'tv') {
          data = await API.getByGenreTV(g.id);
        } else {
          data = await API.getByGenreMovies(g.id);
        }

        if (gen !== _genreGen) return;

        const items = (data.results || []).filter(m => m.poster_path);
        track.innerHTML = '';

        if (!items.length) {
          track.innerHTML = '<p class="text-dimmed text-sm" style="padding:1rem">Nenhum título encontrado.</p>';
          return;
        }

        sessionSet(cacheKey, items);
        items.forEach(m => track.appendChild(buildCard(m, { type: contentType === 'anime' ? 'anime' : contentType })));
        requestAnimationFrame(() => createCarousel(track)?.updateBtns());
      } catch (err) {
        if (gen !== _genreGen || err.name === 'AbortError') return;
        track.innerHTML = '<p class="text-dimmed text-sm" style="padding:1rem">Erro ao carregar. Tente novamente.</p>';
      } finally {
        _endGenreLoad();
      }
    });
    strip.appendChild(pill);
  });

  strip.querySelector('.genre-pill')?.click();
}

function initGenreStrip() {
  document.getElementById('genreTypeGroup')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    document.querySelectorAll('#genreTypeGroup .segmented-control-btn')
      .forEach(b => b.classList.toggle('active', b === btn));
    _buildGenreStrip(btn.dataset.type);
  });

  _buildGenreStrip('movie');
}

async function initDailyPick() {
  const card = document.getElementById('dailyPickCard');
  if (!card) return;
  const today = new Date().toISOString().substring(0, 10);
  const cached = sessionStorage.getItem('mr_daily_' + today);

  let movie;
  if (cached) {
    try { movie = JSON.parse(cached); } catch { }
  }

  if (!movie) {
    try {
      const page = (new Date().getDate() % 5) + 1;
      const data = await API.discover({ sort_by: 'vote_average.desc', 'vote_count.gte': 5000, page });
      const pool = (data.results || []).filter(m => m.backdrop_path && m.poster_path && m.overview);
      movie = pool[new Date().getDate() % pool.length];
      if (movie) sessionStorage.setItem('mr_daily_' + today, JSON.stringify(movie));
    } catch (err) {
      console.warn('Daily pick failed:', err);
      card.innerHTML = '<p class="text-dimmed text-sm">Indisponível.</p>';
      return;
    }
  }

  if (!movie) return;

  const poster = posterUrl(movie.poster_path, 'MD');
  const backdrop = backdropUrl(movie.backdrop_path, 'SM');
  const year = formatYear(movie.release_date);
  const rating = formatRating(movie.vote_average);
  const ctype = getContentType(movie);

  card.innerHTML = `
    <div class="daily-backdrop" style="background-image:url('${backdrop}')"></div>
    <div class="daily-poster"><img src="${poster}" alt="${escHtml(movie.title)}" loading="lazy"></div>
    <div class="daily-info">
      <div class="daily-title">${escHtml(movie.title || movie.name || '')}</div>
      <div class="daily-meta">
        ${rating === '—' ? '' : `<span class="rating-value"><i class="ph-fill ph-star"></i> ${rating}</span><span class="dot"></span>`}
        ${year ? `<span>${year}</span><span class="dot"></span>` : ''}
        ${movie.genre_ids?.length ? `<span>${formatGenres(movie.genre_ids, 2)}</span><span class="dot"></span>` : ''}
        ${typeBadgeHtml(ctype, 'badge-sm')}
      </div>
      <div class="daily-synopsis">${escHtml(movie.overview)}</div>
      <div class="daily-actions" id="dailyActions"></div>
    </div>
  `;

  document.getElementById('dailyActions')?.appendChild(buildActionButtons(movie, ctype));
}

function initRandDice() {
  document.getElementById('randomizerBtn')?.addEventListener('click', () => Randomizer.open());
}

function initDice3d() {
  const dice = document.getElementById('dice3d');
  if (!dice) return;

  let rx = 25, ry = 45, rz = 10;
  let vx = 0.25, vy = 0.18, vz = 0.12;
  let dragging = false;
  let lastX = 0, lastY = 0, lastT = 0;
  let damping = 0.985;
  let shakeX = 0, shakeY = 0;

  function tick() {
    rx += vx; ry += vy; rz += vz;
    vx *= damping; vy *= damping; vz *= damping;

    const t = performance.now() * 0.00018;
    vx += Math.sin(t * 1.3) * 0.003;
    vy += Math.cos(t * 1.0) * 0.003;
    vz += Math.sin(t * 0.7) * 0.002;

    shakeX *= 0.92; shakeY *= 0.92;
    dice.style.transform = `translate(${shakeX}px,${shakeY}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
    _diceRafId = requestAnimationFrame(tick);
  }

  function impulse(dx, dy, dt) {
    const power = (Math.sqrt(dx * dx + dy * dy) / Math.max(dt, 1)) * 0.12;
    vy += dx * power; vx -= dy * power;
    shakeX += dx * 0.2; shakeY += dy * 0.2;
  }

  dice.addEventListener('pointerdown', e => {
    e.preventDefault();
    dice.setPointerCapture(e.pointerId);
    dragging = true; damping = 0.80;
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
  });
  window.addEventListener('pointerup', () => { dragging = false; damping = 0.985; });
  window.addEventListener('pointermove', e => {
    if (!dragging) return;
    const now = performance.now();
    impulse(e.clientX - lastX, e.clientY - lastY, now - lastT);
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  });

  function applyShakeImpulse(force) {
    vx += (Math.random() - 0.5) * force;
    vy += (Math.random() - 0.5) * force;
    vz += (Math.random() - 0.5) * force * 0.6;
    shakeX += (Math.random() - 0.5) * force * 1.5;
    shakeY += (Math.random() - 0.5) * force * 1.5;
  }

  function registerDeviceMotion() {
    window.addEventListener('devicemotion', e => {
      const a = e.acceleration || e.accelerationIncludingGravity;
      if (!a) return;
      const ax = a.x || 0;
      const ay = a.y || 0;
      const az = a.z || 0;
      const total = Math.abs(ax) + Math.abs(ay) + Math.abs(az);
      if (total < 1.5) return;
      const scale = 0.1;
      vy += ax * scale;
      vx -= ay * scale;
      vz += az * scale * 0.4;
      shakeX += ax * 0.3;
      shakeY -= ay * 0.3;
    });
  }

  dice.addEventListener('click', () => {
    applyShakeImpulse(10);

    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(state => {
        if (state === 'granted') registerDeviceMotion();
      }).catch(() => { });
    }
  });

  if (typeof DeviceMotionEvent !== 'undefined') {
    if (typeof DeviceMotionEvent.requestPermission !== 'function') {
      registerDeviceMotion();
    }
  }

  tick();
}

let _hiddenGemsGen = 0;
let _hiddenGemsController = null;

function _startHiddenGemsLoad(track) {
  _hiddenGemsController?.abort();
  _hiddenGemsController = new AbortController();
  API.setAbortSignal(_hiddenGemsController.signal);
  track.innerHTML = '';
  track.appendChild(buildSkeletonCards(10));
}

function _endHiddenGemsLoad() {
  API.clearAbortSignal();
}

function _renderHiddenGems(track, items, type) {
  track.innerHTML = '';
  items.forEach(m => track.appendChild(buildCard(m, { type })));
  requestAnimationFrame(() => createCarousel(track)?.updateBtns());
}

async function _loadHiddenGems(type) {
  const track = document.getElementById('hiddenGemsTrack');
  if (!track) return;

  const cacheKey = `mr_hgems_${type}`;
  const cached = sessionGet(cacheKey);
  if (cached) {
    _renderHiddenGems(track, cached, type);
    return;
  }

  const fetchFns = { movie: API.getHiddenGemsMovies, tv: API.getHiddenGemsMoviesTV, anime: API.getHiddenGemsMoviesAnime };
  const fetchFn = fetchFns[type] ?? API.getHiddenGemsMovies;

  const gen = ++_hiddenGemsGen;
  _startHiddenGemsLoad(track);

  try {
    const first = await fetchFn(1);
    if (gen !== _hiddenGemsGen) return;

    const total = first.total_results || 0;
    const lastPageCount = total % 20 || 20;
    const fullPages = lastPageCount >= 10 ? (first.total_pages || 1) : Math.max(1, (first.total_pages || 1) - 1);
    const safeMax = Math.min(fullPages, 3);
    const page = Math.floor(Math.random() * safeMax) + 1;

    const data = page === 1 ? first : await fetchFn(page);
    if (gen !== _hiddenGemsGen) return;

    const items = (data.results || []).filter(m => m.poster_path);

    if (!items.length) {
      track.innerHTML = '<p class="text-dimmed text-sm" style="padding:1rem">Nenhum título encontrado.</p>';
      return;
    }

    sessionSet(cacheKey, items);
    _renderHiddenGems(track, items, type);
  } catch (err) {
    if (gen !== _hiddenGemsGen || err.name === 'AbortError') return;
    track.innerHTML = '<p class="text-dimmed text-sm" style="padding:1rem">Erro ao carregar. Tente novamente.</p>';
  } finally {
    _endHiddenGemsLoad();
  }
}

let _topRatedGen = 0;
let _topRatedController = null;

function _startTopRatedLoad(track) {
  _topRatedController?.abort();
  _topRatedController = new AbortController();
  API.setAbortSignal(_topRatedController.signal);
  track.innerHTML = '';
  track.appendChild(buildSkeletonCards(10));
}

function _endTopRatedLoad() {
  API.clearAbortSignal();
}

async function _loadTopRated(type) {
  const track = document.getElementById('topRatedTrack');
  if (!track) return;

  const cacheKey = `mr_toprated_${type}`;
  const cached = sessionGet(cacheKey);
  if (cached) {
    track.innerHTML = '';
    cached.forEach(m => track.appendChild(buildCard(m, { type })));
    requestAnimationFrame(() => createCarousel(track)?.updateBtns());
    return;
  }

  const fetchFns = { movie: API.getTopRatedMovies, tv: API.getTopRatedMoviesTV, anime: API.getTopRatedMoviesAnime };
  const fetchFn = fetchFns[type] ?? API.getTopRatedMovies;
  const gen = ++_topRatedGen;
  _startTopRatedLoad(track);

  try {
    const data = await fetchFn();
    if (gen !== _topRatedGen) return;

    const items = (data.results || []).filter(m => m.poster_path);

    if (!items.length) {
      track.innerHTML = '<p class="text-dimmed text-sm" style="padding:1rem">Nenhum título encontrado.</p>';
      return;
    }

    sessionSet(cacheKey, items);
    track.innerHTML = '';
    items.forEach(m => track.appendChild(buildCard(m, { type })));
    requestAnimationFrame(() => createCarousel(track)?.updateBtns());
  } catch (err) {
    if (gen !== _topRatedGen || err.name === 'AbortError') return;
    track.innerHTML = '<p class="text-dimmed text-sm" style="padding:1rem">Erro ao carregar. Tente novamente.</p>';
  } finally {
    _endTopRatedLoad();
  }
}

function initTopRated() {
  document.getElementById('topRatedTypeGroup')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    document.querySelectorAll('#topRatedTypeGroup .segmented-control-btn')
      .forEach(b => b.classList.toggle('active', b === btn));
    _loadTopRated(btn.dataset.type);
  });
  _loadTopRated('movie');
}

function initHiddenGems() {
  document.getElementById('hiddenGemsTypeGroup')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    document.querySelectorAll('#hiddenGemsTypeGroup .segmented-control-btn')
      .forEach(b => b.classList.toggle('active', b === btn));
    _loadHiddenGems(btn.dataset.type);
  });
  _loadHiddenGems('movie');
}

async function initHomePage() {
  initSearch();
  initRandDice();
  initDice3d();
  Randomizer.init();

  document.getElementById('randomizerBtnMobile')?.addEventListener('click', () => Randomizer.quick());
  initHero();
  initDailyPick();
  loadCarousel('nowPlayingTrack', () => API.getNowPlaying(), { type: 'movie' });
  initAiringTV();
  initAiringAnime();
  initVibeSelector();
  initTopRated();
  initHiddenGems();
  initGenreStrip();
  loadCarousel('trendingTrack', () => API.getTrendingMovies('week'), { type: 'movie' });
  loadCarousel('trendingTVTrack', () => API.getTrendingTV('week'), { type: 'tv' });
  loadCarousel('trendingAnimeTrack', () => API.getTrendingAnime(), { type: 'anime' });

  window.addEventListener('pagehide', () => {
    clearInterval(heroTimer);
    cancelAnimationFrame(_diceRafId);
  });
}

async function _initAiringSection(trackId, fetchFn, emptyMsg) {
  const track = document.getElementById(trackId);
  if (!track) return;

  track.innerHTML = '<div class="loading-state" role="status" aria-label="Carregando"><div class="spinner"></div></div>';

  try {
    const data = await fetchFn();
    const shows = (data.results || []).filter(s => s.poster_path).slice(0, 15);
    const details = await batchedAll(shows, s => API.getTVShow(s.id).catch(() => null), 5);

    track.innerHTML = '';
    let added = 0;
    details
      .filter(Boolean)
      .sort((a, b) => {
        const da = a.last_episode_to_air?.air_date || '';
        const db = b.last_episode_to_air?.air_date || '';
        return db.localeCompare(da);
      })
      .forEach(detail => {
        const card = buildAiringCard(detail);
        if (card) { track.appendChild(card); added++; }
      });

    if (!added) {
      track.innerHTML = `<p class="text-dimmed text-sm" style="padding:1rem">${emptyMsg}</p>`;
      return;
    }
    createCarousel(track);
  } catch {
    track.innerHTML = '<p class="text-dimmed text-sm" style="padding:1rem">Erro ao carregar.</p>';
  }
}

function initAiringAnime() {
  return _initAiringSection('airingAnimeTrack', () => API.getAiringAnime(), 'Nenhum anime disponível.');
}

function initAiringTV() {
  return _initAiringSection('airingTVTrack', () => API.getAiringTV(), 'Nenhuma série disponível.');
}

document.addEventListener('DOMContentLoaded', initHomePage);
