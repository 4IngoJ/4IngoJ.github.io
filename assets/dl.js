// Zählender Download-Redirect: /dl/<app>/?src=<kanal> -> GoatCounter-Pageview, dann DMG.
// Nur Apps aus der Liste (kein offener Redirect). Blockiert ein Werbeblocker den Zähler,
// startet der Download trotzdem; nur der Zählpunkt fehlt dann.
(function () {
  const DMG = {
    sideschedule: 'https://github.com/4IngoJ/sideschedule/releases/latest/download/SideSchedule.dmg',
    talkremind: 'https://github.com/4IngoJ/TalkRemind/releases/latest/download/TalkRemind.dmg',
    tonecue: 'https://github.com/4IngoJ/tonecue/releases/latest/download/ToneCue.dmg'
  };
  const app = document.documentElement.getAttribute('data-app');
  const url = DMG[app];
  if (!url) return;
  const m = /[?&]src=([a-z0-9_-]{1,32})(?:&|$)/i.exec(location.search);
  const src = m ? m[1].toLowerCase() : 'direct';
  let gone = false;
  function go() { if (!gone) { gone = true; location.replace(url); } }

  window.goatcounter = { no_onload: true };
  const s = document.createElement('script');
  s.async = true;
  s.src = '//gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://didact.goatcounter.com/count');
  s.onload = function () {
    try { window.goatcounter.count({ path: '/dl/' + app, title: 'download ' + app + ' via ' + src, referrer: 'src-' + src }); } catch (e) {}
    setTimeout(go, 1500);
  };
  s.onerror = go;
  document.head.appendChild(s);
  setTimeout(go, 3000);
})();
