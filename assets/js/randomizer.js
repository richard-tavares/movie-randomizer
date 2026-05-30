const Randomizer = (() => {
  let overlay, yearMinEl, yearMaxEl, yearMinVal, yearMaxVal,
    ratingEl, ratingVal, countryEl, certMinEl, certMaxEl, certValEl, genreEl, streamingEl, contentTypeEl;

  const state = {
    contentTypes: [],
    genres: [],
    yearMin: 1990,
    yearMax: new Date().getFullYear(),
    minRating: 6,
    country: '',
    streaming: [],
    certMinIdx: 0,
    certMaxIdx: 5,
  };

  function _certLabel(minIdx, maxIdx) {
    if (minIdx === 0 && maxIdx === 5) return 'Todas';
    if (minIdx === maxIdx) return CERT_LABELS[minIdx];
    return `${CERT_LABELS[minIdx]} a ${CERT_LABELS[maxIdx]}`;
  }

  function init() {
    overlay = document.getElementById('randomizerModal');
    yearMinEl = document.getElementById('randYearMin');
    yearMaxEl = document.getElementById('randYearMax');
    yearMinVal = document.getElementById('randYearMinVal');
    yearMaxVal = document.getElementById('randYearMaxVal');
    ratingEl = document.getElementById('randRating');
    ratingVal = document.getElementById('randRatingVal');
    countryEl = document.getElementById('randCountry');
    certMinEl = document.getElementById('randCertMin');
    certMaxEl = document.getElementById('randCertMax');
    certValEl = document.getElementById('randCertVal');
    genreEl = document.getElementById('randGenres');
    streamingEl = document.getElementById('randStreaming');
    contentTypeEl = document.getElementById('randContentType');
    if (!overlay) return;

    populateSelect(streamingEl, STREAMING_PROVIDERS, { valueKey: 'id', labelKey: 'name', allLabel: 'Todas' });
    populateSelect(countryEl, COUNTRIES, { valueKey: 'code', labelKey: 'name', allLabel: 'Todos' });
    _buildGenreOptions();
    _bindControls();
    updateDualRange('randYearRange', yearMinEl, yearMaxEl);
    updateSingleRange('randRatingRange', ratingEl);
    updateDualRange('randCertRange', certMinEl, certMaxEl);
  }

  function _syncUI() {
    CustomSelect.refresh(genreEl);
    CustomSelect.refresh(streamingEl);
    CustomSelect.refresh(countryEl);
    CustomSelect.refresh(contentTypeEl);
  }

  function open() {
    if (!overlay) return;
    _syncUI();
    overlay.showModal();
    document.body.style.overflow = 'hidden';
    setTimeout(() => overlay.querySelector('.modal-close')?.focus(), 300);
  }

  function close() {
    if (!overlay) return;
    overlay.close();
    document.body.style.overflow = '';
  }

  function _buildGenreOptions() {
    if (!genreEl) return;
    const onlyTV = state.contentTypes.length > 0 && state.contentTypes.every(t => t === 'tv' || t === 'anime');
    const genreMap = onlyTV ? TV_GENRES : GENRES;

    genreEl.innerHTML = '<option value="">Todos</option>';
    Object.entries(genreMap).forEach(([id, name]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = name;
      genreEl.appendChild(opt);
    });
    state.genres = [];
    genreEl.dispatchEvent(new Event('change'));
  }

  function _bindControls() {
    yearMinEl?.addEventListener('input', () => {
      state.yearMin = +yearMinEl.value;
      if (state.yearMin > state.yearMax) {
        state.yearMax = state.yearMin;
        yearMaxEl.value = state.yearMin;
        yearMaxVal.textContent = state.yearMin;
      }
      yearMinVal.textContent = state.yearMin;
      updateDualRange('randYearRange', yearMinEl, yearMaxEl);
    });

    yearMaxEl?.addEventListener('input', () => {
      state.yearMax = +yearMaxEl.value;
      if (state.yearMax < state.yearMin) {
        state.yearMin = state.yearMax;
        yearMinEl.value = state.yearMax;
        yearMinVal.textContent = state.yearMax;
      }
      yearMaxVal.textContent = state.yearMax;
      updateDualRange('randYearRange', yearMinEl, yearMaxEl);
    });

    ratingEl?.addEventListener('input', () => {
      state.minRating = +ratingEl.value;
      ratingVal.textContent = Number(state.minRating).toFixed(1);
      updateSingleRange('randRatingRange', ratingEl);
    });

    countryEl?.addEventListener('change', () => { state.country = countryEl.value; });

    certMinEl?.addEventListener('input', () => {
      if (+certMinEl.value > +certMaxEl.value) certMaxEl.value = certMinEl.value;
      updateDualRange('randCertRange', certMinEl, certMaxEl);
      if (certValEl) certValEl.textContent = _certLabel(+certMinEl.value, +certMaxEl.value);
    });
    certMinEl?.addEventListener('change', () => {
      state.certMinIdx = +certMinEl.value;
      state.certMaxIdx = Math.max(state.certMaxIdx, state.certMinIdx);
    });
    certMaxEl?.addEventListener('input', () => {
      if (+certMaxEl.value < +certMinEl.value) certMinEl.value = certMaxEl.value;
      updateDualRange('randCertRange', certMinEl, certMaxEl);
      if (certValEl) certValEl.textContent = _certLabel(+certMinEl.value, +certMaxEl.value);
    });
    certMaxEl?.addEventListener('change', () => {
      state.certMaxIdx = +certMaxEl.value;
      state.certMinIdx = Math.min(state.certMinIdx, state.certMaxIdx);
    });

    genreEl?.addEventListener('change', () => {
      state.genres = Array.from(genreEl.selectedOptions).map(o => Number(o.value)).filter(Boolean);
    });

    streamingEl?.addEventListener('change', () => {
      state.streaming = Array.from(streamingEl.selectedOptions).map(o => Number(o.value)).filter(Boolean);
    });

    contentTypeEl?.addEventListener('change', () => {
      state.contentTypes = Array.from(contentTypeEl.selectedOptions).map(o => o.value);
      _buildGenreOptions();
    });

    overlay?.querySelector('.modal-close')?.addEventListener('click', close);
    overlay?.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay?.addEventListener('cancel', e => { e.preventDefault(); close(); });

    document.getElementById('randClear')?.addEventListener('click', reset);
    document.getElementById('randSubmit')?.addEventListener('click', submit);
  }

  function reset() {
    state.contentTypes = [];
    state.genres = [];
    state.yearMin = 1990;
    state.yearMax = new Date().getFullYear();
    state.minRating = 6;
    state.country = '';
    state.streaming = [];
    state.certification = null;

    Array.from(contentTypeEl?.options || []).forEach(o => { o.selected = false; });
    if (contentTypeEl) contentTypeEl.dispatchEvent(new Event('change'));

    if (yearMinEl) { yearMinEl.value = 1990; yearMinVal.textContent = 1990; }
    if (yearMaxEl) { yearMaxEl.value = new Date().getFullYear(); yearMaxVal.textContent = new Date().getFullYear(); }
    if (yearMinEl && yearMaxEl) updateDualRange('randYearRange', yearMinEl, yearMaxEl);
    if (ratingEl) { ratingEl.value = 6; ratingVal.textContent = '6.0'; updateSingleRange('randRatingRange', ratingEl); }
    if (countryEl) countryEl.value = '';
    state.certMinIdx = 0;
    state.certMaxIdx = 5;
    if (certMinEl && certMaxEl) {
      certMinEl.value = '0';
      certMaxEl.value = '5';
      updateDualRange('randCertRange', certMinEl, certMaxEl);
      if (certValEl) certValEl.textContent = 'Todas';
    }

    Array.from(genreEl?.options || []).forEach(o => { o.selected = false; });
    if (genreEl) genreEl.dispatchEvent(new Event('change'));

    Array.from(streamingEl?.options || []).forEach(o => { o.selected = false; });
    if (streamingEl) streamingEl.dispatchEvent(new Event('change'));
  }

  async function submit() {
    const btn = document.getElementById('randSubmit');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Sorteando...';

    try {
      const pool = state.contentTypes.length > 0 ? state.contentTypes : ['movie', 'tv', 'anime'];
      const contentType = pool[Math.floor(Math.random() * pool.length)];
      const result = await API.randomize({
        ...state,
        contentType,
        certMin: state.certMinIdx > 0 ? CERT_VALUES[state.certMinIdx] : null,
        certMax: state.certMaxIdx < 5 ? CERT_VALUES[state.certMaxIdx] : null,
      });
      close();
      RandResult.show(result, { ...state, contentType });
    } catch (err) {
      showToast(err.message || 'Erro ao sortear. Tente outros filtros.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-dice-five"></i> Sortear';
    }
  }

  async function quick(btn) {
    if (btn) btn.disabled = true;
    try {
      const movie = await API.randomize({
        genres: [], yearMin: 1990, yearMax: new Date().getFullYear(),
        minRating: 6, country: '', streaming: [],
      });
      RandResult.show(movie);
    } catch (err) {
      showToast(err.message || 'Erro ao sortear.', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  return { init, open, close, reset, submit, quick };
})();
