// didact.digital v2 app pages: light/dark switch (same behaviour as the home page) and the glass nav lift.
(function () {
  var root = document.documentElement, btn = document.querySelector('.theme-btn');
  var sys = matchMedia('(prefers-color-scheme: dark)'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isDark() { var t = root.dataset.theme; return t ? t === 'dark' : sys.matches; }
  function sync() {
    var d = isDark();
    if (btn) btn.setAttribute('aria-pressed', d);
    document.querySelectorAll('meta[name=theme-color]').forEach(function (m) { m.setAttribute('content', d ? '#000000' : '#FAF9F7'); });
  }
  if (btn) btn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    function apply() {
      root.dataset.theme = next;
      try { localStorage.setItem('didact-theme', next); } catch (e) {}
      sync();
    }
    if (still || !document.startViewTransition) return apply();
    // to light the new page grows out of the button; to dark the light shrinks back into it
    var b = btn.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
    var r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)), toDark = next === 'dark';
    root.classList.toggle('vt-dark', toDark);
    var vt = document.startViewTransition(apply);
    vt.ready.then(function () {
      var small = 'circle(0px at ' + x + 'px ' + y + 'px)', big = 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)';
      root.animate({ clipPath: toDark ? [big, small] : [small, big] },
        { duration: toDark ? 750 : 650, easing: toDark ? 'cubic-bezier(.64,0,.78,0)' : 'cubic-bezier(.22,1,.36,1)', fill: 'forwards',
          pseudoElement: toDark ? '::view-transition-old(root)' : '::view-transition-new(root)' });
    });
    vt.finished.then(function () { root.classList.remove('vt-dark'); });
  });
  sys.addEventListener('change', sync);
  sync();

  var lifted = false;
  function lift() { var on = scrollY > 24; if (on !== lifted) { lifted = on; document.body.classList.toggle('scrolled', on); } }
  addEventListener('scroll', lift, { passive: true }); lift();
})();
