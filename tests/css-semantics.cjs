const fs = require('node:fs');
const postcss = require('postcss');
const assert = require('node:assert/strict');

// Verify the active published CSS bundles, not the archived build manifest.
const groups = [
  ['assets/build/css-head-critical-20261105.css',
   ['assets/build/css-613ec9680ad29884.css', 'assets/build/css-0bf59c48c4f36c4b.css']],
  ['assets/build/css-head-premium-20261105.css',
   ['assets/build/css-fefa4167edc081b4.css', 'assets/build/css-d91e4adb36959e5e.css', 'assets/build/css-bd1c3854a1d0257c.css']],
  ['assets/build/css-gallery-route-20261105.css',
   ['assets/build/css-a9507dbad3ba3df8.css', 'assets/build/css-101851e6314c5e51.css']],
  ['assets/editorial-magazine-batch-20261105.css',
   ['assets/editorial-grid-v4.css', 'assets/global-magazine-v5.css']]
];
function semantic(node) {
  if (node.type === 'comment') return null;
  const result = {type:node.type};
  for (const key of ['selector','prop','value','important','name','params'])
    if (node[key] !== undefined) result[key] = node[key];
  if (node.nodes) result.nodes = node.nodes.map(semantic).filter(Boolean);
  return result;
}
const published = fs.readFileSync('index.html','utf8');
for (const [bundle, parts] of groups) {
  assert(published.includes('href="' + bundle + '"'), 'Published CSS bundle missing: ' + bundle);
  const expected = parts.map(p => fs.readFileSync(p, 'utf8')).join('\n');
  const actual = fs.readFileSync(bundle, 'utf8');
  assert.deepEqual(semantic(postcss.parse(actual, {from:bundle})),
                   semantic(postcss.parse(expected, {from:'original-css'})),
                   'CSS declarations differ from ordered originals: ' + bundle);
}
console.log('PASS: ' + groups.length + ' published CSS bundles preserve selectors, values, conditions and cascade order');
