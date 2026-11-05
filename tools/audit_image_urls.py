#!/usr/bin/env python3
"""Inventory externally hosted image URLs in source HTML, CSS and JS."""
import html
import json
import pathlib
import re
from collections import defaultdict
from urllib.parse import urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[1]
FILES = [ROOT / 'src/index.html', *sorted((ROOT / 'assets/css').glob('*.css')),
         *sorted((ROOT / 'assets/js').glob('*.js'))]
URL = re.compile(r'https?://[^\s\x22\x27\x60<>()\\]+', re.I)
MEDIA = re.compile(r'\.(?:jpe?g|png|webp|avif|gif|svg)(?:\?|$)', re.I)
HOSTS = ('images.unsplash.com', 'images.pexels.com',
         'upload.wikimedia.org', 'images.weserv.nl', 'i.imgur.com')
items = defaultdict(set)
for file in FILES:
    if not file.exists():
        continue
    src = html.unescape(file.read_text(encoding='utf8'))
    for raw in URL.findall(src):
        url = raw.rstrip(';,.]')
        host = urlsplit(url).hostname or ''
        if host in HOSTS or MEDIA.search(urlsplit(url).path):
            if host not in ('viper1971.github.io',):
                items[url].add(str(file.relative_to(ROOT)))
records = [{'url':url, 'host':urlsplit(url).hostname,
            'files':sorted(paths)} for url,paths in sorted(items.items())]
report = {'total_external_image_urls':len(records),
          'by_host':dict(sorted((h,sum(r['host']==h for r in records))
                                 for h in {r['host'] for r in records})),
          'images':records}
target = ROOT / 'docs/external-image-inventory.json'
target.parent.mkdir(exist_ok=True)
target.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'total':len(records),'by_host':report['by_host']}))
