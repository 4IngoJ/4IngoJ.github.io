#!/usr/bin/env python3
"""Generate static language pages (de, fr, es, it, pt) from the English page.

English text lives in the HTML (data-i18n="key" elements). The other five
languages live in tools/i18n/<page>.json as {lang: {key: text}}.
Usage: python3 build_i18n.py <config.json>
"""
import json, re, html, sys, pathlib

LANGS = [("en", "English", "en_US"), ("de", "Deutsch", "de_DE"), ("fr", "Français", "fr_FR"),
         ("es", "Español", "es_ES"), ("it", "Italiano", "it_IT"), ("pt", "Português", "pt_PT")]
ARIA = {"en": "Change language", "de": "Sprache ändern", "fr": "Changer de langue",
        "es": "Cambiar de idioma", "it": "Cambia lingua", "pt": "Alterar idioma"}
CODES = [l[0] for l in LANGS]

cfg_path = pathlib.Path(sys.argv[1]).resolve()
cfg = json.loads(cfg_path.read_text())
BASE = cfg_path.parent
ROOT = (BASE / cfg["root"]).resolve()
SITE = cfg["site_url"]  # ends with /
LOCAL = set(cfg.get("local_pages", []))


def page_url(lang, page):
    return SITE + ("" if lang == "en" else lang + "/") + ("" if page == "index.html" else page)


def elems(t, attr):
    """Yield (start, end, key) for the inner range of elements carrying attr."""
    out, last = [], -1
    for m in re.finditer(r'<(\w+)\b[^>]*?\s' + attr + r'="([^"]+)"[^>]*>', t):
        if m.start() < last:  # nested inside an element already handled
            continue
        tag, i, d = m.group(1), m.end(), 1
        for n in re.finditer(r'<(/?)' + tag + r'\b[^>]*>', t[i:]):
            d += -1 if n.group(1) else 1
            if d == 0:
                out.append((i, i + n.start(), m.group(2)))
                last = i + n.start()
                break
        else:
            raise SystemExit(f"unclosed <{tag}> for key {m.group(2)}")
    return out


def apply_text(t, d, mode, lang):
    for s, e, k in reversed(elems(t, "data-i18n")):
        if k not in d:
            raise SystemExit(f"[{lang}] missing key {k}")
        t = t[:s] + (html.escape(d[k], quote=False) if mode == "text" else d[k]) + t[e:]
    # attribute-style keys on the opening tag
    def attr(t, src_attr, dst_attr):
        def rep(m):
            tag = m.group(0)
            k = re.search(src_attr + r'="([^"]+)"', tag).group(1)
            if k not in d:
                raise SystemExit(f"[{lang}] missing key {k}")
            v = html.escape(d[k], quote=True)
            if re.search(r'\s' + dst_attr + r'="[^"]*"', tag):
                return re.sub(r'(\s' + dst_attr + r'=)"[^"]*"', lambda x: x.group(1) + '"' + v + '"', tag, count=1)
            return tag[:-1] + f' {dst_attr}="{v}">'
        return re.sub(r'<\w+\b[^>]*?\s' + src_attr + r'="[^"]+"[^>]*>', rep, t)
    t = attr(t, "data-i18n-aria-label", "aria-label")
    t = attr(t, "data-caption-key", "data-caption")
    t = attr(t, "data-i18n-alt", "alt")
    t = attr(t, "data-i18n-title", "title")
    # gallery caption text mirrors the active slide's caption
    m = re.search(r'<picture[^>]*is-active[^>]*data-caption="([^"]*)"', t) or re.search(r'<picture[^>]*data-caption="([^"]*)"[^>]*is-active', t)
    if m:
        t = re.sub(r'(<p[^>]*data-caption-text[^>]*>)[^<]*(</p>)', lambda x: x.group(1) + m.group(1) + x.group(2), t)
    return t


def sub(t, pattern, repl, flags=0):
    return re.sub(pattern, lambda m: repl(m) if callable(repl) else repl, t, count=1, flags=flags)


def set_head(t, lang, page, d):
    url = page_url(lang, page)
    t = sub(t, r'<html lang="[^"]*"', f'<html lang="{lang}"')
    t = sub(t, r'(<link rel="canonical" href=")[^"]*(")', lambda m: m.group(1) + url + m.group(2))
    t = sub(t, r'(<meta property="og:url" content=")[^"]*(")', lambda m: m.group(1) + url + m.group(2))
    loc = dict((l[0], l[2]) for l in LANGS)[lang]
    t = sub(t, r'(<meta property="og:locale" content=")[^"]*(")', lambda m: m.group(1) + loc + m.group(2))
    if lang != "en":
        if d.get("meta.title"):
            tt = html.escape(d["meta.title"], quote=False)
            t = sub(t, r"<title>.*?</title>", f"<title>{tt}</title>", re.S)
            t = sub(t, r'(<meta property="og:title" content=")[^"]*(")', lambda m: m.group(1) + html.escape(d["meta.title"]) + m.group(2))
        if d.get("meta.desc"):
            ds = html.escape(d["meta.desc"])
            t = sub(t, r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + ds + m.group(2))
            t = sub(t, r'(<meta property="og:description" content=")[^"]*(")', lambda m: m.group(1) + ds + m.group(2))
    block = "<!--hreflang-->\n" + "".join(
        f'<link rel="alternate" hreflang="{c}" href="{page_url(c, page)}">\n' for c in CODES) + \
        f'<link rel="alternate" hreflang="x-default" href="{page_url("en", page)}">\n<!--/hreflang-->\n'
    t = re.sub(r"<!--hreflang-->.*?<!--/hreflang-->\n?", "", t, flags=re.S)
    t = sub(t, r'(<link rel="canonical"[^>]*>\n)', lambda m: m.group(1) + block)
    return t


def set_switcher(t, lang, page):
    t = sub(t, r'(<span id="lang-current">)[^<]*(</span>)', lambda m: m.group(1) + lang.upper() + m.group(2))
    t = sub(t, r'(<button class="lang-toggle"[^>]*?aria-label=")[^"]*(")', lambda m: m.group(1) + ARIA[lang] + m.group(2))
    items = "".join(
        f'<a role="menuitem" href="{page_url(c, page)}" hreflang="{c}" lang="{c}"' + (' class="active" aria-current="true"' if c == lang else "") +
        f'><span>{name}</span><span class="lang-code">{c.upper()}</span></a>' for c, name, _ in LANGS)
    return sub(t, r'(<div class="lang-menu" role="menu" id="lang-menu">).*?(</div>)', lambda m: m.group(1) + items + m.group(2), re.S)


def faq_from_html(t):
    out = []
    for m in re.finditer(r'<details class="faq-item[^>]*>\s*<summary[^>]*>(.*?)</summary>\s*(?:<div class="faq-body-inner"[^>]*>|<p[^>]*>)(.*?)</(?:div|p)>', t, re.S):
        q = html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip()
        a = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", m.group(2)))).strip()
        out.append({"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}})
    return out


def walk(o, fn):
    if isinstance(o, dict):
        fn(o)
        for v in o.values():
            walk(v, fn)
    elif isinstance(o, list):
        for v in o:
            walk(v, fn)


def set_jsonld(t, lang, page):
    faq = faq_from_html(t)
    url = page_url(lang, page)

    def fix(m):
        data = json.loads(m.group(2))

        def f(o):
            ty = o.get("@type")
            if ty == "FAQPage" and faq:
                o["mainEntity"] = faq
            if ty == "BreadcrumbList":
                o["itemListElement"][-1]["item"] = url
        walk(data, f)
        return m.group(1) + "\n" + json.dumps(data, ensure_ascii=False, indent=2) + "\n" + m.group(3)
    return re.sub(r'(<script type="application/ld\+json">)(.*?)(</script>)', fix, t, flags=re.S)


def rewrite_urls(t):
    """Language pages live one folder deeper: make relative URLs point back up."""
    def keep(v):
        return re.match(r"(/|#|[a-z][a-z0-9+.-]*:|\?)", v, re.I) or v.split("#")[0].split("?")[0] in LOCAL
    def attr(m):
        return m.group(0) if keep(m.group(3)) else f'{m.group(1)}{m.group(2)}="../{m.group(3)}"'
    t = re.sub(r'(\s)(src|href|poster|data-src)="([^"]*)"', attr, t)
    def srcset(m):
        parts = []
        for p in m.group(1).split(","):
            u, _, rest = p.strip().partition(" ")
            parts.append(u if keep(u) else "../" + u + (" " + rest if rest else ""))
        return ' srcset="' + ", ".join(parts) + '"'
    t = re.sub(r'\ssrcset="([^"]*)"', srcset, t)
    t = re.sub(r"url\((['\"]?)(?!/|#|data:|https?:)([^)'\"]+)\1\)", lambda m: f"url({m.group(1)}../{m.group(2)}{m.group(1)})", t)
    return t


def localize_links(t, lang):
    """Point links to other translated pages at the same language."""
    for src, dst in cfg.get("localize", {}).items():
        t = t.replace(f'href="{src}"', f'href="{dst.format(lang=lang)}"')
    return t


def runtime_script(lang, d):
    keys = cfg.get("runtime_keys", [])
    if not keys or lang == "en":
        return ""
    payload = {lang: {k: d[k] for k in keys if k in d}}
    return f'<script>window.{cfg["runtime_var"]}={json.dumps(payload, ensure_ascii=False)};</script>\n'


HINT = {"en": ("This page is also available in English.", "View in English", "Dismiss"),
        "de": ("Diese Seite gibt es auch auf Deutsch.", "Auf Deutsch ansehen", "Schließen"),
        "fr": ("Cette page existe aussi en français.", "Voir en français", "Fermer"),
        "es": ("Esta página también está disponible en español.", "Ver en español", "Cerrar"),
        "it": ("Questa pagina è disponibile anche in italiano.", "Vai alla versione italiana", "Chiudi"),
        "pt": ("Esta página também está disponível em português.", "Ver em português", "Fechar")}
HINT_CSS = ("<style>.lang-hint{position:fixed;left:16px;right:16px;bottom:16px;max-width:560px;margin:0 auto;z-index:300;"
            "display:flex;align-items:center;gap:14px;padding:12px 14px 12px 18px;border-radius:14px;background:#1A1917;color:#FAF9F7;"
            "font:500 14px/1.4 system-ui,-apple-system,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.28)}"
            ".lang-hint span{flex:1}.lang-hint a{color:#FAF9F7;font-weight:700;text-decoration:underline;white-space:nowrap}"
            ".lang-hint button{background:none;border:0;color:#B7B4AE;font-size:22px;line-height:1;cursor:pointer;padding:2px 6px}"
            ".lang-hint button:hover{color:#FAF9F7}</style>")


def set_hint(t, lang, page):
    """Offer, never force: a banner in the visitor's browser language when that language has a page."""
    urls = {c: page_url(c, page) for c in CODES}
    js = ("(function(){var K='lang-hint-dismissed',U=%s,T=%s,C=%s;"
          "function st(){try{localStorage.setItem(K,'1')}catch(e){}}"
          "document.querySelectorAll('#lang-menu a').forEach(function(a){a.addEventListener('click',st)});"
          "try{if(localStorage.getItem(K))return}catch(e){}"
          "var l=String((navigator.languages&&navigator.languages[0])||navigator.language||'en').slice(0,2).toLowerCase();"
          "if(l===C||!U[l])return;"
          "var b=document.createElement('div');b.className='lang-hint';b.setAttribute('role','region');b.lang=l;b.setAttribute('aria-label',T[l][0]);"
          "var s=document.createElement('span');s.textContent=T[l][0];"
          "var a=document.createElement('a');a.href=U[l];a.hreflang=l;a.textContent=T[l][1];a.addEventListener('click',st);"
          "var x=document.createElement('button');x.type='button';x.setAttribute('aria-label',T[l][2]);x.textContent='\\u00d7';"
          "x.addEventListener('click',function(){st();b.remove()});"
          "b.append(s,a,x);document.body.appendChild(b)})();") % (
        json.dumps(urls), json.dumps(HINT, ensure_ascii=False), json.dumps(lang))
    block = "<!--lang-hint-->" + HINT_CSS + "<script>" + js + "</script><!--/lang-hint-->\n"
    t = re.sub(r"<!--lang-hint-->.*?<!--/lang-hint-->\n?", "", t, flags=re.S)
    return t.replace("</body>", block + "</body>", 1)


def build():
    for p in cfg["pages"]:
        src = ROOT / p["src"]
        t_en = src.read_text()
        dicts = json.loads((BASE / p["dict"]).read_text()) if p.get("dict") else {}
        for lang in CODES:
            d = dicts.get(lang, {})
            t = t_en
            if lang != "en":
                t = apply_text(t, d, p["mode"], lang)
            t = set_head(t, lang, p["src"], d)
            if p.get("switcher", True):
                t = set_switcher(t, lang, p["src"])
            t = set_hint(t, lang, p["src"])
            if lang != "en":
                t = set_jsonld(t, lang, p["src"])
                t = rewrite_urls(t)
                t = localize_links(t, lang)
                rs = runtime_script(lang, d)
                if rs:
                    t = t.replace("</head>", rs + "</head>", 1)
                out = ROOT / lang / p["src"]
                out.parent.mkdir(exist_ok=True)
                out.write_text(t)
            else:
                src.write_text(t)
            print("wrote", lang, p["src"])


build()
