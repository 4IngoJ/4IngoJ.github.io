(function () {
  var canvas = document.getElementById('field');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var hero = canvas.parentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PITCH = 28, w = 0, h = 0, dpr = 1, cols = 0, rows = 0;
  var pointer = { x: -999, y: -999, on: false };
  var ripples = [];
  var running = false, visible = true, last = 0;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / PITCH) + 1; rows = Math.ceil(h / PITCH) + 1;
    draw(performance.now());
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    var offX = (w - (cols - 1) * PITCH) / 2, offY = (h - (rows - 1) * PITCH) / 2;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = offX + c * PITCH, y = offY + r * PITCH;
        var lift = 0;
        if (pointer.on) {
          var dx = x - pointer.x, dy = y - pointer.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 150) lift = Math.max(lift, 1 - d / 150);
        }
        for (var i = 0; i < ripples.length; i++) {
          var rp = ripples[i], age = (now - rp.t) / 1000;
          var rad = age * 720, rdx = x - rp.x, rdy = y - rp.y;
          var ring = Math.abs(Math.sqrt(rdx * rdx + rdy * rdy) - rad);
          if (ring < 90) lift = Math.max(lift, (1 - ring / 90) * Math.max(0, 1 - age / 1.8));
        }
        ctx.globalAlpha = 0.2 + lift * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, 1.1 + lift * 1.9, 0, 6.2832);
        ctx.fillStyle = '#FAF9F7';
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    ripples = ripples.filter(function (r) { return now - r.t < 1800; });
    draw(now);
    if (visible && !document.hidden && (pointer.on || ripples.length)) requestAnimationFrame(frame);
    else running = false;
  }
  function kick() { if (!running && !reduce) { running = true; requestAnimationFrame(frame); } }

  function ripple(x, y) { ripples.push({ x: x, y: y, t: performance.now() }); kick(); }

  size();
  window.addEventListener('resize', size);
  if (reduce) return;

  hero.addEventListener('pointermove', function (e) {
    var b = hero.getBoundingClientRect();
    pointer.x = e.clientX - b.left; pointer.y = e.clientY - b.top; pointer.on = true; kick();
  });
  hero.addEventListener('pointerleave', function () { pointer.on = false; kick(); });
  hero.addEventListener('pointerdown', function (e) {
    if (e.target.closest('a')) return;
    var b = hero.getBoundingClientRect(); ripple(e.clientX - b.left, e.clientY - b.top);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }).observe(hero);
  }

  // One ripple when the headline has landed: from the full stop on the home page, from the end of the h1 elsewhere.
  setTimeout(function () {
    var b = hero.getBoundingClientRect(), stop = document.getElementById('stop'), x, y;
    if (stop) {
      var s = stop.getBoundingClientRect(); x = s.left + s.width / 2; y = s.top + s.height * 0.78;
    } else {
      var h1 = hero.querySelector('h1'); if (!h1) return;
      var rg = document.createRange(); rg.selectNodeContents(h1);
      var rs = rg.getClientRects(); if (!rs.length) return;
      var l = rs[rs.length - 1]; x = l.right - 6; y = l.bottom - l.height * 0.2;
    }
    ripple(x - b.left, y - b.top);
  }, 650);
})();
