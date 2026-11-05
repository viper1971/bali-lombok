#!/usr/bin/env python3
"""Download and optimize permissively licensed remote photography for GitHub Pages."""
import hashlib, html, json, pathlib, re, urllib.request
from io import BytesIO
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/images/external'
OUT.mkdir(parents=True, exist_ok=True)
PAT = re.compile(r"https?://(?:images[.]unsplash[.]com|images[.]pexels[.]com)/[^\s\x22\x27\x60<>\\)]+", re.I)
FILES = [ROOT/'src/index.html', *sorted((ROOT/'assets/js').glob('*.js')), *sorted((ROOT/'assets/css').glob('*.css'))]
report = {'migrated': [], 'failed': []}
cache = {}
for file in FILES:
    if not file.exists():
        continue
    source = file.read_text(encoding='utf8')
    updated = source
    for raw in dict.fromkeys(PAT.findall(source)):
        url = html.unescape(raw).rstrip(';,')
        if url not in cache:
            name = hashlib.sha256(url.encode()).hexdigest()[:16]+'.webp'
            dest = OUT/name
            try:
                if not dest.exists():
                    req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=25) as resp:
                        if not resp.headers.get('Content-Type','').lower().startswith('image/'):
                            raise ValueError('Not an image response')
                        data = resp.read(16*1024*1024+1)
                    if len(data)>16*1024*1024:
                        raise ValueError('Image over 16 MB')
                    with Image.open(BytesIO(data)) as im:
                        im = ImageOps.exif_transpose(im)
                        if im.width*im.height>100_000_000: raise ValueError('Too many pixels')
                        im.thumbnail((1900,1900), Image.Resampling.LANCZOS)
                        if im.mode not in ('RGB','RGBA'): im = im.convert('RGB')
                        im.save(dest, 'WEBP', quality=82, method=6)
                cache[url] = dest.relative_to(ROOT).as_posix()
                report['migrated'].append({'url':url,'path':cache[url],'bytes':dest.stat().st_size})
            except Exception as e:
                cache[url] = None
                report['failed'].append({'url':url,'path':str(file.relative_to(ROOT)),'error':str(e)})
        if cache[url]:
            replacement = ('https://viper1971.github.io/bali-lombok/' if file.suffix=='.css' else '') + cache[url]
            updated = updated.replace(raw,replacement)
    if updated!=source:
        file.write_text(updated,encoding='utf8')
(ROOT/'docs').mkdir(exist_ok=True)
(ROOT/'docs/external-image-migration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'migrated':len(report['migrated']),'failed':len(report['failed'])}))
