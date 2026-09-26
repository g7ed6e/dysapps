// Recherche locale : l'index (search-index.json) est chargé au premier usage, rien ne sort du navigateur.
(function () {
  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  if (!input || !results) return;
  var index = null;
  var loading = null;
  var rel = input.getAttribute('data-rel') || './';

  function fold(s) {
    return String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[’']/g, ' ');
  }

  function load() {
    if (index) return Promise.resolve(index);
    if (!loading) {
      loading = fetch(input.getAttribute('data-index'))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          index = data.map(function (p) {
            return {
              page: p,
              title: fold(p.title),
              headings: p.headings.map(function (h) { return { id: h.id, text: h.text, folded: fold(h.text) }; }),
              text: fold(p.text),
            };
          });
          return index;
        });
    }
    return loading;
  }

  function excerpt(text, pos) {
    var start = Math.max(0, pos - 60);
    var end = Math.min(text.length, pos + 90);
    return (start > 0 ? '… ' : '') + text.slice(start, end) + (end < text.length ? ' …' : '');
  }

  function search(query) {
    var words = fold(query).split(/\s+/).filter(function (w) { return w.length > 1; });
    if (words.length === 0) return [];
    var hits = [];
    index.forEach(function (entry) {
      var score = 0;
      var anchor = '';
      var context = '';
      var allInText = words.every(function (w) { return entry.text.indexOf(w) !== -1 || entry.title.indexOf(w) !== -1; });
      if (!allInText) return;
      words.forEach(function (w) {
        if (entry.title.indexOf(w) !== -1) score += 10;
        entry.headings.some(function (h) {
          if (h.folded.indexOf(w) !== -1) {
            score += 4;
            if (!anchor) { anchor = '#' + h.id; context = h.text; }
            return true;
          }
          return false;
        });
        var pos = entry.text.indexOf(w);
        if (pos !== -1) {
          score += 1;
          if (!context) context = excerpt(entry.page.text, pos);
        }
      });
      hits.push({ page: entry.page, score: score, anchor: anchor, context: context });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    return hits.slice(0, 12);
  }

  function render(hits, query) {
    results.textContent = '';
    if (!query.trim()) { results.classList.remove('open'); return; }
    results.classList.add('open');
    if (hits.length === 0) {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Aucun résultat pour « ' + query + ' ».';
      results.appendChild(li);
      return;
    }
    hits.forEach(function (hit) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = rel + hit.page.url + hit.anchor;
      var title = document.createElement('span');
      title.className = 'hit-page';
      title.textContent = (hit.page.section ? hit.page.section + ' › ' : '') + hit.page.title;
      var ctx = document.createElement('span');
      ctx.className = 'hit-context';
      ctx.textContent = hit.context;
      a.appendChild(title);
      if (hit.context) a.appendChild(ctx);
      li.appendChild(a);
      results.appendChild(li);
    });
  }

  var timer = null;
  input.addEventListener('focus', function () { load(); });
  input.addEventListener('input', function () {
    clearTimeout(timer);
    var query = input.value;
    timer = setTimeout(function () {
      load().then(function () { render(search(query), query); });
    }, 120);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { input.value = ''; render([], ''); }
  });
  document.addEventListener('click', function (e) {
    if (!results.contains(e.target) && e.target !== input) results.classList.remove('open');
  });
})();
