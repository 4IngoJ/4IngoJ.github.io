#!/usr/bin/env python3
"""Build short redirect pages: didact.digital/go/<slug> -> target + UTM.

GitHub Pages is static, so each slug becomes go/<slug>/index.html with
OG tags (LinkedIn previews read these) and a meta-refresh/JS redirect.
Edit _tools/links.json, run this, commit go/.
"""
import html, json, re, shutil, sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://didact.digital"
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{0,40}$")
OG_IMAGE = f"{SITE}/assets/og-image.png"

PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="robots" content="noindex">
<meta name="description" content="{desc}">
<link rel="canonical" href="{canon}">
<meta property="og:type" content="website">
<meta property="og:url" content="{short}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{image}">
<meta property="og:site_name" content="didact.digital">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url={target}">
<script>location.replace({target_js});</script>
</head>
<body><p><a href="{target}">Continue to didact.digital</a></p></body>
</html>
"""


def build():
    cfg = json.loads((ROOT / "_tools" / "links.json").read_text())
    defaults = cfg.get("defaults", {})
    out = ROOT / "go"
    if out.exists():
        shutil.rmtree(out)
    for slug, l in cfg["links"].items():
        if not SLUG.match(slug):
            sys.exit(f"bad slug: {slug!r}")
        base = urljoin(SITE + "/", l["url"])
        if urlparse(base).scheme != "https":
            sys.exit(f"{slug}: target must be https")
        utm = {k: v for k, v in {**defaults, **l}.items() if k.startswith("utm_")}
        p = urlparse(base)
        query = urlencode(parse_qsl(p.query) + list(utm.items()))
        target = p._replace(query=query).geturl()
        (out / slug).mkdir(parents=True)
        (out / slug / "index.html").write_text(PAGE.format(
            title=html.escape(l.get("title", "didact.digital")),
            desc=html.escape(l.get("description", "Small Mac apps. One-time purchase, no account, no tracking.")),
            canon=html.escape(base), short=f"{SITE}/go/{slug}",
            image=html.escape(l.get("image", OG_IMAGE)),
            target=html.escape(target), target_js=json.dumps(target).replace("</", "<\\/"),
        ))
        print(f"{SITE}/go/{slug}  ->  {target}")


if __name__ == "__main__":
    build()
