#!/usr/bin/env python3
"""Audit production page resources without rewriting the customized build."""
import json
import pathlib
import re
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"

class Tags(HTMLParser):
    def __init__(self, content):
        super().__init__()
        self.tags = []
        self.feed(content)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

text = HTML.read_text(encoding="utf8")
parsed = Tags(text)
references = []
for tag, a in parsed.tags:
    if tag in ("script", "img", "iframe", "source"):
        key = "src"
    elif tag == "link":
        key = "href"
    else:
        continue
    value = a.get(key)
    if not value or value.startswith(("data:", "blob:", "#", "javascript:", "//")):
        continue
    u = urlsplit(value)
    if u.scheme and u.scheme not in ("http", "https"):
        continue
    if u.scheme and u.netloc not in ("viper1971.github.io",):
        continue
    local = unquote(u.path)
    if u.netloc == "viper1971.github.io" and local.startswith("/bali-lombok/"):
        local = local.removeprefix("/bali-lombok/")
    elif u.netloc:
        continue
    else:
        local = local.lstrip("/")
    if not local or "{" in local or ".." in pathlib.PurePosixPath(local).parts:
        continue
    references.append({"tag": tag, "url": value, "path": local, "exists": (ROOT / local).is_file()})

# Responsive image references are additional network requests and must be checked, too.
responsive = []
for tag, attributes in parsed.tags:
    for field in ("srcset", "imagesrcset"):
        value = attributes.get(field)
        if not value:
            continue
        for candidate in value.split(","):
            url = candidate.strip().split()[0] if candidate.strip() else ""
            if not url or url.startswith(("data:", "http://", "https://", "//")):
                continue
            pathname = unquote(urlsplit(url).path).lstrip("/")
            if pathname.startswith("bali-lombok/"):
                pathname = pathname.removeprefix("bali-lombok/")
            if pathname and ".." not in pathlib.PurePosixPath(pathname).parts:
                responsive.append({"tag":tag, "url":url, "path":pathname, "exists":(ROOT / pathname).is_file()})
references.extend(responsive)
missing = [item for item in references if not item["exists"]]
scripts = [x for x in references if x["tag"] == "script" and x["path"].endswith(".js")]
styles = [x for x in references if x["tag"] == "link" and x["path"].endswith(".css")]
pictures = [(tag, a) for tag, a in parsed.tags if tag == "img"]
frames = [(tag, a) for tag, a in parsed.tags if tag == "iframe"]
manifest = json.loads((ROOT / "assets/build-manifest.json").read_text())
manifest_paths = {x["output"] for x in manifest}
overrides = [x["path"] for x in scripts if x["path"].startswith("assets/build/") and x["path"] not in manifest_paths]
nonlazy_frames = [i for i, (_, a) in enumerate(frames, 1) if a.get("loading") != "lazy"]
cover = next((a for _, a in pictures if a.get("class", "").find("mg-cover-photo") >= 0), {})
report = {
    "html_bytes": HTML.stat().st_size,
    "scripts": len(scripts), "stylesheets": len(styles),
    "images": len(pictures), "iframes": len(frames),
    "lazy_iframes": len(frames) - len(nonlazy_frames),
    "missing_local_resources": missing,
    "responsive_variant_references": len(responsive),
    "build_manifest_overrides": overrides,
    "hero_src": cover.get("src"),
    "hero_eager": cover.get("loading") == "eager" and cover.get("fetchpriority") == "high",
    "hero_preloaded": any(tag == "link" and a.get("rel") == "preload" and a.get("href") == cover.get("src") for tag, a in parsed.tags),
    "hero_responsive": bool(cover.get("srcset")) and bool(cover.get("sizes")),
    "remote_photo_hosts_present": bool(re.search(r"https?://(?:images[.]unsplash[.]com|images[.]pexels[.]com|thumb[.]wikimedia[.]org)/", text))
}
out = ROOT / "docs/production-resource-audit.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
print(json.dumps(report, ensure_ascii=False))
if missing or nonlazy_frames or report["remote_photo_hosts_present"] or not (report["hero_eager"] and report["hero_preloaded"] and report["hero_responsive"]):
    raise SystemExit("Production resource audit failed")
