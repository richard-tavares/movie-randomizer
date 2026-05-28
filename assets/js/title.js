async function initTitlePage() {
  const params = new URLSearchParams(globalThis.location.search);
  const titleId = params.get('id');
  const contentType = params.get('type') || 'movie';

  if (!titleId) { globalThis.location.href = 'index.html'; return; }

  const isTV = contentType === 'tv' || contentType === 'anime';

  try {
    const [detail, credits, similar, providers] = await Promise.allSettled([
      isTV ? API.getTVShow(titleId) : API.getMovie(titleId),
      isTV ? API.getTVCredits(titleId) : API.getCredits(titleId),
      isTV ? API.getSimilarTV(titleId) : API.getSimilar(titleId),
      API.getWatchProviders(titleId, isTV ? 'tv' : 'movie'),
    ]);

    const item = detail.status === 'fulfilled' ? detail.value : null;
    if (!item) throw new Error('Conteúdo não encontrado.');

    item._type = contentType;

    _renderTypeBadge(contentType);
    _renderHero(item);
    _renderInfo(item, credits.value, contentType);
    _renderWatchProviders(providers.value);
    _renderCast(credits.value);
    _renderSimilar(similar.value, item, contentType);

    const displayTitle = item.title || item.name || 'Título';
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const typeLabel = CONTENT_TYPE_META[contentType]?.label || 'Filme';
    const desc = item.overview
      ? item.overview.slice(0, 155) + (item.overview.length > 155 ? '…' : '')
      : `${typeLabel} — Movie Randomizer`;
    setPageMeta({
      title: `${displayTitle}${year ? ` (${year})` : ''} — Movie Randomizer`,
      description: desc,
      image: posterUrl(item.poster_path, 'LG'),
      url: globalThis.location.href,
    });
  } catch (err) {
    console.error('Title page error:', err);
    document.getElementById('titleContent')?.insertAdjacentHTML('afterbegin', `
      <div class="loading-state" style="padding:var(--sp-24)">
        <i class="ph ph-smiley-sad" style="font-size:3rem"></i>
        <p class="text-muted">Não foi possível carregar este conteúdo.</p>
        <a href="index.html" class="btn btn-secondary">← Voltar ao início</a>
      </div>
    `);
  }
}

function _renderTypeBadge(contentType) {
  const el = document.getElementById('titleTypeBadge');
  if (!el) return;
  el.innerHTML = typeBadgeHtml(contentType);
}

function _renderHero(item) {
  const backdrop = document.getElementById('titleBackdrop');
  if (!backdrop) return;
  const url = backdropUrl(item.backdrop_path, 'LG') || backdropUrl(item.backdrop_path, 'SM');
  if (url) backdrop.style.backgroundImage = `url('${url}')`;
}

function _renderInfo(item, credits, contentType) {
  _renderPoster(item);
  _renderTitleBlock(item);
  _renderMetaRow(item, contentType);
  _renderGenres(item);
  setText('titleSynopsis', item.overview || 'Sinopse não disponível.');
  _renderDetailsGrid(item, credits, contentType);
  _initWatchlistBtns(item, contentType);
}

function _renderPoster(item) {
  const img = document.getElementById('titlePoster');
  if (!img) return;
  const url = posterUrl(item.poster_path, 'LG');
  if (url) { img.src = url; img.alt = item.title || item.name || ''; }
  else img.closest('.movie-poster')?.classList.add('no-poster');
}

function _renderTitleBlock(item) {
  setText('titleName', item.title || item.name || '');
  setText('titleTagline', item.tagline || '');
  setText('titleRatingValue', formatRating(item.vote_average));
  setText('titleVoteCount', item.vote_count > 0 ? `· ${item.vote_count.toLocaleString('pt-BR')} votos` : '');
  document.getElementById('titleTagline')?.style.setProperty('display', item.tagline ? '' : 'none');
}

function _renderMetaRow(item, contentType) {
  const metaRow = document.getElementById('titleMetaRow');
  if (!metaRow) return;
  const isTV = contentType === 'tv' || contentType === 'anime';
  const year = formatYear(item.release_date || item.first_air_date);
  const cert = isTV ? _getTVCertification(item) : getCertification(item);
  const _langNames = new Intl.DisplayNames(['pt-BR'], { type: 'language' });
  const _regionNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
  const langCode = item.spoken_languages?.[0]?.iso_639_1 || item.original_language || '';
  const countryCode = item.production_countries?.[0]?.iso_3166_1 || item.origin_country?.[0] || '';
  const lang = langCode ? (() => { try { return _langNames.of(langCode); } catch { return langCode; } })() : '';
  const country = countryCode ? (() => { try { return _regionNames.of(countryCode); } catch { return countryCode; } })() : '';

  let runtimeHtml = '';
  if (!isTV && item.runtime) {
    runtimeHtml = `<span class="movie-meta-item"><i class="ph ph-clock"></i> ${formatRuntime(item.runtime)}</span>`;
  } else if (isTV && item.number_of_seasons) {
    const s = item.number_of_seasons;
    runtimeHtml = `<span class="movie-meta-item"><i class="ph ph-list-numbers"></i> ${s} temporada${s === 1 ? '' : 's'}</span>`;
  }

  metaRow.innerHTML = [
    cert ? certBadgeHtml(cert) : '',
    year ? `<span class="movie-meta-item"><i class="ph ph-calendar-blank"></i> ${year}</span>` : '',
    runtimeHtml,
    lang ? `<span class="movie-meta-item"><i class="ph ph-globe"></i> ${escHtml(lang)}</span>` : '',
    country ? `<span class="movie-meta-item"><i class="ph ph-map-pin"></i> ${escHtml(country)}</span>` : '',
  ].filter(Boolean).join('');
}

function _getTVCertification(item) {
  const ratings = item.content_ratings?.results || [];
  const br = ratings.find(r => r.iso_3166_1 === 'BR');
  const us = ratings.find(r => r.iso_3166_1 === 'US');
  return (br || us)?.rating || '';
}

function _renderGenres(item) {
  const el = document.getElementById('titleGenres');
  if (el && item.genres?.length) {
    el.innerHTML = item.genres.map(g => `<span class="genre-tag">${escHtml(g.name)}</span>`).join('');
  }
}

function _buildTVRows(item) {
  const rows = [];
  const creators = item.created_by?.slice(0, 3).map(c => c.name).join(', ');
  if (creators) rows.push({ k: 'Criado por', v: creators });
  if (item.number_of_seasons) rows.push({ k: 'Temporadas', v: item.number_of_seasons });
  if (item.number_of_episodes) rows.push({ k: 'Episódios', v: item.number_of_episodes });
  if (item.status) rows.push({ k: 'Status', v: escHtml(item.status) });
  if (item.first_air_date) rows.push({ k: 'Estreia', v: formatDate(item.first_air_date) });
  if (item.last_air_date) rows.push({ k: 'Último Ep.', v: formatDate(item.last_air_date) });
  if (item.networks?.length) rows.push({ k: 'Rede', v: item.networks.slice(0, 2).map(n => escHtml(n.name)).join(', ') });
  if (item.vote_count > 0) rows.push({ k: 'Avaliações', v: item.vote_count.toLocaleString('pt-BR') });
  return rows;
}

function _buildMovieRows(item, credits) {
  const rows = [];
  const director = credits?.crew?.find(p => p.job === 'Director');
  const writers = credits?.crew?.filter(p => ['Screenplay', 'Writer', 'Story'].includes(p.job)).slice(0, 3);
  if (director) rows.push({ k: 'Direção', v: director.name });
  if (writers?.length) rows.push({ k: 'Roteiro', v: writers.map(w => w.name).join(', ') });
  if (item.budget > 0) rows.push({ k: 'Orçamento', v: formatMoney(item.budget) });
  if (item.revenue > 0) rows.push({ k: 'Bilheteria', v: formatMoney(item.revenue) });
  if (item.status) rows.push({ k: 'Status', v: escHtml(item.status) });
  if (item.release_date) rows.push({ k: 'Lançamento', v: formatDate(item.release_date) });
  if (item.production_companies?.length) rows.push({ k: 'Produção', v: item.production_companies.slice(0, 2).map(c => escHtml(c.name)).join(', ') });
  if (item.vote_count > 0) rows.push({ k: 'Avaliações', v: item.vote_count.toLocaleString('pt-BR') });
  return rows;
}

function _renderDetailsGrid(item, credits, contentType) {
  const grid = document.getElementById('titleDetails');
  if (!grid) return;
  const isTV = contentType === 'tv' || contentType === 'anime';
  const rows = isTV ? _buildTVRows(item) : _buildMovieRows(item, credits);
  grid.innerHTML = rows.map(r => `
    <div class="movie-detail-item">
      <div class="movie-detail-key">${r.k}</div>
      <div class="movie-detail-value">${r.v}</div>
    </div>
  `).join('');
}

function _dedupeProviders(list) {
  const normalize = name => name
    .replace(/^amazon\s+/i, '')
    .replace(/\s+(standard|basic|with ads|standard with ads|basic with ads|plus|premium).*$/i, '')
    .trim().toLowerCase();
  const seen = new Set();
  return list.filter(p => {
    const key = normalize(p.provider_name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function _renderWatchProviders(data) {
  const section = document.getElementById('watchProvidersInline');
  const content = document.getElementById('watchProvidersContent');
  if (!section || !content) return;

  const br = data?.results?.BR;
  const flatrate = _dedupeProviders(br?.flatrate || []);
  const rent = _dedupeProviders(br?.rent || []);
  const buy = _dedupeProviders(br?.buy || []);

  if (!flatrate.length && !rent.length && !buy.length) return;

  section.style.display = '';
  const groups = [];
  if (flatrate.length) groups.push({ label: 'Incluído na assinatura', items: flatrate });
  if (rent.length) groups.push({ label: 'Aluguel', items: rent });
  if (buy.length) groups.push({ label: 'Compra', items: buy });

  content.innerHTML = groups.map(g => `
    <div class="watch-provider-group">
      <div class="watch-provider-label">${g.label}</div>
      <div class="watch-provider-logos">
        ${g.items.map(p => `
          <div class="watch-provider-item" title="${escHtml(p.provider_name)}">
            <img src="${CONFIG.IMG_SM}${p.logo_path}" alt="${escHtml(p.provider_name)}" loading="lazy">
            <span>${escHtml(p.provider_name)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function _initWatchlistBtns(item, contentType) {
  const wantBtnMob = document.getElementById('btnWantMobile');
  const favBtnMob = document.getElementById('btnFavoriteMobile');
  const trailerBtn = document.getElementById('btnTrailer');
  const similarBtn = document.getElementById('btnRandSimilarInfo');

  function _updateWantBtn(isSaved) {
    if (!wantBtnMob) return;
    wantBtnMob.classList.toggle('active', isSaved);
    const icon = wantBtnMob.querySelector('i');
    if (icon) icon.className = isSaved ? 'ph ph-check' : 'ph ph-plus';
    const label = isSaved ? 'Remover Salvo' : 'Salvar';
    wantBtnMob.title = label;
    wantBtnMob.setAttribute('aria-label', label);
  }

  function _updateFavBtn(isFaved) {
    if (!favBtnMob) return;
    favBtnMob.classList.toggle('faved', isFaved);
    const icon = favBtnMob.querySelector('i');
    if (icon) icon.className = isFaved ? 'ph-fill ph-heart' : 'ph ph-heart';
    const label = isFaved ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
    favBtnMob.title = label;
    favBtnMob.setAttribute('aria-label', label);
  }

  function updateBtns() {
    const entry = Watchlist.getAll()[item.id];
    _updateWantBtn(!!entry?.want);
    _updateFavBtn(!!entry?.favorite);
  }

  function toggle(list) {
    const entry = Watchlist.getAll()[item.id];
    if (entry?.[list]) {
      Watchlist.remove(item.id, list);
      showToast('Removido da lista', 'info');
    } else {
      Watchlist.add(item, list);
      const labels = { want: 'Adicionado à lista!', favorite: 'Adicionado aos favoritos!' };
      showToast(labels[list], 'success');
    }
    updateBtns();
  }

  wantBtnMob?.addEventListener('click', () => toggle('want'));
  favBtnMob?.addEventListener('click', () => toggle('favorite'));

  trailerBtn?.addEventListener('click', () => Trailer.open(item.id, contentType));

  similarBtn?.addEventListener('click', async () => {
    similarBtn.disabled = true;
    similarBtn.innerHTML = '<i class="ph ph-spinner"></i> Sorteando...';
    try {
      const genres = item.genres?.map(g => g.id) || [];
      const minRating = Math.max((item.vote_average || 6) - 1.5, 5);
      const yearMin = Number.parseInt(formatYear(item.release_date || item.first_air_date) || '2000') - 15;
      const result = await API.randomize({
        contentType,
        genres,
        minRating,
        yearMin,
        yearMax: new Date().getFullYear(),
      });
      RandResult.show(result, { contentType, genres, minRating, yearMin, yearMax: new Date().getFullYear() });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      similarBtn.disabled = false;
      similarBtn.innerHTML = '<i class="ph ph-dice-five"></i> Sortear Similar';
    }
  });

  updateBtns();
}

function _renderCast(credits) {
  const track = document.getElementById('castTrack');
  if (!track) return;
  const cast = (credits?.cast || []).filter(p => p.profile_path).slice(0, 30);
  if (!cast.length) { track.closest('section')?.style.setProperty('display', 'none'); return; }

  track.innerHTML = '';
  cast.forEach(person => {
    const photo = `${CONFIG.IMG_MD}${person.profile_path}`;
    const el = document.createElement('a');
    el.className = 'cast-card';
    el.href = `person.html?id=${person.id}`;
    el.innerHTML = `
      <div class="cast-photo">
        <img src="${photo}" alt="${escHtml(person.name)}" loading="lazy">
      </div>
      <div class="cast-name">${escHtml(person.name)}</div>
      <div class="cast-character">${escHtml(person.character || person.roles?.[0]?.character || '')}</div>
    `;
    track.appendChild(el);
  });

  requestAnimationFrame(() => createCarousel(track)?.updateBtns());
}

function _renderSimilar(similar, currentItem, contentType) {
  const track = document.getElementById('similarTrack');
  if (!track) return;
  const items = (similar?.results || []).filter(m => m.poster_path && m.id !== currentItem.id).slice(0, 20);
  if (!items.length) { track.closest('section')?.style.setProperty('display', 'none'); return; }

  track.innerHTML = '';
  items.forEach(m => track.appendChild(buildCard(m, { type: contentType })));
  requestAnimationFrame(() => createCarousel(track));
}

document.addEventListener('DOMContentLoaded', initTitlePage);
