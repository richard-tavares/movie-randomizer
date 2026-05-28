const Watchlist = (() => {
  const KEY = 'mr_watchlist';

  function _load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY)) || {};
      let dirty = false;
      for (const key of Object.keys(data)) {
        const e = data[key];
        if ('list' in e && !('want' in e)) {
          e.want = e.list === 'want';
          e.favorite = e.list === 'favorite';
          delete e.list;
          dirty = true;
        }
      }
      if (dirty) localStorage.setItem(KEY, JSON.stringify(data));
      return data;
    } catch { return {}; }
  }

  function _save(data) { localStorage.setItem(KEY, JSON.stringify(data)); _emit(); }
  function _emit() { window.dispatchEvent(new CustomEvent('watchlist:change')); }

  function add(movie, list = 'want') {
    const data = _load();
    if (!data[movie.id]) data[movie.id] = { movie, want: false, favorite: false, addedAt: Date.now() };
    data[movie.id][list] = true;
    _save(data);
  }

  function remove(id, list = null) {
    const data = _load();
    if (!data[id]) return;
    if (list) {
      data[id][list] = false;
      if (!data[id].want && !data[id].favorite) delete data[id];
    } else {
      delete data[id];
    }
    _save(data);
  }

  function move(id, list) {
    const data = _load();
    if (data[id]) {
      data[id].want = list === 'want';
      data[id].favorite = list === 'favorite';
      _save(data);
    }
  }

  function has(id, list = null) {
    const entry = _load()[id];
    if (!entry) return false;
    if (list) return !!entry[list];
    return !!(entry.want || entry.favorite);
  }

  function getList(list = null) {
    const data = _load();
    const items = Object.values(data);
    if (!list) return items;
    return items.filter(i => i[list]);
  }

  function getAll() { return _load(); }
  function count() { return Object.keys(_load()).length; }
  function countList(l) { return getList(l).length; }
  function clear() { _save({}); }

  return { add, remove, move, has, getList, getAll, count, countList, clear };
})();
