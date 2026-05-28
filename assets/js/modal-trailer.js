function _renderTrailerModal() {
  if (document.getElementById('trailerModal')) return;
  const el = document.createElement('dialog');
  el.className = 'modal-overlay';
  el.id = 'trailerModal';
  el.setAttribute('aria-labelledby', 'trailerModalTitle');
  el.innerHTML = `
    <div class="modal-box modal-box-trailer">
      <div class="modal-header">
        <div class="modal-title" id="trailerModalTitle">
          <i class="ph-fill ph-youtube-logo"></i> Trailer</div>
        <button class="modal-close" id="trailerModalClose" aria-label="Fechar">
          <i class="ph ph-x"></i>
        </button>
      </div>
      <div class="modal-body modal-body-trailer">
        <div class="trailer-embed-wrap" id="trailerEmbedWrap">
          <iframe id="trailerIframe" allowfullscreen allow="autoplay; encrypted-media" frameborder="0"></iframe>
          <div class="trailer-no-content" id="trailerNoContent" style="display:none">
            <i class="ph-fill ph-youtube-logo"></i>
            <p>Trailer Indisponível</p>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  document.getElementById('trailerModalClose')?.addEventListener('click', () => Trailer.close());
  el.addEventListener('click', e => { if (e.target === el) Trailer.close(); });
  el.addEventListener('cancel', e => { e.preventDefault(); Trailer.close(); });
}

const Trailer = (() => {
  function _modal() { return document.getElementById('trailerModal'); }

  async function open(id, type) {
    const modal = _modal();
    if (!modal) return;
    const iframe = document.getElementById('trailerIframe');
    const noContent = document.getElementById('trailerNoContent');
    if (iframe) { iframe.src = ''; iframe.style.display = ''; }
    if (noContent) noContent.style.display = 'none';
    modal.showModal();
    document.body.style.overflow = 'hidden';
    try {
      const data = await (type === 'tv' ? API.getTVVideos(id) : API.getVideos(id));
      const t = (data.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube')
        || (data.results || []).find(v => v.site === 'YouTube');
      if (t && iframe) {
        iframe.src = `https://www.youtube.com/embed/${t.key}?autoplay=1&rel=0`;
      } else {
        if (iframe) iframe.style.display = 'none';
        if (noContent) noContent.style.display = '';
      }
    } catch {
      if (iframe) iframe.style.display = 'none';
      if (noContent) noContent.style.display = '';
    }
  }

  function close() {
    const iframe = document.getElementById('trailerIframe');
    const noContent = document.getElementById('trailerNoContent');
    if (iframe) { iframe.src = ''; iframe.style.display = ''; }
    if (noContent) noContent.style.display = 'none';
    _modal()?.close();
    document.body.style.overflow = '';
  }

  return { open, close };
})();

document.addEventListener('DOMContentLoaded', _renderTrailerModal);
