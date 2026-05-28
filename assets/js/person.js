async function initPersonPage() {
  const params = new URLSearchParams(globalThis.location.search);
  const personId = params.get('id');
  if (!personId) { globalThis.location.href = 'index.html'; return; }

  try {
    const [detail, credits] = await Promise.allSettled([
      API.getPerson(personId),
      API.getPersonCredits(personId),
    ]);

    const person = detail.status === 'fulfilled' ? detail.value : null;
    if (!person) throw new Error('Pessoa não encontrada.');

    document.title = `${person.name} — Movie Randomizer`;
    _renderProfile(person);
    _renderWorks(credits.value);
  } catch {
    document.getElementById('personContent')?.insertAdjacentHTML('afterbegin', `
      <div class="loading-state" style="padding:var(--sp-24)">
        <i class="ph ph-smiley-sad" style="font-size:3rem"></i>
        <p class="text-muted">Não foi possível carregar este perfil.</p>
        <a href="index.html" class="btn btn-secondary">← Voltar ao início</a>
      </div>
    `);
  }
}

function _renderProfile(person) {
  const photo = person.profile_path ? `${CONFIG.IMG_MD}${person.profile_path}` : null;
  const photoEl = document.getElementById('personPhoto');
  if (photoEl && photo) { photoEl.src = photo; photoEl.alt = person.name; }

  setText('personName', person.name);

  const depts = { Acting: 'Ator/Atriz', Directing: 'Direção', Writing: 'Roteiro', Production: 'Produção' };
  const meta = [];
  if (person.known_for_department) {
    meta.push(`<span><i class="ph ph-film-clapperboard"></i> ${escHtml(depts[person.known_for_department] || person.known_for_department)}</span>`);
  }
  if (person.birthday) {
    const birthYear = new Date(person.birthday).getFullYear();
    const age = person.deathday ? '' : ` · ${new Date().getFullYear() - birthYear} anos`;
    meta.push(`<span><i class="ph ph-calendar-blank"></i> ${formatDate(person.birthday)}${age}</span>`);
  }
  if (person.place_of_birth) {
    meta.push(`<span><i class="ph ph-map-pin"></i> ${escHtml(person.place_of_birth)}</span>`);
  }

  const metaEl = document.getElementById('personMeta');
  if (metaEl) metaEl.innerHTML = meta.join('');

  const bioEl = document.getElementById('personBio');
  const bioSection = document.getElementById('personBioSection');
  if (bioEl && bioSection) {
    if (person.biography) {
      bioEl.textContent = person.biography;
    } else {
      bioSection.style.display = 'none';
    }
  }
}

function _renderWorks(credits) {
  const grid = document.getElementById('personWorksGrid');
  if (!grid) return;

  const _selfTerms = ['Himself', 'Herself', 'Self', 'Narrator', 'Host'];
  const _isSelfAppearance = m => m.character && _selfTerms.some(t => m.character.startsWith(t));

  const all = [...(credits?.cast || []), ...(credits?.crew || [])];
  const deduped = [...new Map(
    all.filter(m => m.poster_path && (m.vote_count || 0) >= 20 && !_isSelfAppearance(m))
      .map(m => [m.id, m])
  ).values()];
  const sorted = deduped.toSorted((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 60);

  if (!sorted.length) {
    grid.innerHTML = '<p class="text-muted" style="padding:1rem">Nenhum trabalho encontrado.</p>';
    return;
  }

  sorted.forEach(item => {
    item._type = item.media_type === 'tv' ? 'tv' : 'movie';
    grid.appendChild(buildCard(item, { type: item._type }));
  });
}

document.addEventListener('DOMContentLoaded', initPersonPage);
