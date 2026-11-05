#!/usr/bin/env python3
"""Create responsive variants of the locally stored magazine-cover photograph."""
from pathlib import Path
from PIL import Image, ImageOps
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src/index.html'
PAGES = [SOURCE, ROOT / 'index.html']
TAG = re.compile(r'<img\b(?=[^>]*\bclass="mg-cover-photo")[^>]*>', re.I)
SRC = re.compile(r'\bsrc="([^"]+)"')
PRELOAD = re.compile(r'<link\b(?=[^>]*\brel="preload")(?=[^>]*\bas="image")[^>]*>', re.I)
WIDTHS = (640, 960, 1280)
source = SOURCE.read_text(encoding='utf8')
tag = TAG.search(source)
if not tag:
    raise SystemExit('Cover image not found')
match = SRC.search(tag.group(0))
if not match:
    raise SystemExit('Cover src missing')
path = match.group(1)
if not path.startswith('assets/images/external/') or not path.endswith('.webp'):
    raise SystemExit('Cover must be a local WebP image')
original = ROOT / path
if not original.is_file():
    raise SystemExit(f'Missing cover image: {path}')
variants = []
with Image.open(original) as raw:
    image = ImageOps.exif_transpose(raw)
    if image.mode not in ('RGB','RGBA'):
        image = image.convert('RGB')
    for width in WIDTHS:
        if image.width < width:
            continue
        dest = original.with_name(original.stem + f'-w{width}.webp')
        if not dest.is_file():
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            resized.save(dest, format='WEBP', quality=80, method=6)
        variants.append((dest.relative_to(ROOT).as_posix(), width, dest.stat().st_size))
if not variants:
    raise SystemExit('Image too small to build a responsive cover')
srcset = ', '.join(f'{p} {w}w' for p,w,_ in variants)
for page in PAGES:
    content = page.read_text(encoding='utf8')
    match = TAG.search(content)
    if not match:
        raise SystemExit(f'Cover missing in {page}')
    img = match.group(0)
    img = re.sub(r'\s+srcset="[^"]*"', '', img)
    img = re.sub(r'\s+sizes="[^"]*"', '', img)
    img = img.replace(' class="mg-cover-photo"', f' class="mg-cover-photo" srcset="{srcset}" sizes="100vw"')
    content = content[:match.start()] + img + content[match.end():]
    pm = PRELOAD.search(content)
    if not pm or f'href="{path}"' not in pm.group(0):
        raise SystemExit(f'Preload for cover missing in {page}')
    pre = pm.group(0)
    pre = re.sub(r'\s+imagesrcset="[^"]*"', '', pre)
    pre = re.sub(r'\s+imagesizes="[^"]*"', '', pre)
    pre = pre[:-1] + f' imagesrcset="{srcset}" imagesizes="100vw">'
    content = content[:pm.start()] + pre + content[pm.end():]
    page.write_text(content, encoding='utf8')
summary = {'original': path, 'variants': [{'path':p, 'width':w, 'bytes':size} for p,w,size in variants]}
(ROOT / 'docs/responsive-cover.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2)+'\n',encoding='utf8')
print(json.dumps(summary, ensure_ascii=False))
