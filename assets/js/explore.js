const exploreState = {
  contentType: 'movie',
  genres: [],
  yearMin: 1950,
  yearMax: new Date().getFullYear(),
  minRating: 0,
  streaming: [],
  country: '',
  certification: '',
  sortBy: 'popularity.desc',
  query: '',
  page: 1,
  totalPages: 1,
  totalResults: 0,
};

function initExplorePage() {
  _readUrlParams();
  populateSelect(document.getElementById('exploreStreaming'), STREAMING_PROVIDERS, { valueKey: 'id', labelKey: 'name', allLabel: 'Todas' });
  populateSelect(document.getElementById('exploreCountry'), COUNTRIES, { valueKey: 'code', labelKey: 'name', allLabel: 'Todos' });
  _buildGenreOptions();
  _bindControls();
  _syncUI();
  _fetch();
}

function _readUrlParams() {
  const p = new URLSearchParams(globalThis.location.search);
  if (p.get('type')) exploreState.contentType = p.get('type');
  if (p.get('q')) exploreState.query = p.get('q');
  if (p.get('page')) exploreState.page = Math.max(1, Number.parseInt(p.get('page')) || 1);
}

function _buildGenreOptions() {
  const el = document.getElementById('exploreGenres');
  if (!el) return;

  const genreMap = (exploreState.contentType === 'tv' || exploreState.contentType === 'anime')
    ? TV_GENRES
    : GENRES;

  el.innerHTML = '<option value="">Todos</option>';
  Object.entries(genreMap)
    .filter(([id]) => !(exploreState.contentType === 'anime' && Number(id) === 16))
    .forEach(([id, name]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = name;
      el.appendChild(opt);
    });

  el.dispatchEvent(new Event('change'));
}

function _syncUI() {
  const yMin = document.getElementById('exploreYearMin');
  const yMax = document.getElementById('exploreYearMax');
  if (yMin) yMin.value = exploreState.yearMin;
  if (yMax) yMax.value = exploreState.yearMax;
  _updateYearVals();

  const rEl = document.getElementById('exploreRating');
  const rVal = document.getElementById('exploreRatingVal');
  if (rEl) rEl.value = exploreState.minRating;
  if (rVal) rVal.textContent = Number(exploreState.minRating).toFixed(1);
  if (rEl) updateSingleRange('exploreRatingRange', rEl);

  const sortEl = document.getElementById('exploreSort');
  if (sortEl) sortEl.value = exploreState.sortBy;

  const searchEl = document.getElementById('exploreSearch');
  if (searchEl) searchEl.value = exploreState.query;

  const countryEl = document.getElementById('exploreCountry');
  if (countryEl) countryEl.value = exploreState.country;

  const certSection = document.getElementById('exploreCertSection');
  if (certSection) certSection.style.display = exploreState.contentType === 'movie' ? '' : 'none';

  _syncPageHeader(sortEl);
}

function _syncPageHeader(sortEl) {
  const titles = { movie: 'Filmes', tv: 'Séries', anime: 'Animes' };
  const subs = { movie: 'Explore o catálogo completo de filmes', tv: 'Explore séries de todos os gêneros', anime: 'Os melhores animes em um só lugar' };
  const icons = { movie: 'ph-film-slate', tv: 'ph-television', anime: 'ph-star-four' };
  const titleEl = document.getElementById('explorePageTitle');
  if (titleEl) titleEl.innerHTML = `<span class="section-title-icon"><i class="ph ${icons[exploreState.contentType] || 'ph-magnifying-glass'}"></i></span> ${titles[exploreState.contentType] || 'Explorar'}`;
  setText('explorePageSub', subs[exploreState.contentType] || '');

  const releaseOpt = sortEl?.querySelector('option[value="release_date.desc"]');
  const oldOpt = sortEl?.querySelector('option[value="release_date.asc"]');
  if (releaseOpt) releaseOpt.textContent = exploreState.contentType === 'movie' ? 'Lançamento recente' : 'Estreia recente';
  if (oldOpt) oldOpt.textContent = 'Mais antigos';
}

function _updateYearVals() {
  const minEl = document.getElementById('exploreYearMinVal');
  const maxEl = document.getElementById('exploreYearMaxVal');
  if (minEl) minEl.textContent = exploreState.yearMin;
  if (maxEl) maxEl.textContent = exploreState.yearMax;
  const yMin = document.getElementById('exploreYearMin');
  const yMax = document.getElementById('exploreYearMax');
  if (yMin && yMax) updateDualRange('exploreYearRange', yMin, yMax);
}

function _bindControls() {
  const yMin = document.getElementById('exploreYearMin');
  const yMax = document.getElementById('exploreYearMax');
  yMin?.addEventListener('input', () => {
    exploreState.yearMin = Number(yMin.value);
    if (exploreState.yearMin > exploreState.yearMax) {
      exploreState.yearMax = exploreState.yearMin;
      if (yMax) yMax.value = exploreState.yearMin;
    }
    _updateYearVals();
  });
  yMin?.addEventListener('change', () => _go(1));
  yMax?.addEventListener('input', () => {
    exploreState.yearMax = Number(yMax.value);
    if (exploreState.yearMax < exploreState.yearMin) {
      exploreState.yearMin = exploreState.yearMax;
      if (yMin) yMin.value = exploreState.yearMax;
    }
    _updateYearVals();
  });
  yMax?.addEventListener('change', () => _go(1));

  const rEl = document.getElementById('exploreRating');
  rEl?.addEventListener('input', () => {
    exploreState.minRating = Number(rEl.value);
    const rVal = document.getElementById('exploreRatingVal');
    if (rVal) rVal.textContent = exploreState.minRating.toFixed(1);
    updateSingleRange('exploreRatingRange', rEl);
  });
  rEl?.addEventListener('change', () => _go(1));

  document.getElementById('exploreSort')?.addEventListener('change', (e) => {
    exploreState.sortBy = e.target.value;
    _go(1);
  });

  const searchEl = document.getElementById('exploreSearch');
  searchEl?.addEventListener('input', debounce(() => {
    exploreState.query = searchEl.value.trim();
    _go(1);
  }, 400));

  document.getElementById('exploreCountry')?.addEventListener('change', (e) => {
    exploreState.country = e.target.value;
    _go(1);
  });

  document.getElementById('exploreCert')?.addEventListener('change', (e) => {
    exploreState.certification = e.target.value;
    _go(1);
  });

  document.getElementById('exploreGenres')?.addEventListener('change', (e) => {
    exploreState.genres = Array.from(e.target.selectedOptions).map(o => Number(o.value)).filter(Boolean);
    _go(1);
  });

  document.getElementById('exploreStreaming')?.addEventListener('change', (e) => {
    exploreState.streaming = Array.from(e.target.selectedOptions).map(o => Number(o.value)).filter(Boolean);
    _go(1);
  });

  document.getElementById('exploreClearFilters')?.addEventListener('click', _clearFilters);
  document.getElementById('exploreFilterToggle')?.addEventListener('click', _openSidebar);
  document.getElementById('exploreSidebarOverlay')?.addEventListener('click', _closeSidebar);
}

function _openSidebar() {
  document.getElementById('exploreSidebar')?.classList.add('open');
  document.getElementById('exploreSidebarOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function _closeSidebar() {
  document.getElementById('exploreSidebar')?.classList.remove('open');
  document.getElementById('exploreSidebarOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

function _clearFilters() {
  exploreState.genres = [];
  exploreState.yearMin = 1950;
  exploreState.yearMax = new Date().getFullYear();
  exploreState.minRating = 0;
  exploreState.streaming = [];
  exploreState.country = '';
  exploreState.certification = '';
  exploreState.query = '';

  const certEl = document.getElementById('exploreCert');
  if (certEl) certEl.value = '';
  const countryEl = document.getElementById('exploreCountry');
  if (countryEl) countryEl.value = '';
  const searchEl = document.getElementById('exploreSearch');
  if (searchEl) searchEl.value = '';

  const genresEl = document.getElementById('exploreGenres');
  Array.from(genresEl?.options || []).forEach(o => { o.selected = false; });
  if (genresEl) genresEl.dispatchEvent(new Event('change'));

  const streamingEl = document.getElementById('exploreStreaming');
  Array.from(streamingEl?.options || []).forEach(o => { o.selected = false; });
  if (streamingEl) streamingEl.dispatchEvent(new Event('change'));

  _syncUI();
  _go(1);
}

let _fetchGen = 0;

function _go(page) {
  exploreState.page = page;
  _fetch();
  globalThis.scrollTo({ top: 0, behavior: 'smooth' });
}

async function _fetch() {
  const gen = ++_fetchGen;
  const grid = document.getElementById('exploreGrid');
  const countEl = document.getElementById('exploreCount');
  if (!grid) return;

  grid.innerHTML = '<div class="loading-state" style="grid-column:1/-1"><div class="spinner"></div></div>';
  if (countEl) countEl.textContent = '';

  try {
    let data;
    if (exploreState.query.length >= 2) {
      data = await API.exploreSearch(exploreState.query, exploreState.contentType, exploreState.page);
    } else {
      data = await API.exploreDiscover({
        contentType: exploreState.contentType,
        genres: exploreState.genres,
        yearMin: exploreState.yearMin > 1950 ? exploreState.yearMin : null,
        yearMax: exploreState.yearMax < new Date().getFullYear() ? exploreState.yearMax : null,
        minRating: exploreState.minRating > 0 ? exploreState.minRating : null,
        streaming: exploreState.streaming,
        country: exploreState.country,
        certification: exploreState.certification,
        sortBy: exploreState.sortBy,
      }, exploreState.page);
    }

    if (gen !== _fetchGen) return;

    exploreState.totalPages = Math.min(data.total_pages || 1, 500);
    exploreState.totalResults = data.total_results || 0;

    _renderGrid(data.results || []);
    _renderCount();
    _renderPagination();
  } catch (err) {
    if (gen !== _fetchGen) return;
    console.error('Explore fetch error:', err);
    grid.innerHTML = `
      <div class="loading-state" style="grid-column:1/-1">
        <i class="ph ph-warning" style="font-size:2rem;color:var(--clr-danger)"></i>
        <p class="text-muted">Erro ao carregar. Tente novamente.</p>
      </div>
    `;
  }
}

function _renderGrid(items) {
  const grid = document.getElementById('exploreGrid');
  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = `
      <div class="loading-state" style="grid-column:1/-1">
        <i class="ph ph-film-slash" style="font-size:3rem;opacity:.4"></i>
        <p class="text-muted">Nenhum resultado encontrado.<br>Tente ajustar os filtros.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = '';
  items.filter(item => item.poster_path).forEach(item => {
    item._type = exploreState.contentType;
    grid.appendChild(buildCard(item, { type: exploreState.contentType }));
  });
}

function _renderCount() {
  const el = document.getElementById('exploreCount');
  if (!el) return;
  const total = exploreState.totalResults.toLocaleString('pt-BR');
  el.innerHTML = `<strong>${total}</strong> resultado${exploreState.totalResults === 1 ? '' : 's'}`;
}

function _renderPagination() {
  const nav = document.getElementById('explorePagination');
  if (!nav) return;

  const cur = exploreState.page;
  const total = exploreState.totalPages;
  if (total <= 1) { nav.innerHTML = ''; return; }

  const pages = _pagesToShow(cur, total);
  let html = `
  <button class="page-btn" ${cur <= 1 ? 'disabled' : ''} data-page="${cur - 1}">
    <i class="ph ph-caret-left"></i>
  </button>`;

  pages.forEach(p => {
    if (p === '…') {
      html += `<span class="page-ellipsis">…</span>`;
    } else {
      html += `<button class="page-btn ${p === cur ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
  });

  html += `
  <button class="page-btn" ${cur >= total ? 'disabled' : ''} data-page="${cur + 1}">
    <i class="ph ph-caret-right"></i>
  </button>`;
  nav.innerHTML = html;

  nav.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => _go(Number(btn.dataset.page)));
  });
}

function _pagesToShow(cur, total) {
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (cur > 3) pages.push('…');
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
  if (cur < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

document.addEventListener('DOMContentLoaded', initExplorePage);
