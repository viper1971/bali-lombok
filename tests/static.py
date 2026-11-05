import json
import pathlib
import re
import subprocess
import unittest
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.tags = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

class BuildTests(unittest.TestCase):
    def test_build_reproducible(self):
        watched = ["src/index.html", "index.html", "sw.js", "assets/build-manifest.json"]
        before = [(ROOT / p).read_bytes() for p in watched]
        result = subprocess.run(["python3", "tools/build.py"], cwd=ROOT, check=True,
                                capture_output=True, text=True)
        report = json.loads(result.stdout)
        self.assertEqual(report["status"], "ok")
        self.assertEqual(report["mode"], "build")
        self.assertFalse(report["updated"])
        self.assertEqual(report["missing"], 0)
        self.assertEqual(before, [(ROOT / p).read_bytes() for p in watched])
        subprocess.run(["python3", "tools/build.py", "--check"], cwd=ROOT,
                       check=True, capture_output=True)

    def test_source_matches_publication(self):
        self.assertEqual((ROOT / "src/index.html").read_bytes(),
                         (ROOT / "index.html").read_bytes())

    def test_markup_ids_unique_and_stable(self):
        src = Page((ROOT / "src/index.html").read_text())
        out = Page((ROOT / "index.html").read_text())
        ids = lambda page: [a["id"] for _, a in page.tags if "id" in a]
        self.assertEqual(ids(src), ids(out))
        self.assertEqual(len(ids(out)), len(set(ids(out))))
        self.assertGreater(len(ids(out)), 150)

    def test_local_resources_and_charset(self):
        text = (ROOT / "index.html").read_text()
        self.assertLess(text.index('<meta charset="UTF-8">'), 1024)
        self.assertIn("assets/build/js-head-critical-a-20261105.js", text)
        self.assertIn("assets/build/js-gallery-runtime-batch-20261105.js", text)
        for tag, a in Page(text).tags:
            value = (a.get("src") if tag in ("script", "img", "iframe", "source")
                     else a.get("href") if tag == "link" else None)
            if value and not re.match(r"^(https?:|data:|//|#)", value):
                self.assertTrue((ROOT / value.split("?")[0].lstrip("/")).is_file(), value)

    def test_javascript_syntax(self):
        page = Page((ROOT / "index.html").read_text())
        scripts = {a["src"].split("?")[0] for tag, a in page.tags
                   if tag == "script" and a.get("src", "").startswith("assets/")}
        self.assertGreater(len(scripts), 30)
        for path in sorted(scripts):
            if path.endswith(".js"):
                subprocess.run(["node", "--check", str(ROOT / path)],
                               cwd=ROOT, check=True, capture_output=True)

    def test_css_semantics_of_legacy_assets(self):
        # The old source-to-asset mappings are retained as an archive; the
        # canonical published HTML is now src/index.html.
        subprocess.run(["node", "tests/css-semantics.cjs"], cwd=ROOT,
                       check=True, capture_output=True)

if __name__ == "__main__":
    unittest.main(verbosity=2)
