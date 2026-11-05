import hashlib, json, pathlib, re, subprocess, unittest
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.tags=[];self.feed(text)
 def handle_starttag(self,tag,attrs): self.tags.append((tag,dict(attrs)))
class BuildTests(unittest.TestCase):
 def test_build_reproducible(self):
  paths=['index.html','sw.js','assets/build-manifest.json']
  before=[(ROOT/p).read_bytes() for p in paths]
  published=(ROOT/'index.html').read_text()
  if 'js-head-critical-a-20261105.js' in published:
   result=subprocess.run(['python3','tools/build.py'],cwd=ROOT,capture_output=True,text=True)
   self.assertNotEqual(result.returncode,0)
   self.assertIn('Build blocked',result.stderr+result.stdout)
  else:
   subprocess.run(['python3','tools/build.py'],cwd=ROOT,check=True,capture_output=True)
  self.assertEqual(before,[(ROOT/p).read_bytes() for p in paths])
 def test_ids_and_markup_preserved(self):
  src=Page((ROOT/'src/index.html').read_text());out=Page((ROOT/'index.html').read_text())
  ids=lambda p: sorted(a['id'] for _,a in p.tags if 'id' in a)
  self.assertEqual(ids(src),ids(out));self.assertEqual(len(ids(out)),len(set(ids(out))))
  content=lambda p:[(t,a) for t,a in p.tags if t not in ('script','style','link','meta')]
  self.assertEqual(content(src),content(out))
 def test_sources_preserved_in_order(self):
  manifest=json.loads((ROOT/'assets/build-manifest.json').read_text())
  for m in manifest:
   content=(ROOT/m['output']).read_text()
   if m['output'].endswith('.js'):
    self.assertTrue(content.strip());subprocess.run(['node','--check',str(ROOT/m['output'])],check=True,capture_output=True)
   else:self.assertTrue(content.strip())
  for ext,attr in [('js','src'),('css','href')]:
   src=re.findall(attr+r'="(assets/'+ext+r'/[^"]+)"',(ROOT/'src/index.html').read_text())
   flattened=[p for m in manifest if m['output'].endswith('.'+ext) for p in m['sources']]
   if ext=='js':src=[p for p in src if re.sub(r'/\*.*?\*/|//[^\n]*','',(ROOT/p).read_text(),flags=re.S).strip()]
   self.assertEqual(src,flattened)
 def test_css_semantics(self):
  subprocess.run(['node','tests/css-semantics.cjs'],cwd=ROOT,check=True,capture_output=True)
 def test_local_resources_and_charset(self):
  text=(ROOT/'index.html').read_text();self.assertLess(text.index('<meta charset='),1024)
  for tag,a in Page(text).tags:
   value=a.get('src') if tag in ['script','img'] else a.get('href') if tag=='link' else None
   if value and not re.match(r'^(https?:|data:|//|#)',value):self.assertTrue((ROOT/value.split('?')[0]).exists(),value)
 def test_js_syntax(self):
  for p in list((ROOT/'assets/js').glob('*.js'))+[ROOT/'sw.js',ROOT/'transportData.js']:
   subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
 def test_offline_shell_complete(self):
  sw=(ROOT/'sw.js').read_text();shell=json.loads(re.search(r'const SHELL = (.*);',sw)[1])
  for m in json.loads((ROOT/'assets/build-manifest.json').read_text()):self.assertIn(m['output'],shell)
  for p in shell:self.assertTrue((ROOT/p).exists(),p)
if __name__=='__main__':unittest.main(verbosity=2)
