// Scroll and interaction effects for the ToneCue page. Everything degrades to a static page.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  // Reveal on scroll
  var items = document.querySelectorAll('.fx');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // Comparison table: stagger the check marks row by row
  document.querySelectorAll('.cmp tbody tr').forEach(function (tr, i) {
    tr.querySelectorAll('.mark').forEach(function (m) { m.style.setProperty('--r', i); });
  });

  // Progress bar, back-to-top, hero parallax
  var bar = document.getElementById('progress');
  var top = document.getElementById('toTop');
  var shot = document.getElementById('heroShot');
  var tiltX = 0, tiltY = 0, ticking = false;
  function frame() {
    ticking = false;
    var h = root.scrollHeight - window.innerHeight;
    var y = window.scrollY;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')';
    if (top) top.classList.toggle('show', y > 700);
    if (shot && !reduce && y < 900) {
      shot.style.transform = 'translateY(' + (y * 0.12) + 'px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg)';
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  frame();
  if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  var hero = document.getElementById('top');
  if (hero && shot && !reduce) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tiltY = ((e.clientX - r.left) / r.width - 0.5) * 8;
      tiltX = -((e.clientY - r.top) / r.height - 0.5) * 6;
      req();
    });
    hero.addEventListener('pointerleave', function () { tiltX = 0; tiltY = 0; req(); });
  }

  // Card spotlight follows the pointer
  document.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Demo: tabs with autoplay while visible, stops once the visitor clicks
  var demo = document.getElementById('demo-box');
  if (demo) {
    var tabs = Array.prototype.slice.call(demo.querySelectorAll('.demo-tab'));
    var panels = Array.prototype.slice.call(demo.querySelectorAll('.demo-panel'));
    var DUR = 6000, current = 0, timer = null, userPicked = reduce, visible = false;
    if (reduce) demo.classList.add('paused');
    function show(i) {
      current = i;
      tabs.forEach(function (t, n) { t.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
      panels.forEach(function (p, n) {
        p.classList.remove('on');
        if (n === i) { void p.offsetWidth; p.classList.add('on'); }
      });
    }
    function schedule() {
      clearTimeout(timer);
      if (userPicked || !visible) return;
      timer = setTimeout(function () { show((current + 1) % tabs.length); schedule(); }, DUR);
    }
    demo.style.setProperty('--dur', DUR + 'ms');
    tabs.forEach(function (t, n) {
      t.addEventListener('click', function () {
        userPicked = true; demo.classList.add('paused'); clearTimeout(timer); show(n);
      });
    });
    if ('IntersectionObserver' in window && !reduce) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) { show(current); schedule(); } else { clearTimeout(timer); }
      }, { threshold: 0.4 }).observe(demo);
    }
  }
})();
