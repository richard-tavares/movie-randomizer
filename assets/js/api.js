const API = (() => {
  const headers = {
    'Authorization': `Bearer ${CONFIG.BEARER}`,
    'Content-Type': 'application/json',
  };

  const _cache = new Map();
  const _CACHE_TTL = 5 * 60 * 1000;
  let _abortSignal = null;

  function setAbortSignal(s) { _abortSignal = s; }
  function clearAbortSignal() { _abortSignal = null; }

  async function request(endpoint, params = {}) {
    const url = new URL(`${CONFIG.BASE}${endpoint}`);
    url.searchParams.set('language', CONFIG.LANG);
    for (const [k, v] of Object.entries(params)) {
      if (v !== null && v !== undefined && v !== '') {
        url.searchParams.set(k, v);
      }
    }
    const key = url.toString();
    const hit = _cache.get(key);
    if (hit && Date.now() - hit.ts < _CACHE_TTL) return hit.data;

    const signal = _abortSignal;
    const res = await fetch(key, { headers, ...(signal ? { signal } : {}) });
    if (!res.ok) throw new Error(`TMDB ${res.status}: ${res.statusText}`);
    const data = await res.json();
    _cache.set(key, { data, ts: Date.now() });
    return data;
  }
  function getTrendingMovies(window = 'week') { return request(`/trending/movie/${window}`); }
  function getTrendingAll(window = 'week') { return request(`/trending/all/${window}`); }
  function getNowPlaying(page = 1) { return request('/movie/now_playing', { page }); }
  function getTopRatedMovies(page = 1) {
    return discover({
      sort_by: 'vote_average.desc',
      'vote_count.gte': 20000,
      page,
    });
  }
  function getTopRatedTV(page = 1) {
    return discoverTV({
      sort_by: 'vote_average.desc',
      'vote_count.gte': 10000,
      without_genres: '16',
      page,
    });
  }
  function getTopRatedAnime(page = 1) {
    return discoverTV({
      sort_by: 'vote_average.desc',
      'vote_count.gte': 2000,
      with_genres: '16',
      with_original_language: 'ja',
      page,
    });
  }
  function getUpcoming(page = 1) { return request('/movie/upcoming', { page }); }

  function discover(params = {}) {
    return request('/discover/movie', {
      sort_by: 'popularity.desc',
      'vote_count.gte': 50,
      ...params,
    });
  }

  function _oneYearAgo() {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().substring(0, 10);
  }

  function getHiddenGemsMovies(page = 1) {
    return discover({
      sort_by: 'vote_average.desc',
      'vote_count.gte': 2000,
      'vote_count.lte': 5000,
      'vote_average.gte': 8,
      'popularity.lte': 5,
      'primary_release_date.lte': _oneYearAgo(),
      without_genres: '99,10402,10770,16,36,10752',
      page,
    });
  }

  function getHiddenGemsTV(page = 1) {
    return discoverTV({
      sort_by: 'vote_average.desc',
      'vote_count.gte': 500,
      'vote_count.lte': 1000,
      'vote_average.gte': 8,
      'popularity.lte': 5,
      'first_air_date.lte': _oneYearAgo(),
      without_genres: '16,99,10764,10767,36,10768',
      page,
    });
  }

  function getHiddenGemsAnime(page = 1) {
    return discoverTV({
      sort_by: 'vote_average.desc',
      'vote_count.gte': 50,
      'vote_count.lte': 100,
      'vote_average.gte': 8,
      'popularity.lte': 5,
      'first_air_date.lte': _oneYearAgo(),
      with_origin_country: 'JP',
      with_genres: '16',
      with_original_language: 'ja',
      without_genres: '99,10764,10767',
      page,
    });
  }

  function getByGenreMovies(genreId, page = 1) {
    return discover({ with_genres: genreId, sort_by: 'popularity.desc', page });
  }

  function getByMood(moodKey, page = 1, contentType = 'movie') {
    const mood = VIBES[moodKey];
    if (!mood) throw new Error(`Unknown mood: ${moodKey}`);
    const isTV = contentType === 'tv' || contentType === 'anime';
    const params = { ...mood.params, page };
    if (contentType === 'anime') {
      params.with_original_language = 'ja';
      params.with_genres = params.with_genres ? `16,${params.with_genres}` : '16';
    }
    return isTV ? discoverTV(params) : discover(params);
  }
  function getTrendingTV(window = 'week') { return request(`/trending/tv/${window}`).then(stripAnime); }
  function getAiringTV(page = 1) { return request('/tv/on_the_air', { page }).then(stripAnime); }
  function getAiringAnime(page = 1) {
    const today = new Date().toISOString().split('T')[0];
    const past = new Date(Date.now() - 21 * 86400000).toISOString().split('T')[0];
    return discoverTV({ with_original_language: 'ja', with_genres: '16', 'air_date.gte': past, 'air_date.lte': today, sort_by: 'popularity.desc', page });
  }

  function discoverTV(params = {}) {
    return request('/discover/tv', {
      sort_by: 'popularity.desc',
      'vote_count.gte': 20,
      ...params,
    });
  }

  function getByGenreTV(genreId, page = 1) {
    return discoverTV({ with_genres: genreId, sort_by: 'popularity.desc', page }).then(stripAnime);
  }
  function getTrendingAnime(page = 1) {
    return discoverTV({
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
      'vote_count.gte': 50,
      page,
    });
  }
  function getMovie(id) { return request(`/movie/${id}`, { append_to_response: 'release_dates' }); }
  function getCredits(id) { return request(`/movie/${id}/credits`); }
  function getVideos(id) { return request(`/movie/${id}/videos`); }
  function getSimilar(id, page = 1) { return request(`/movie/${id}/similar`, { page }); }
  function getImages(id) { return request(`/movie/${id}/images`, { include_image_language: 'en,null' }); }
  function getReleaseDates(id) { return request(`/movie/${id}/release_dates`); }
  function getTVShow(id) { return request(`/tv/${id}`, { append_to_response: 'content_ratings' }); }
  function getTVCredits(id) { return request(`/tv/${id}/credits`); }
  function getTVVideos(id) { return request(`/tv/${id}/videos`); }
  function getSimilarTV(id, page = 1) { return request(`/tv/${id}/similar`, { page }); }
  function getWatchProviders(id, type = 'movie') {
    return request(`/${type}/${id}/watch/providers`);
  }
  function getPerson(id) { return request(`/person/${id}`); }
  function getPersonCredits(id) { return request(`/person/${id}/combined_credits`); }
  function search(query, page = 1) {
    if (!query || query.trim().length < 2) return Promise.resolve({ results: [] });
    return request('/search/movie', { query: query.trim(), page });
  }

  function searchMulti(query, page = 1) {
    if (!query || query.trim().length < 2) return Promise.resolve({ results: [] });
    return request('/search/multi', { query: query.trim(), page });
  }
  function getGenres() { return request('/genre/movie/list'); }
  function getGenresTV() { return request('/genre/tv/list'); }
  async function randomize(filters = {}) {
    const { contentType = 'movie' } = filters;
    const params = _buildDiscoverParams(filters);
    const isTV = contentType === 'tv' || contentType === 'anime';

    for (let attempt = 0; attempt < 3; attempt++) {
      const maxPage = Math.min(filters.maxPage || 8, 500);
      const page = Math.floor(Math.random() * maxPage) + 1;
      try {
        let data = isTV
          ? await discoverTV({ ...params, page })
          : await discover({ ...params, page });
        if (contentType === 'tv') stripAnime(data);
        if (!data.results?.length) continue;
        const candidates = data.results.filter(m => m.poster_path && m.overview);
        const pool = candidates.length ? candidates : data.results;
        const item = pool[Math.floor(Math.random() * pool.length)];
        if (item) {
          item._type = contentType;
          return item;
        }
      } catch {
      }
    }
    throw new Error('Nenhum conteúdo encontrado com esses filtros. Tente ajustá-los.');
  }

  function _buildDiscoverParams(f) {
    const p = {};
    const isTV = f.contentType === 'tv' || f.contentType === 'anime';
    const dateGte = isTV ? 'first_air_date.gte' : 'release_date.gte';
    const dateLte = isTV ? 'first_air_date.lte' : 'release_date.lte';

    if (f.contentType === 'anime') {
      p.with_genres = '16';
      p.with_original_language = 'ja';
    } else if (f.genres?.length) {
      p.with_genres = f.genres.join(',');
    }

    if (f.yearMin) p[dateGte] = `${f.yearMin}-01-01`;
    if (f.yearMax) p[dateLte] = `${f.yearMax}-12-31`;
    if (f.minRating) p['vote_average.gte'] = f.minRating;
    if (f.country && f.contentType !== 'anime') p.with_origin_country = f.country;
    if (f.streaming?.length) {
      p.with_watch_providers = f.streaming.join('|');
      p.watch_region = 'BR';
    }
    if (f.certification && !isTV) {
      p.certification_country = 'BR';
      p['certification.lte'] = f.certification;
    }

    switch (f.type) {
      case 'underrated':
        p['vote_count.gte'] = 50;
        p['vote_count.lte'] = 1000;
        p['vote_average.gte'] = Math.max(f.minRating || 0, 7);
        p.sort_by = 'vote_average.desc';
        break;
      case 'mainstream':
        p['vote_count.gte'] = 5000;
        p.sort_by = 'popularity.desc';
        break;
      case 'recent':
        p[dateGte] = `${new Date().getFullYear() - 2}-01-01`;
        break;
      case 'classic':
        p[dateLte] = '1990-12-31';
        break;
      case 'cult':
        p['vote_count.gte'] = 300;
        p['vote_average.gte'] = Math.max(f.minRating || 0, 6.5);
        p.sort_by = 'vote_average.desc';
        break;
    }
    return p;
  }
  function _buildExploreParams(filters) {
    const { contentType = 'movie' } = filters;
    const isTV = contentType === 'tv' || contentType === 'anime';
    const dateGte = isTV ? 'first_air_date.gte' : 'release_date.gte';
    const dateLte = isTV ? 'first_air_date.lte' : 'release_date.lte';
    const p = {};

    if (filters.sortBy) p.sort_by = filters.sortBy;
    if (filters.yearMin) p[dateGte] = `${filters.yearMin}-01-01`;
    if (filters.yearMax) p[dateLte] = `${filters.yearMax}-12-31`;
    if (filters.minRating) p['vote_average.gte'] = filters.minRating;
    if (filters.country) p.with_origin_country = filters.country;
    if (filters.streaming?.length) { p.with_watch_providers = filters.streaming.join('|'); p.watch_region = 'BR'; }
    if (filters.certification && !isTV) { p.certification_country = 'BR'; p['certification.lte'] = filters.certification; }

    if (contentType === 'anime') {
      p.with_genres = filters.genres?.length ? `16,${filters.genres.join(',')}` : '16';
      p.with_original_language = 'ja';
    } else if (filters.genres?.length) {
      p.with_genres = filters.genres.join('|');
    }
    return p;
  }

  async function exploreDiscover(filters = {}, page = 1) {
    const { contentType = 'movie' } = filters;
    const isTV = contentType === 'tv' || contentType === 'anime';
    const data = isTV
      ? await discoverTV({ ..._buildExploreParams(filters), page })
      : await discover({ ..._buildExploreParams(filters), page });
    if (contentType === 'tv') stripAnime(data);
    data.results?.forEach(r => { r._type = contentType; });
    return data;
  }

  async function exploreSearch(query, contentType = 'movie', page = 1) {
    if (!query || query.trim().length < 2) return { results: [] };
    const endpoint = contentType === 'movie' ? '/search/movie' : '/search/tv';
    const data = await request(endpoint, { query: query.trim(), page });
    data.results?.forEach(r => { r._type = contentType; });
    return data;
  }

  return {
    getTrendingMovies, getTrendingAll, getNowPlaying, getTopRatedMovies, getTopRatedTV, getTopRatedAnime, getUpcoming,
    discover, getHiddenGemsMovies, getHiddenGemsTV, getHiddenGemsAnime, getByGenreMovies, getByMood,
    getTrendingTV, getAiringTV, getAiringAnime, discoverTV, getByGenreTV,
    getTrendingAnime,
    getMovie, getCredits, getVideos, getSimilar, getImages, getReleaseDates,
    getTVShow, getTVCredits, getTVVideos, getSimilarTV,
    getWatchProviders,
    getPerson, getPersonCredits,
    search, searchMulti,
    getGenres, getGenresTV,
    randomize,
    exploreDiscover, exploreSearch,
    setAbortSignal, clearAbortSignal,
  };
})();
