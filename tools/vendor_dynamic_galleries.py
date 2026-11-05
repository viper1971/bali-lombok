#!/usr/bin/env python3
"""Cache Commons search photographs with attribution and verified reuse licenses."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from html import unescape
from io import BytesIO
from PIL import Image, ImageOps
import hashlib, json, re

root=Path(__file__).resolve().parents[1]
inventory=json.loads((root/'docs/dynamic-gallery-inventory.json').read_text())
queries=sorted({t['search_query'] for g in inventory['galleries'] for t in g['topics']})
folder=root/'assets/images/gallery';folder.mkdir(parents=True,exist_ok=True)
catalog_file=root/'assets/data/gallery-catalog.js'
report_file=root/'docs/dynamic-gallery-migration.json'
ua='BaliLombokGallery/1.0 (https://github.com/viper1971/bali-lombok)'
def clean(s):return unescape(re.sub(r'<[^>]+>','',s or '')).strip()
def fetch(url):
    with urlopen(Request(url,headers={'User-Agent':ua}),timeout=25) as res:
        raw=res.read(12_000_001)
    if len(raw)>12_000_000:raise ValueError('File over 12MB')
    return raw
def attempt(query):
    name=hashlib.sha256(query.encode()).hexdigest()[:16]+'.webp'
    dest=folder/name
    params={'action':'query','format':'json','generator':'search','gsrnamespace':6,
        'gsrlimit':10,'gsrsearch':query+' filetype:bitmap','prop':'imageinfo',
        'iiprop':'url|size|extmetadata','iiurlwidth':1200,
        'iiextmetadatafilter':'Artist|LicenseShortName|LicenseUrl'}
    url='https://commons.wikimedia.org/w/api.php?'+urlencode(params)
    try:
        response=json.loads(fetch(url))
        pages=list((response.get('query') or {}).get('pages',{}).values())
        pages.sort(key=lambda p:p.get('index',999))
        for page in pages:
            info=(page.get('imageinfo') or [None])[0]
            if not info:continue
            meta=info.get('extmetadata') or {}
            lic=clean(meta.get('LicenseShortName',{}).get('value',''))
            if not re.match(r'^(CC0|CC BY(?:-SA)?[\s\d.-]|Public domain|PD-|PDM)',lic,re.I):continue
            src=info.get('thumburl') or info.get('url')
            if not src or not src.startswith('https://') or not info.get('descriptionurl'):continue
            if not dest.is_file():
                data=fetch(src)
                with Image.open(BytesIO(data)) as im:
                    im=ImageOps.exif_transpose(im)
                    if im.width*im.height>90_000_000:raise ValueError('Oversized image')
                    im.thumbnail((1300,1300),Image.Resampling.LANCZOS)
                    if im.mode not in ('RGB','RGBA'):im=im.convert('RGB')
                    im.save(dest,'WEBP',quality=78,method=6)
            return query,{'src':dest.relative_to(root).as_posix(),
                'page':info['descriptionurl'],
                'author':clean(meta.get('Artist',{}).get('value',''))[:100] or 'Wikimedia Commons',
                'license':lic,
                'licenseUrl':clean(meta.get('LicenseUrl',{}).get('value',''))},None
        return query,None,'No license-compatible image'
    except Exception as e:return query,None,str(e)
existing={}
if catalog_file.is_file():
    m=re.search(r'window\.BALI_GALLERY_LOCAL\s*=\s*(\{.*\});',catalog_file.read_text(),re.S)
    if m:
        try:existing=json.loads(m.group(1))
        except ValueError:pass
photos={q:v for q,v in existing.items() if (root/v.get('src','')).is_file()}
failed=[]
with ThreadPoolExecutor(max_workers=3) as pool:
    tasks=[pool.submit(attempt,q) for q in queries if q not in photos]
    for task in as_completed(tasks):
        q,photo,err=task.result()
        if photo:photos[q]=photo
        else:failed.append({'query':q,'reason':err})
if not photos:raise SystemExit('No usable Commons photos; existing catalog unchanged')
ordered={q:photos[q] for q in sorted(photos)}
catalog_file.write_text('/* Licensed Commons images, with local attribution. */\nwindow.BALI_GALLERY_LOCAL = '+json.dumps(ordered,ensure_ascii=False,separators=(',',':'))+';\n')
report={'total_queries':len(queries),'localized':len(ordered),'remaining':len(queries)-len(ordered),
        'failed':sorted(failed,key=lambda x:x['query'])}
revision=hashlib.sha256(catalog_file.read_bytes()).hexdigest()[:12]
for page in (root/'src/index.html',root/'index.html'):
    content=page.read_text(encoding='utf8')
    content=re.sub(r'assets/data/gallery-catalog[.]js(?:[?]v=[^"\\s]+)?',
                   'assets/data/gallery-catalog.js?v='+revision,content)
    page.write_text(content,encoding='utf8')
report_file.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'total':len(queries),'localized':len(ordered),'remaining':len(queries)-len(ordered)}))
