#!/usr/bin/env python3
"""Puts the "Diagnostic report" privacy section on the three app privacy pages, from one source.

Source: didactKit/standard/diagnostic-report-privacy.json (the app shows the same text in its
"Send diagnostic report" window). The script writes the English block into <app>/privacy.html,
the other five languages into _tools/i18n/<app>_privacy.json, adds one sentence to each page's
"short version", then runs build_i18n.py so the language pages follow. Safe to run again.

Usage: python3 _tools/sync_diagnostic_report.py [--kit PATH] [--draft]
  --draft  run although the JSON says "approved": false (use on a copy, never for publishing)
Do not publish before the app with the Send button is out: page and app go live together.
"""
import argparse, html, json, pathlib, re, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parent
LANGS = ["de", "fr", "es", "it", "pt"]
# before: key of the heading the new section goes in front of; short: key of the element that gets the
# one-sentence note; drop: keys of an older section this one replaces.
APPS = {
    "tonecue": {"before": "q020", "short": "q005"},
    "talkremind": {"before": "p018", "short": "p005"},
    "sideschedule": {"before": "never.h2", "short": "short.li3", "drop": ["diag.h2", "diag.p"]},
}
OPEN, CLOSE = "<!--diagnostic-report-->", "<!--/diagnostic-report-->"

ap = argparse.ArgumentParser()
ap.add_argument("--kit", default=str(pathlib.Path.home() / "Developer/GitHub/didactKit/standard/diagnostic-report-privacy.json"))
ap.add_argument("--draft", action="store_true")
args = ap.parse_args()

src = json.loads(pathlib.Path(args.kit).read_text())
if not src["approved"] and not args.draft:
    sys.exit('Source says "approved": false (provider statement not confirmed). Nothing written.')
ids = src["blocks"]
text = src["text"]
en = text["en"]


def esc(s):
    return html.escape(s, quote=False)


def block_html():
    rows = [f'  <h2 id="{src["anchor"]}" data-i18n="dr.title">{esc(en["title"])}</h2>',
            f'  <p data-i18n="dr.intro">{esc(en["intro"])}</p>']
    for b in ids:
        rows.append(f'  <p><strong data-i18n="dr.{b}.h">{esc(en[b]["h"])}</strong> '
                    f'<span data-i18n="dr.{b}.p">{esc(en[b]["p"])}</span></p>')
    return OPEN + "\n" + "\n".join(rows) + "\n  " + CLOSE + "\n"


def dict_keys(lang):
    t = text[lang]
    out = {"dr.title": t["title"], "dr.intro": t["intro"]}
    for b in ids:
        out[f"dr.{b}.h"], out[f"dr.{b}.p"] = t[b]["h"], t[b]["p"]
    return out


def add_note(t, key, note):
    """Append the sentence to the English element carrying data-i18n=key (once)."""
    m = re.search(r'(<(\w+)[^>]*\sdata-i18n="' + re.escape(key) + r'"[^>]*>)(.*?)(</\2>)', t, re.S)
    if not m:
        sys.exit(f"short-version element {key} not found")
    if note in m.group(3):
        return t
    return t[:m.start(3)] + m.group(3).rstrip() + " " + esc(note) + t[m.end(3):]


for app, cfg in APPS.items():
    page = SITE / app / "privacy.html"
    t = page.read_text()
    t = re.sub(re.escape(OPEN) + r".*?" + re.escape(CLOSE) + r"\n?", "", t, flags=re.S)
    for k in cfg.get("drop", []):
        t = re.sub(r'[ \t]*<(h2|p)[^>]*data-i18n="' + re.escape(k) + r'"[^>]*>.*?</\1>\n\n?', "", t, flags=re.S)
    anchor = re.search(r'[ \t]*<h2[^>]*data-i18n="' + re.escape(cfg["before"]) + r'"', t)
    if not anchor:
        sys.exit(f"{app}: heading {cfg['before']} not found")
    t = t[:anchor.start()] + block_html() + t[anchor.start():]
    t = add_note(t, cfg["short"], en["shortNote"])
    page.write_text(t)

    dpath = HERE / "i18n" / f"{app}_privacy.json"
    d = json.loads(dpath.read_text())
    for lang in LANGS:
        d[lang].update(dict_keys(lang))
        for k in cfg.get("drop", []):
            d[lang].pop(k, None)
        note = text[lang]["shortNote"]
        if note not in d[lang][cfg["short"]]:
            d[lang][cfg["short"]] = d[lang][cfg["short"]].rstrip() + " " + note
    dpath.write_text(json.dumps(d, indent=1, ensure_ascii=False))
    # Build the privacy page only: the other pages of the app have their own state (and may be mid-edit).
    conf = json.loads((HERE / f"{app}.config.json").read_text())
    conf["pages"] = [p for p in conf["pages"] if p["src"] == "privacy.html"]
    tmp = HERE / f".{app}-privacy.config.json"
    tmp.write_text(json.dumps(conf))
    try:
        subprocess.run([sys.executable, str(HERE / "build_i18n.py"), str(tmp)], check=True, stdout=subprocess.DEVNULL)
    finally:
        tmp.unlink()
    print("synced", app)

print("""Still by hand (per app, six languages): meta description and og:description of each privacy page,
"Last updated" line, the landing-page FAQ sentence on network access, and in SideSchedule the list item
"No crash data unless you choose to email it yourself" (never.li4).""")
