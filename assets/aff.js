// Shared affiliate config for every didact.digital page. Loaded before lmsqueezy.com/affiliate.js.
// Keeps the first click id in localStorage so the app can pick it up from /welcome/ after install.
window.lemonSqueezyAffiliateConfig = {
  store: '4ingoj',
  onTrack: function (t) {
    try {
      var old = JSON.parse(localStorage.getItem('didact_aff') || 'null');
      if (old && Date.parse(old.expires) > Date.now()) return; // first click wins
      localStorage.setItem('didact_aff', JSON.stringify({ click: t.click, expires: t.expires }));
    } catch (e) {}
  }
};
