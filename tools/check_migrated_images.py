#!/usr/bin/env python3
"""Ensure external photo migration outputs exist and do not regress."""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "docs/external-image-migration.json").read_text(encoding="utf8"))
missing = [x["path"] for x in manifest.get("migrated", []) if not (ROOT / x["path"]).is_file()]
urls_left = []
for p in [ROOT / "src/index.html", ROOT / "index.html", *sorted((ROOT / "assets/js").glob("*.js")), *sorted((ROOT / "assets/build").glob("*.js")), *sorted((ROOT / "assets/css").glob("*.css"))]:
    text = p.read_text(encoding="utf8")
    if re.search(r"https?://(?:images[.]unsplash[.]com|images[.]pexels[.]com)/", text):
        urls_left.append(str(p.relative_to(ROOT)))
if missing or urls_left:
    raise SystemExit(json.dumps({"missing_images":missing,"remote_unsplash_pexels":urls_left},ensure_ascii=False))
print(f"OK: {len(manifest['migrated'])} localized photographs; no missing files or original remote URLs.")
