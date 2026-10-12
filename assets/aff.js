// Partner links for every didact.digital page, without any third-party script.
// - ?aff=<id> in the URL is added to the Buy links of that page view. Reading the URL stores nothing, so no consent is needed.
// - Only if the visitor agrees, the id is kept in localStorage for 60 days (first partner wins), so a later purchase,
//   also from the app via /welcome/, still credits the partner. Storing needs consent under § 165(3) TKG 2021.
// Lemon Squeezy credits a checkout link carrying ?aff=<id> on its own (docs.lemonsqueezy.com/help/affiliates-for-merchants/getting-referrals).
(function () {
  var CONSENT = 'didact_aff_consent';   // 'granted' | 'denied'
  var STORE = 'didact_aff';             // {id, expires}
  var DAYS = 60;
  var LANG = (document.documentElement.lang || 'en').slice(0, 2);
  var T = {
    en: { h: 'A partner recommended this', p: 'Want them to get credit if you buy later? We can remember their ID in this browser for 60 days. No tracking: nothing is sent anywhere, and the ID is only added to the Buy link. If you say no, you can still buy; the partner just won’t be credited once you leave this page.', ok: 'Yes, credit them', no: 'No thanks', more: 'Privacy', done: 'Consent withdrawn. The stored partner ID was removed from this browser.' },
    de: { h: 'Ein Partner hat das empfohlen', p: 'Soll er eine Gutschrift bekommen, falls du später kaufst? Wir können seine ID 60 Tage in diesem Browser merken. Kein Tracking: Es wird nichts versendet, und die ID hängt nur am Kaufen-Link. Sagst du nein, kannst du trotzdem kaufen; der Partner bekommt dann nur keine Gutschrift mehr, sobald du diese Seite verlässt.', ok: 'Ja, Gutschrift geben', no: 'Nein danke', more: 'Datenschutz', done: 'Einwilligung widerrufen. Die gespeicherte Partner-ID wurde aus diesem Browser entfernt.' },
    fr: { h: 'Un partenaire vous a recommandé ceci', p: 'Voulez-vous qu’il soit crédité si vous achetez plus tard ? Nous pouvons mémoriser son identifiant dans ce navigateur pendant 60 jours. Aucun suivi : rien n’est envoyé, et l’identifiant n’est ajouté qu’au lien d’achat. Si vous refusez, vous pouvez quand même acheter ; le partenaire ne sera simplement plus crédité dès que vous quittez cette page.', ok: 'Oui, le créditer', no: 'Non merci', more: 'Confidentialité', done: 'Consentement retiré. L’identifiant du partenaire enregistré a été supprimé de ce navigateur.' },
    es: { h: 'Un socio te ha recomendado esto', p: '¿Quieres que reciba su crédito si compras más tarde? Podemos recordar su ID en este navegador durante 60 días. Sin seguimiento: no se envía nada y el ID solo se añade al enlace de compra. Si dices que no, aún puedes comprar; el socio simplemente no recibirá crédito cuando salgas de esta página.', ok: 'Sí, acreditarle', no: 'No, gracias', more: 'Privacidad', done: 'Consentimiento retirado. El ID de socio guardado se ha eliminado de este navegador.' },
    it: { h: 'Un partner te l’ha consigliato', p: 'Vuoi che riceva l’accredito se acquisti più tardi? Possiamo ricordare il suo ID in questo browser per 60 giorni. Nessun tracciamento: non viene inviato nulla e l’ID viene aggiunto solo al link di acquisto. Se rifiuti, puoi comunque acquistare; il partner semplicemente non verrà accreditato dopo che lasci questa pagina.', ok: 'Sì, accredita', no: 'No, grazie', more: 'Privacy', done: 'Consenso revocato. L’ID del partner salvato è stato rimosso da questo browser.' },
    pt: { h: 'Um parceiro recomendou isto', p: 'Quer que ele receba o crédito se comprar mais tarde? Podemos guardar o ID dele neste navegador durante 60 dias. Sem rastreio: nada é enviado e o ID só é juntado ao link de compra. Se disser que não, pode comprar na mesma; o parceiro apenas não será creditado depois de sair desta página.', ok: 'Sim, creditar', no: 'Não, obrigado', more: 'Privacidade', done: 'Consentimento retirado. O ID de parceiro guardado foi removido deste navegador.' }
  };
  var t = T[LANG] || T.en;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function urlId() {
    var v = new URLSearchParams(location.search).get('aff');
    return v && /^[A-Za-z0-9_-]{1,64}$/.test(v) ? v : null;
  }
  function stored() {
    try { var o = JSON.parse(get(STORE) || 'null'); if (o && o.id && Date.parse(o.expires) > Date.now()) return o.id; } catch (e) {}
    return null;
  }
  function remember(id) {
    if (stored()) return; // first partner wins
    set(STORE, JSON.stringify({ id: id, expires: new Date(Date.now() + DAYS * 864e5).toISOString() }));
  }
  function tag(id) {
    var links = document.querySelectorAll('a[href*="lemonsqueezy.com/checkout"]');
    for (var i = 0; i < links.length; i++) {
      try { var u = new URL(links[i].href); u.searchParams.set('aff', id); links[i].href = u.href; } catch (e) {}
    }
  }
  function withdraw() {
    set(CONSENT, 'denied');
    try { localStorage.removeItem(STORE); } catch (e) {}
  }
  function privacyHref() {
    var app = (location.pathname.match(/^\/(sideschedule|talkremind|tonecue)\//) || [])[1];
    return app ? '/' + app + '/' + (LANG === 'en' ? '' : LANG + '/') + 'privacy.html' : null;
  }

  function banner(id) {
    var css = document.createElement('style');
    css.textContent = '.aff-consent{position:fixed;top:16px;left:16px;right:16px;max-width:560px;margin:0 auto;z-index:400;padding:16px 18px;border-radius:14px;background:#1A1917;color:#FAF9F7;font:500 14px/1.45 system-ui,-apple-system,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.28)}.aff-consent strong{display:block;margin-bottom:6px;font-size:15px}.aff-consent p{margin:0 0 12px;color:#E6E4E0}.aff-consent .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.aff-consent button{font:600 14px system-ui,sans-serif;padding:9px 18px;border-radius:999px;border:1px solid #FAF9F7;background:#FAF9F7;color:#1A1917;cursor:pointer}.aff-consent a{color:#FAF9F7;margin-left:auto}';
    document.head.appendChild(css);
    var box = document.createElement('div');
    box.className = 'aff-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'aff-consent-h');
    var h = document.createElement('strong'); h.id = 'aff-consent-h'; h.textContent = t.h;
    var p = document.createElement('p'); p.textContent = t.p;
    var row = document.createElement('div'); row.className = 'row';
    function btn(label, fn) { var b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = function () { box.remove(); fn(); }; return b; }
    row.appendChild(btn(t.ok, function () { set(CONSENT, 'granted'); remember(id); }));
    row.appendChild(btn(t.no, function () { set(CONSENT, 'denied'); }));
    var href = privacyHref();
    if (href) { var a = document.createElement('a'); a.href = href; a.textContent = t.more; row.appendChild(a); }
    box.appendChild(h); box.appendChild(p); box.appendChild(row);
    document.body.appendChild(box);
    row.firstChild.focus();
  }

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  var fromUrl = urlId();
  var consent = get(CONSENT);
  if (consent === 'granted' && fromUrl) remember(fromUrl);
  var id = (consent === 'granted' && stored()) || fromUrl;

  ready(function () {
    if (id) tag(id);
    if (fromUrl && !consent) banner(fromUrl);
    var w = document.getElementById('aff-withdraw');
    if (w) w.addEventListener('click', function () {
      withdraw();
      var m = document.getElementById('aff-withdraw-msg');
      if (m) m.textContent = t.done;
    });
  });
})();
