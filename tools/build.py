#!/usr/bin/env python3
"""Reproducible build from the canonical optimized HTML, without deleting assets."""
import json
import pathlib
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/index.html"
DEST = ROOT / "index.html"

class LocalAssets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()
        self.scripts = []
        self.stylesheets = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        uri = a.get("src") if tag in ("script", "img", "iframe", "source", "video") else a.get("href") if tag == "link" else None
        if not uri:
            return
        parsed = urlsplit(uri)
        if parsed.scheme or parsed.netloc or uri.startswith(("#", "//", "data:")):
            return
        path = unquote(parsed.path).lstrip("/")
        if not path or path.startswith("../"):
            return
        self.paths.add(path)
        if tag == "script":
            self.scripts.append(path)
        if tag == "link" and a.get("rel", "").lower() == "stylesheet":
            self.stylesheets.append(path)

def main():
    check = "--check" in sys.argv
    unknown = set(sys.argv[1:]) - {"--check"}
    if unknown:
        raise SystemExit("Unknown build options: " + ", ".join(sorted(unknown)))
    source = SOURCE.read_text(encoding="utf-8")
    if not source.startswith("<!DOCTYPE html>"):
        raise SystemExit("Invalid source HTML; published files untouched")
    charset = source.find('<meta charset="UTF-8">')
    if not 0 <= charset < 1024:
        raise SystemExit("Missing early UTF-8 charset; published files untouched")
    parser = LocalAssets()
    parser.feed(source)
    missing = sorted(p for p in parser.paths if not (ROOT / p).is_file())
    if missing:
        raise SystemExit("Missing local assets; published files untouched: " + ", ".join(missing))
    if len(parser.scripts) < 30 or len(parser.stylesheets) < 15:
        raise SystemExit("Unexpected asset count; refusing to publish truncated source HTML")
    existing = DEST.read_text(encoding="utf-8") if DEST.exists() else ""
    if check and source != existing:
        raise SystemExit("Published index.html is out of sync with src/index.html")
    changed = source != existing
    if changed and not check:
        DEST.write_text(source, encoding="utf-8")
    print(json.dumps({
        "mode": "check" if check else "build",
        "status": "ok",
        "updated": changed and not check,
        "local_assets": len(parser.paths),
        "script_files": len(parser.scripts),
        "stylesheet_files": len(parser.stylesheets),
        "missing": 0
    }))

if __name__ == "__main__":
    main()
