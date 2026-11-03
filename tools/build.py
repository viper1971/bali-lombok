#!/usr/bin/env python3
"""Deterministic static build; preserves script boundaries and CSS cascade order."""
import hashlib, json, pathlib, re, subprocess
ROOT = pathlib.Path(__file__).resolve().parents[1]
source = (ROOT / 'src/index.html').read_text()
out = ROOT / 'assets/build'
out.mkdir(exist_ok=True)
for old in out.glob('*'):
    old.unlink()
manifest = []
js_sources = {p: (ROOT / p).read_text() for p in re.findall(r'<script\b[^>]*src="(assets/js/[^\"]+)"', source)}
minified = json.loads(subprocess.run(['node', 'tools/minify-js.cjs'], cwd=ROOT, input=json.dumps(js_sources), text=True, capture_output=True, check=True).stdout)
css_sources = {p: (ROOT / p).read_text() for p in re.findall(r'href="(assets/css/[^\"]+)"', source)}
minified_css = json.loads(subprocess.run(['node', 'tools/minify-css.cjs'], cwd=ROOT, input=json.dumps(css_sources), text=True, capture_output=True, check=True).stdout)
def emit(kind, content, sources):
    digest = hashlib.sha256(content.encode()).hexdigest()[:16]
    name = f'assets/build/{kind}-{digest}.{kind}'
    (ROOT / name).write_text(content)
    manifest.append({'output': name, 'sources': sources, 'bytes': len(content.encode())})
    return name
# Comment-only scripts have no execution or DOM dependencies. Keep an inert element
# if an ID exists, so selectors and integrations still find the original anchor.
def script(m):
    tag, path = m[0], m[1]
    content = (ROOT / path).read_text()
    executable = re.sub(r'/\*.*?\*/|//[^\n]*', '', content, flags=re.S).strip()
    if not executable:
        return re.sub(r'\s+src="[^"]+"', '', tag)
    return tag.replace(path, emit('js', minified[path], [path]))
source = re.sub(r'<script\b[^>]*src="(assets/js/[^"]+)"[^>]*></script>', script, source)
# Merge only neighbouring stylesheets separated by whitespace/comments: never
# move CSS across a script or markup boundary. Preserve IDs as inert anchors.
css = r'<link\b[^>]*href="assets/css/[^"]+"[^>]*>'
pattern = css + r'(?:(?:\s|<!--.*?-->)*' + css + r')*'
def styles(m):
    tags = re.findall(css, m[0])
    paths = [re.search(r'href="([^"]+)"', t)[1] for t in tags]
    contents = [minified_css[p] for p in paths]
    # CSS relative URLs and @imports would change meaning after relocating.
    for p, c in zip(paths, contents):
        urls = re.findall(r"url\(\s*(?:\"([^\"]*)\"|'([^']*)'|([^)]*))\)", c)
        if '@import' in c or any(not next((v for v in u if v), '').strip().startswith(('http:', 'https:', 'data:', '//', '#')) for u in urls):
            raise ValueError(f'Unsafe CSS relocation: {p}')
    chunks, batch, size = [], [], 0
    for path, content in zip(paths, contents):
        if batch and size + len(content.encode()) > 64000:
            chunks.append(batch); batch, size = [], 0
        batch.append((path, content)); size += len(content.encode())
    if batch: chunks.append(batch)
    links = ''
    for batch in chunks:
        name = emit('css', '\n'.join(c for p,c in batch), [p for p,c in batch])
        links += f'<link rel="stylesheet" href="{name}">'
    anchors = ''.join('<style id="'+i+'"></style>' for t in tags for i in re.findall(r'\bid="([^"]+)"',t))
    comments = '\n'.join(re.findall(r'<!--.*?-->',m[0],re.S))
    return links+anchors+'\n'+comments
source = re.sub(pattern, styles, source, flags=re.S)
# Charset must precede scripts and appear within the first 1024 bytes.
source = source.replace('    <meta charset="UTF-8">\n','')
source = source.replace('<head>', '<head>\n    <meta charset="UTF-8">',1)
source = source.replace('href="https://viper1971.github.io/bali-lombok/icon-192.png"','href="icon-192.png"')
(ROOT / 'index.html').write_text(source)
(ROOT / 'assets/build-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'source_files':sum(len(m['sources']) for m in manifest),'requests':len(manifest),'bytes':sum(m['bytes'] for m in manifest)}))
worker = (ROOT / 'src/sw.js').read_text()
shell = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'transportData.js'] + [m['output'] for m in manifest]
version = hashlib.sha256((source + worker + ''.join((ROOT / p).read_text() for p in shell if p.endswith(('.js','.json')))).encode()).hexdigest()[:16]
(ROOT / 'sw.js').write_text('const VERSION = '+json.dumps(version)+';\nconst SHELL = '+json.dumps(shell)+';\n'+worker)

# Version marker prevents mixing cached HTML with a different release's assets.
(ROOT / 'index.html').write_text(source.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n    <meta name="bali-build" content="' + version + '">', 1))
