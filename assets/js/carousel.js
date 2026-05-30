function createCarousel(trackEl, opts = {}) {
  const { scrollAmount = null } = opts;
  const wrap = trackEl.closest('.carousel-wrap');
  if (!wrap) return;

  trackEl._carouselAC?.abort();
  const ac = new AbortController();
  const { signal } = ac;
  trackEl._carouselAC = ac;

  const prevBtn = wrap.querySelector('.carousel-btn-prev');
  const nextBtn = wrap.querySelector('.carousel-btn-next');

  let _cachedScrollAmount = scrollAmount;
  const _ro = new ResizeObserver(() => { _cachedScrollAmount = null; });
  _ro.observe(trackEl);
  signal.addEventListener('abort', () => _ro.disconnect());

  function getScrollAmount() {
    if (_cachedScrollAmount) return _cachedScrollAmount;
    const firstCard = trackEl.querySelector('.content-card, .skeleton-card, .cast-card');
    if (!firstCard) return trackEl.clientWidth * 0.75;
    const style = getComputedStyle(trackEl);
    const gap = Number.parseFloat(style.gap) || 16;
    const visible = Math.floor(trackEl.clientWidth / (firstCard.offsetWidth + gap));
    _cachedScrollAmount = (firstCard.offsetWidth + gap) * Math.max(visible - 1, 1);
    return _cachedScrollAmount;
  }

  function updateBtns() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = trackEl.scrollLeft <= 2;
    nextBtn.disabled = trackEl.scrollLeft + trackEl.clientWidth >= trackEl.scrollWidth - 2;
  }

  function scrollBy(dir) {
    trackEl.scrollBy({ left: dir * getScrollAmount(), behavior: 'smooth' });
  }

  prevBtn?.addEventListener('click', () => scrollBy(-1), { signal });
  nextBtn?.addEventListener('click', () => scrollBy(1), { signal });
  trackEl.addEventListener('scroll', throttle(updateBtns, 80), { passive: true, signal });

  updateBtns();
  return { updateBtns, scrollBy };
}
async function loadCarousel(trackId, fetchFn, opts = {}) {
  const track = document.getElementById(trackId);
  if (!track) return;
  track.innerHTML = '';
  track.appendChild(buildSkeletonCards(opts.count || 10));

  try {
    const data = await fetchFn();
    const movies = (data.results || []).filter(m => m.poster_path);
    if (!movies.length) { track.innerHTML = '<p class="text-dimmed text-sm" style="padding:1rem">Nenhum filme encontrado.</p>'; return; }

    track.innerHTML = '';
    movies.slice(0, opts.max || 20).forEach(m => track.appendChild(buildCard(m, { type: opts.type })));
    const wrap = track.closest('.carousel-wrap');
    if (wrap) {
      requestAnimationFrame(() => {
        const c = createCarousel(track, opts);
        c?.updateBtns();
      });
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.warn('Carousel load failed:', err);
    track.innerHTML = `<p class="text-dimmed text-sm" style="padding:1rem">Erro ao carregar. Tente novamente.</p>`;
  }
}
