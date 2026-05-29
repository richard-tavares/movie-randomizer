function createCarousel(trackEl, opts = {}) {
  const { scrollAmount = null } = opts;
  const wrap = trackEl.closest('.carousel-wrap');
  if (!wrap) return;

  const prevBtn = wrap.querySelector('.carousel-btn-prev');
  const nextBtn = wrap.querySelector('.carousel-btn-next');

  let _cachedScrollAmount = scrollAmount;
  const _ro = new ResizeObserver(() => { _cachedScrollAmount = null; });
  _ro.observe(trackEl);

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

  prevBtn?.addEventListener('click', () => scrollBy(-1));
  nextBtn?.addEventListener('click', () => scrollBy(1));
  trackEl.addEventListener('scroll', throttle(updateBtns, 80), { passive: true });

  updateBtns();
  let touchStartX = 0;
  trackEl.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  trackEl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) scrollBy(dx < 0 ? 1 : -1);
  }, { passive: true });

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
