// A cut-out MacBook around each home page scene: the photo has a transparent screen and background,
// the scene (later a screen recording) sits behind it, mapped onto the screen with matrix3d.
// One photo serves light and dark. Without JS the scenes stay as they are.
(function () {
  // photo, its size, screen corners in % of the photo (top left, top right, bottom right, bottom left)
  const FULL = { src: 'macbook', w: 1344, h: 865, q: [[13.65, 3.55], [86.41, 3.55], [86.55, 76.84], [13.51, 76.84]] };
  // TalkRemind: display only, cut off at the bottom, sits flush on the lower edge of its tile
  const CROP = { src: 'macbook-crop', w: 1392, h: 942, q: [[3.78, 3.22], [96.26, 3.62], [96.54, 92.07], [3.24, 92.07]], cls: 'cut' };
  const SW = 760, SH = 494; // scene size inside the screen, 1.54:1 like a MacBook display
  const css = document.createElement('style');
  css.textContent =
    '.mb{position:relative;max-width:900px;margin:32px auto 48px;aspect-ratio:var(--ar);isolation:isolate}' +
    '.mb.cut{max-width:820px;margin-bottom:0}' +
    '.mb>img{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}' +
    '.mb>.scene.scene{position:absolute;left:0;top:0;margin:0;max-width:none;width:' + SW + 'px;height:' + SH + 'px;aspect-ratio:auto;border-radius:0;box-shadow:none;transform-origin:0 0}' +
    '.mb>.scene .sc-bar{border-radius:0}';
  document.head.appendChild(css);

  // matrix3d that maps the rectangle w x h onto the quad p (pixels)
  function homography(w, h, p) {
    const x0 = p[0][0], y0 = p[0][1], x1 = p[1][0], y1 = p[1][1], x2 = p[2][0], y2 = p[2][1], x3 = p[3][0], y3 = p[3][1];
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / den, k = (dx1 * sy - sx * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
    return 'matrix3d(' + [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1].join(',') + ')';
  }

  const frames = [];
  [['ss', FULL], ['tr', CROP], ['tc', FULL]].forEach(function (s) {
    const scene = document.querySelector('.scene.' + s[0]), ph = s[1];
    if (!scene) return;
    const mb = document.createElement('div');
    mb.className = 'mb' + (ph.cls ? ' ' + ph.cls : '');
    mb.style.setProperty('--ar', ph.w + '/' + ph.h);
    // the moving dot keys on this attribute; it now walks the photo, not the hidden scene
    mb.setAttribute('data-dot-edge', scene.getAttribute('data-dot-edge') || '.5');
    scene.removeAttribute('data-dot-edge');
    scene.parentNode.insertBefore(mb, scene);
    mb.appendChild(scene);
    const img = new Image();
    img.src = '/assets/scenes/' + ph.src + '.webp'; img.alt = ''; img.width = ph.w; img.height = ph.h;
    img.loading = 'lazy'; img.decoding = 'async'; img.setAttribute('aria-hidden', 'true');
    mb.appendChild(img);
    frames.push({ mb: mb, scene: scene, q: ph.q });
  });

  function place() {
    frames.forEach(function (f) {
      const W = f.mb.clientWidth, H = f.mb.clientHeight, Q = f.q;
      let cx = 0, cy = 0;
      Q.forEach(function (c) { cx += c[0] / 4; cy += c[1] / 4; });
      // push the corners 1% outward so the scene edge hides under the bezel
      f.scene.style.transform = homography(SW, SH, Q.map(function (c) {
        return [(cx + (c[0] - cx) * 1.01) / 100 * W, (cy + (c[1] - cy) * 1.01) / 100 * H];
      }));
    });
  }
  place();
  if (window.ResizeObserver) frames.forEach(function (f) { new ResizeObserver(place).observe(f.mb); });
})();
