function _renderWatchlistModal() {
  if (document.getElementById('watchlistModal')) {
    initWatchlistModal();
    return;
  }
  const el = document.createElement('dialog');
  el.className = 'modal-overlay';
  el.id = 'watchlistModal';
  el.setAttribute('aria-labelledby', 'wlModalTitle');
  el.innerHTML = `
    <div class="modal-box modal-box-wide">
      <div class="modal-header">
        <div class="modal-title" id="wlModalTitle">
          <i class="ph ph-bookmark-simple"></i> Minha Lista
        </div>
        <button class="modal-close" aria-label="Fechar">
          <i class="ph ph-x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="watchlist-tabs" role="tablist">
          <button class="watchlist-tab active" data-list="want" role="tab">
            <i class="ph ph-check"></i> Salvos
          </button>
          <button class="watchlist-tab" data-list="favorite" role="tab">
            <i class="ph-fill ph-heart"></i> Favoritos
          </button>
        </div>
        <div class="watchlist-grid" id="watchlistGrid" aria-live="polite"></div>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  initWatchlistModal();
}

function initWatchlistModal() {
  const overlay = document.getElementById('watchlistModal');
  const openBtn = document.getElementById('wlBtn');
  const openBtnMobile = document.getElementById('wlBtnMobile');
  const closeBtn = overlay?.querySelector('.modal-close');
  const tabs = overlay?.querySelectorAll('.watchlist-tab');

  function openWl() {
    if (!overlay) return;
    overlay.showModal();
    document.body.style.overflow = 'hidden';
    renderWatchlist('want');
    overlay.querySelector('.watchlist-tab[data-list="want"]')?.classList.add('active');
    overlay.querySelectorAll('.watchlist-tab:not([data-list="want"])').forEach(t => t.classList.remove('active'));
  }
  function closeWl() {
    if (!overlay) return;
    overlay.close();
    document.body.style.overflow = '';
  }

  openBtn?.addEventListener('click', openWl);
  openBtnMobile?.addEventListener('click', openWl);
  closeBtn?.addEventListener('click', closeWl);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeWl(); });
  overlay?.addEventListener('cancel', e => { e.preventDefault(); closeWl(); });

  tabs?.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderWatchlist(tab.dataset.list);
    });
  });

  globalThis.addEventListener('watchlist:change', () => {
    const activeTab = overlay?.querySelector('.watchlist-tab.active');
    if (overlay?.open && activeTab) renderWatchlist(activeTab.dataset.list);
    _updateWlBadge();
  });
}

function renderWatchlist(list) {
  const grid = document.getElementById('watchlistGrid');
  if (!grid) return;

  const items = Watchlist.getList(list);
  if (!items.length) {
    const labels = { want: 'Nenhum título na sua lista', favorite: 'Nenhum favorito' };
    grid.innerHTML = `
      <div class="watchlist-empty">
        <div class="watchlist-empty-icon">
          <i class="ph ph-bookmark-simple"></i>
        </div>
        <div class="watchlist-empty-text">${labels[list] || 'Lista vazia'}<br>Explore e adicione filmes!</div>
      </div>
    `;
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  grid.innerHTML = '';
  items.sort((a, b) => b.addedAt - a.addedAt).forEach(({ movie }) => {
    const el = document.createElement('div');
    el.className = 'watchlist-item';
    const poster = posterUrl(movie.poster_path, 'SM');
    const releaseDate = movie.release_date || movie.first_air_date;
    const isUpcoming = releaseDate && releaseDate > today;
    const title = movie.title || movie.name || '';
    const year = formatYear(movie.release_date || movie.first_air_date);
    el.innerHTML = `
      <div class="watchlist-item-poster">
        ${poster
          ? `<img src="${poster}" alt="${escHtml(title)}" loading="lazy">`
          : `<div class="no-poster" style="aspect-ratio:2/3">
              <span class="no-poster-icon">
                <i class="ph ph-film-slate"></i>
              </span>
            </div>`
          }
        ${isUpcoming ? '<span class="watchlist-item-badge">Em Breve</span>' : ''}
        <button class="watchlist-item-remove" data-id="${movie.id}" aria-label="Remover">
          <i class="ph ph-trash"></i>
        </button>
      </div>
      <div class="watchlist-item-info">
        <div class="watchlist-item-title">${escHtml(title)}</div>
        ${year ? `<div class="watchlist-item-year">${year}</div>` : ''}
      </div>
    `;
    el.addEventListener('click', e => {
      if (e.target.closest('.watchlist-item-remove')) return;
      if (globalThis.matchMedia('(hover: none)').matches) {
        if (el.classList.contains('show-remove')) {
          el.classList.remove('show-remove');
        } else {
          grid.querySelectorAll('.watchlist-item.show-remove').forEach(i => i.classList.remove('show-remove'));
          el.classList.add('show-remove');
        }
      } else {
        goToTitle(movie.id, getContentType(movie));
      }
    });
    el.querySelector('.watchlist-item-remove').addEventListener('click', e => {
      e.stopPropagation();
      Watchlist.remove(movie.id);
    });
    grid.appendChild(el);
  });
}

document.addEventListener('DOMContentLoaded', _renderWatchlistModal);
