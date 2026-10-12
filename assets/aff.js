// Consent-gated affiliate tracking for every didact.digital page.
// Nothing is loaded, stored or read until a visitor who arrives with ?aff= says yes.
// Why: lmsqueezy.com/affiliate.js fingerprints the browser and sets a cookie, which needs
// consent under § 165(3) TKG 2021 (ePrivacy Art. 5(3)). Decision and sources: decisions/affiliate-attribution.md
(function () {
  var KEY = 'didact_aff_consent';           // 'granted' | 'denied'
  var SCRIPT = 'https://lmsqueezy.com/affiliate.js';
  var LANG = (document.documentElement.lang || 'en').slice(0, 2);
  var T = {
    en: { h: 'Partner link detected', p: 'You came through a partner’s link. To credit the partner, we can run a script from Lemon Squeezy, our payment provider. It reads technical details of your browser to create a device ID (a fingerprint), sets a cookie, and sends the ID, your IP address and this page’s address to Lemon Squeezy. Nothing is loaded unless you accept.', ok: 'Accept', no: 'Decline', more: 'Privacy', done: 'Consent withdrawn. Cookie and stored ID removed from this browser.' },
    de: { h: 'Partner-Link erkannt', p: 'Du kommst über den Link eines Partners. Um den Partner gutzuschreiben, können wir ein Skript von Lemon Squeezy, unserem Zahlungsanbieter, ausführen. Es liest technische Merkmale deines Browsers aus, errechnet daraus eine Geräte-ID (einen Fingerabdruck), setzt ein Cookie und sendet die ID, deine IP-Adresse und die Adresse dieser Seite an Lemon Squeezy. Ohne deine Zustimmung wird nichts geladen.', ok: 'Zustimmen', no: 'Ablehnen', more: 'Datenschutz', done: 'Einwilligung widerrufen. Cookie und gespeicherte ID wurden aus diesem Browser entfernt.' },
    fr: { h: 'Lien partenaire détecté', p: 'Vous arrivez par le lien d’un partenaire. Pour le créditer, nous pouvons exécuter un script de Lemon Squeezy, notre prestataire de paiement. Il lit des caractéristiques techniques de votre navigateur pour créer un identifiant d’appareil (une empreinte), dépose un cookie et envoie cet identifiant, votre adresse IP et l’adresse de cette page à Lemon Squeezy. Rien n’est chargé sans votre accord.', ok: 'Accepter', no: 'Refuser', more: 'Confidentialité', done: 'Consentement retiré. Le cookie et l’identifiant enregistré ont été supprimés de ce navigateur.' },
    es: { h: 'Enlace de socio detectado', p: 'Llegas a través del enlace de un socio. Para acreditarle, podemos ejecutar un script de Lemon Squeezy, nuestro proveedor de pagos. Lee características técnicas de tu navegador para crear un ID de dispositivo (una huella digital), guarda una cookie y envía el ID, tu dirección IP y la dirección de esta página a Lemon Squeezy. No se carga nada si no aceptas.', ok: 'Aceptar', no: 'Rechazar', more: 'Privacidad', done: 'Consentimiento retirado. La cookie y el ID guardado se han eliminado de este navegador.' },
    it: { h: 'Link del partner rilevato', p: 'Arrivi tramite il link di un partner. Per accreditarlo possiamo eseguire uno script di Lemon Squeezy, il nostro fornitore di pagamenti. Legge caratteristiche tecniche del tuo browser per creare un ID del dispositivo (un’impronta digitale), imposta un cookie e invia l’ID, il tuo indirizzo IP e l’indirizzo di questa pagina a Lemon Squeezy. Senza il tuo consenso non viene caricato nulla.', ok: 'Accetta', no: 'Rifiuta', more: 'Privacy', done: 'Consenso revocato. Cookie e ID salvato sono stati rimossi da questo browser.' },
    pt: { h: 'Link de parceiro detetado', p: 'Chegou através do link de um parceiro. Para o creditar, podemos executar um script da Lemon Squeezy, o nosso prestador de pagamentos. Ele lê características técnicas do seu navegador para criar um ID de dispositivo (uma impressão digital), define um cookie e envia o ID, o seu endereço IP e o endereço desta página à Lemon Squeezy. Nada é carregado sem o seu consentimento.', ok: 'Aceitar', no: 'Recusar', more: 'Privacidade', done: 'Consentimento retirado. O cookie e o ID guardado foram removidos deste navegador.' }
  };
  var t = T[LANG] || T.en;

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function load() {
    window.lemonSqueezyAffiliateConfig = {
      store: '4ingoj',
      onTrack: function (r) {
        try {
          var old = JSON.parse(localStorage.getItem('didact_aff') || 'null');
          if (old && Date.parse(old.expires) > Date.now()) return; // first click wins
          localStorage.setItem('didact_aff', JSON.stringify({ click: r.click, expires: r.expires }));
        } catch (e) {}
      }
    };
    var s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    // The vendor script starts on window "load"; when injected after it, start it by hand.
    s.onload = function () { if (document.readyState === 'complete' && window.createLemonSqueezyAffiliate) window.createLemonSqueezyAffiliate(); };
    document.head.appendChild(s);
  }

  function withdraw() {
    set('denied');
    try { localStorage.removeItem('didact_aff'); } catch (e) {}
    var gone = '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    [ '', '; domain=' + location.hostname, '; domain=.' + location.hostname, '; domain=didact.digital', '; domain=.didact.digital' ]
      .forEach(function (d) { document.cookie = 'ls_aff_ref' + gone + d; });
  }

  function privacyHref() {
    var app = (location.pathname.match(/^\/(sideschedule|talkremind|tonecue)\//) || [])[1];
    return app ? '/' + app + '/' + (LANG === 'en' ? '' : LANG + '/') + 'privacy.html' : null;
  }

  function banner() {
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
    row.appendChild(btn(t.ok, function () { set('granted'); load(); }));
    row.appendChild(btn(t.no, function () { set('denied'); }));
    var href = privacyHref();
    if (href) { var a = document.createElement('a'); a.href = href; a.textContent = t.more; row.appendChild(a); }
    box.appendChild(h); box.appendChild(p); box.appendChild(row);
    document.body.appendChild(box);
    row.firstChild.focus();
  }

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  var choice = get();
  if (choice === 'granted') load();
  else if (!choice && new URLSearchParams(location.search).get('aff')) ready(banner);

  ready(function () {
    var w = document.getElementById('aff-withdraw');
    if (!w) return;
    w.addEventListener('click', function () {
      withdraw();
      var m = document.getElementById('aff-withdraw-msg');
      if (m) m.textContent = t.done;
    });
  });
})();
