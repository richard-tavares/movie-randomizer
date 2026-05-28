(() => {
  const TODAY    = new Date().toISOString().split('T')[0];
  const fmtMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
  const fmtDay   = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });
  const fmtFull  = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  const MONTHS_PER_LOAD = 2;
  const MONTH_SAFETY    = 12;

  let activeType = 'movie';
  let loading = false;
  let _controller = null;
  const store      = { movie: [], tv: [], anime: [] };
  const nextOffset = { movie: 0, tv: 0, anime: 0 };
  const shownMonths = new Set();

  const contentEl = document.getElementById('upcomingContent');

  function fetchPages(fn, pages = 2) {
    return Promise.all(
      Array.from({ length: pages }, (_, i) => fn(i + 1).catch(() => ({ results: [] })))
    ).then(all => all.flatMap(r => r.results || []).filter(m => m.poster_path));
  }

  function dedup(arr) {
    return [...new Map(arr.map(i => [i.id, i])).values()];
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function calendarMonthInfo(offset) {
    const base = new Date();
    const d = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    const year  = d.getFullYear();
    const month = d.getMonth() + 1;
    const from  = offset === 0 ? TODAY : `${year}-${pad(month)}-01`;
    const to    = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;
    const key   = `${year}-${pad(month)}`;
    return { from, to, key };
  }

  async function loadMonthForType(type, offset) {
    const { from, to } = calendarMonthInfo(offset);
    let items;

    if (type === 'movie') {
      items = offset === 0
        ? await Promise.all([
            fetchPages(p => API.getUpcoming(p)),
            fetchPages(p => API.discover({
              'primary_release_date.gte': from, 'primary_release_date.lte': to,
              sort_by: 'primary_release_date.asc', 'vote_count.gte': 0, page: p,
            })),
          ]).then(([a, b]) => dedup([...a, ...b]))
        : await fetchPages(p => API.discover({
            'primary_release_date.gte': from, 'primary_release_date.lte': to,
            sort_by: 'primary_release_date.asc', 'vote_count.gte': 0, page: p,
          }));
    } else if (type === 'tv') {
      items = await fetchPages(p => API.discoverTV({
        'first_air_date.gte': from, 'first_air_date.lte': to,
        sort_by: 'first_air_date.asc', 'vote_count.gte': 0, page: p,
      }).then(stripAnime));
    } else {
      items = await fetchPages(p => API.discoverTV({
        with_original_language: 'ja', with_genres: '16',
        'first_air_date.gte': from, 'first_air_date.lte': to,
        sort_by: 'first_air_date.asc', 'vote_count.gte': 0, page: p,
      }));
    }

    store[type] = dedup([...store[type], ...items.map(m => ({ ...m, _type: type }))]);
  }

  function dateKey(item) {
    const d = item.release_date || item.first_air_date;
    return d ? d.slice(0, 7) : '9999-99';
  }

  function getMonthsWithContent() {
    const seen = new Set();
    return store[activeType]
      .filter(item => (item.release_date || item.first_air_date) >= TODAY)
      .map(dateKey)
      .filter(k => { if (seen.has(k)) { return false; } seen.add(k); return true; })
      .sort();
  }

  function getNewMonths() {
    return getMonthsWithContent().filter(k => !shownMonths.has(k));
  }

  async function ensureNewMonths(needed) {
    let safety = 0;
    while (getNewMonths().length < needed && safety < MONTH_SAFETY) {
      await loadMonthForType(activeType, nextOffset[activeType]++);
      safety++;
    }
    return getNewMonths().length >= needed;
  }

  function monthLabel(key) {
    const [year, month] = key.split('-');
    const date = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, 1);
    const name = fmtMonth.format(date);
    if (Number.parseInt(year, 10) === new Date().getFullYear()) return name;
    return `${name} de ${year}`;
  }

  function formatCardDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const date = new Date(Number.parseInt(y, 10), Number.parseInt(m, 10) - 1, Number.parseInt(d, 10));
    if (Number.parseInt(y, 10) === new Date().getFullYear()) return fmtDay.format(date);
    return fmtFull.format(date);
  }

  function getItemsForMonth(key) {
    return store[activeType]
      .filter(item => dateKey(item) === key && (item.release_date || item.first_air_date) >= TODAY)
      .sort((a, b) => {
        const da = a.release_date || a.first_air_date || '';
        const db = b.release_date || b.first_air_date || '';
        if (da !== db) return da.localeCompare(db);
        return (b.popularity || 0) - (a.popularity || 0);
      });
  }

  function buildCarousel(items, key) {
    const trackId = `upcomingTrack-${key}`;
    const wrap = document.createElement('div');
    wrap.className = 'carousel-wrap';
    wrap.innerHTML = `
      <button class="carousel-btn carousel-btn-prev" aria-label="Anterior">
        <i class="ph ph-caret-left"></i>
      </button>
      <div class="carousel-track-outer">
        <div class="carousel-track" id="${trackId}"></div>
      </div>
      <button class="carousel-btn carousel-btn-next" aria-label="Próximo">
        <i class="ph ph-caret-right"></i>
      </button>`;
    const track = wrap.querySelector(`#${trackId}`);
    for (const item of items) {
      const card = buildCard(item, { type: item._type });
      const dateStr = item.release_date || item.first_air_date;
      if (dateStr) {
        const badge = document.createElement('div');
        badge.className = 'upcoming-card-date';
        badge.textContent = formatCardDate(dateStr);
        card.querySelector('.content-card-info').appendChild(badge);
      }
      track.appendChild(card);
    }
    requestAnimationFrame(() => createCarousel(track)?.updateBtns());
    return wrap;
  }

  function buildGroupSection(key) {
    const items = getItemsForMonth(key);
    if (!items.length) return null;
    const plural = items.length === 1 ? 'título' : 'títulos';
    const section = document.createElement('div');
    section.className = 'upcoming-group';
    section.dataset.month = key;
    section.innerHTML = `
      <div class="upcoming-group-header">
        <h2 class="upcoming-group-label">${monthLabel(key)}</h2>
        <span class="upcoming-group-count">${items.length} ${plural}</span>
      </div>`;
    section.appendChild(buildCarousel(items, key));
    return section;
  }

  function appendMonths(keys) {
    const btn = contentEl.querySelector('.upcoming-load-more');
    for (const key of keys) {
      const section = buildGroupSection(key);
      if (!section) continue;
      shownMonths.add(key);
      btn ? btn.before(section) : contentEl.appendChild(section);
    }
  }

  function refreshLoadMoreBtn() {
    contentEl.querySelector('.upcoming-load-more')?.remove();
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary upcoming-load-more';
    btn.innerHTML = '<i class="ph ph-arrow-down"></i> Mostrar mais';
    btn.addEventListener('click', async () => {
      if (loading) return;
      loading = true;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner spinner-sm"></span>';
      try {
        const satisfied = await ensureNewMonths(MONTHS_PER_LOAD);
        const newKeys = getNewMonths().slice(0, MONTHS_PER_LOAD);
        if (newKeys.length) {
          appendMonths(newKeys);
        }
        if (satisfied) {
          refreshLoadMoreBtn();
        } else {
          showToast('Sem mais lançamentos previstos.', 'info');
          btn.remove();
        }
      } catch {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-arrow-down"></i> Mostrar mais';
      } finally {
        loading = false;
      }
    });
    contentEl.appendChild(btn);
  }

  function renderInitial() {
    contentEl.innerHTML = '';
    shownMonths.clear();
    const first = getMonthsWithContent().slice(0, MONTHS_PER_LOAD);
    if (first.length) {
      appendMonths(first);
    } else {
      contentEl.innerHTML = `
        <div class="empty-state">
          <i class="ph ph-calendar-x"></i>
          <p>Nenhum lançamento encontrado.</p>
        </div>`;
    }
    refreshLoadMoreBtn();
  }

  function _startLoad(type) {
    _controller?.abort();
    _controller = new AbortController();
    API.setAbortSignal(_controller.signal);
    activeType = type;
    loading = true;
    contentEl.innerHTML = `<div class="loading-state" role="status" aria-label="Carregando"><div class="spinner"></div></div>`;
  }

  function _endLoad() {
    loading = false;
    API.clearAbortSignal();
  }

  async function switchType(type) {
    _startLoad(type);
    try {
      await ensureNewMonths(MONTHS_PER_LOAD);
      renderInitial();
    } catch (e) {
      if (e.name === 'AbortError') return;
      contentEl.innerHTML = `
        <div class="empty-state">
          <i class="ph ph-warning"></i>
          <p>Erro ao carregar lançamentos.</p>
        </div>`;
    } finally {
      _endLoad();
    }
  }

  async function init() {
    _startLoad(activeType);
    try {
      await ensureNewMonths(MONTHS_PER_LOAD);
      renderInitial();
    } catch (e) {
      if (e.name === 'AbortError') return;
      contentEl.innerHTML = `
        <div class="empty-state">
          <i class="ph ph-warning"></i>
          <p>Erro ao carregar lançamentos.</p>
        </div>`;
    } finally {
      _endLoad();
    }
  }

  document.getElementById('upcomingTypeGroup')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-type]');
    if (!btn || loading) return;
    document.querySelectorAll('#upcomingTypeGroup .segmented-control-btn')
      .forEach(b => b.classList.toggle('active', b === btn));
    switchType(btn.dataset.type);
  });

  init();
})();
