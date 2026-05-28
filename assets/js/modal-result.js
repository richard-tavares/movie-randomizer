const RandResult = (() => {
  let overlay = null;

  function _build() {
    const el = document.createElement('div');
    el.className = 'modal-overlay';
    el.id = 'randResultModal';
    el.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <div class="modal-title"><i class="ph ph-dice-five"></i> Sorteamos para você!</div>
          <button class="modal-close" aria-label="Fechar"><i class="ph ph-x"></i></button>
        </div>
        <div class="modal-body">
          <div class="rand-result">
            <div class="rand-result-poster"><img src="" alt="Poster do filme sorteado"></div>
            <div class="rand-result-info">
              <div class="rand-result-title"></div>
              <div class="rand-result-meta"></div>
              <div class="rand-result-genres"></div>
              <div class="rand-result-synopsis"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-icon btn-icon-lg rand-btn-wl" title="Salvar na lista" aria-label="Salvar na lista">
            <i class="ph ph-plus"></i>
          </button>
          <button class="btn-icon btn-icon-lg rand-btn-fav" title="Favoritar" aria-label="Favoritar">
            <i class="ph ph-heart"></i>
          </button>
          <button class="btn btn-secondary rand-btn-again">
            <span class="rand-dice-wrap">
              <i class="ph ph-dice-five rand-dice-icon"></i>
            </span>
            <span class="btn-label"> Sortear Outro</span>
          </button>
          <button class="btn btn-secondary rand-btn-detail">
            <i class="ph ph-info"></i>
            <span class="btn-label"> Detalhes</span>
          </button>
          <button class="btn btn-primary rand-btn-trailer">
            <i class="ph-fill ph-play"></i>
            <span class="trailer-label-full"> Assistir</span> Trailer
          </button>
        </div>
      </div>
    `;
    el.querySelector('.modal-close').addEventListener('click', close);
    el.addEventListener('click', e => { if (e.target === el) close(); });
    document.body.appendChild(el);
    initAllDice();
    return el;
  }

  function show(movie, queryState) {
    if (!overlay) overlay = _build();

    const _state = queryState || {
      genres: [], yearMin: 1990, yearMax: new Date().getFullYear(),
      minRating: 6, language: '', streaming: null,
    };

    const title    = movie.title || movie.name || 'Sem título';
    const ctype    = getContentType(movie);
    const typeLabel = CONTENT_TYPE_META[ctype]?.label || 'Filme';
    const year     = formatYear(movie.release_date || movie.first_air_date);
    const rating   = formatRating(movie.vote_average);
    const runtime  = movie.runtime ? formatRuntime(movie.runtime) : '';
    const poster   = posterUrl(movie.poster_path);
    const genres   = formatGenres(movie.genre_ids || []);
    const synopsis = movie.overview || 'Sinopse não disponível.';

    const posterEl = overlay.querySelector('.rand-result-poster');
    posterEl.querySelector('img').src = poster || '';
    posterEl.querySelector('img').style.display = poster ? '' : 'none';
    posterEl.style.cursor = 'pointer';
    posterEl.onclick = () => goToTitle(movie.id, ctype);
    overlay.querySelector('.rand-result-title').textContent = title;
    overlay.querySelector('.rand-result-synopsis').textContent = synopsis;

    overlay.querySelector('.rand-result-meta').innerHTML = [
      rating === '—' ? '' : `<span><i class="ph-fill ph-star"></i> ${rating}</span>`,
      year      ? `<span>${year}</span>`                               : '',
      runtime   ? `<span><i class="ph ph-clock"></i> ${runtime}</span>` : '',
      typeLabel ? `<span>${typeLabel}</span>`                           : '',
    ].filter(Boolean).join('<span style="opacity:.4">•</span>');

    overlay.querySelector('.rand-result-genres').innerHTML = genres
      ? genres.split(', ').map(g => `<span class="genre-tag">${escHtml(g)}</span>`).join('')
      : '';

    const trailerBtn = overlay.querySelector('.rand-btn-trailer');
    trailerBtn.onclick = () => Trailer.open(movie.id, ctype);

    const favBtn = overlay.querySelector('.rand-btn-fav');
    const isFaved = () => !!Watchlist.getAll()[movie.id]?.favorite;
    const updateFavBtn = () => {
      const faved = isFaved();
      favBtn.innerHTML = faved ? '<i class="ph-fill ph-heart"></i>' : '<i class="ph ph-heart"></i>';
      const lbl = faved ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
      favBtn.title = lbl; favBtn.setAttribute('aria-label', lbl);
    };
    updateFavBtn();
    favBtn.onclick = () => {
      if (isFaved()) {
        Watchlist.remove(movie.id, 'favorite');
        showToast(`"${title}" removido dos favoritos.`, 'info');
      } else {
        Watchlist.add(movie, 'favorite');
        showToast(`"${title}" adicionado aos favoritos!`, 'success');
      }
      updateFavBtn();
    };

    const detailBtn = overlay.querySelector('.rand-btn-detail');
    detailBtn.onclick = () => goToTitle(movie.id, ctype);

    const wlBtn = overlay.querySelector('.rand-btn-wl');
    const isSaved = () => !!Watchlist.getAll()[movie.id]?.want;
    const updateWlBtn = () => {
      const saved = isSaved();
      wlBtn.innerHTML = saved ? '<i class="ph ph-check"></i>' : '<i class="ph ph-plus"></i>';
      const lbl = saved ? 'Remover Salvo' : 'Salvar';
      wlBtn.title = lbl; wlBtn.setAttribute('aria-label', lbl);
    };
    updateWlBtn();
    wlBtn.onclick = () => {
      if (isSaved()) {
        Watchlist.remove(movie.id, 'want');
        showToast(`"${title}" removido da lista.`, 'info');
      } else {
        Watchlist.add(movie, 'want');
        showToast(`"${title}" adicionado à lista!`, 'success');
      }
      updateWlBtn();
    };

    const tryAgainBtn = overlay.querySelector('.rand-btn-again');
    tryAgainBtn.onclick = async () => {
      tryAgainBtn.disabled = true;
      tryAgainBtn.innerHTML = '<span class="spinner spinner-sm"></span>';
      try {
        let pool = ['movie'];
        if (_state.contentTypes?.length > 0) pool = _state.contentTypes;
        else if (_state.contentType) pool = [_state.contentType];
        const nextType = pool[Math.floor(Math.random() * pool.length)];
        const next = await API.randomize({ ..._state, contentType: nextType });
        show(next, _state);
      } catch (err) {
        showToast(err?.message || 'Erro ao sortear.', 'error');
      } finally {
        tryAgainBtn.disabled = false;
        tryAgainBtn.innerHTML = '<span class="rand-dice-wrap"><i class="ph ph-dice-five rand-dice-icon"></i></span><span class="btn-label"> Sortear Outro</span>';
        initAllDice();
      }
    };

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  return { show, close };
})();
