/* Static regression guard: never eagerly warm all off-screen trip galleries. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('assets/js/047.js', 'utf8');
const production = fs.readFileSync('assets/build/js-2a84e1c14c764d64.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
for (const [label, code] of [['source', source], ['production', production]]) {
  new vm.Script(code, {filename: label + '-gallery.js'});
  assert(code.includes('IntersectionObserver'), label + ' lost viewport-triggered preparation');
  assert(code.includes('pointerenter'), label + ' lost interactive preparation');
  assert(code.includes('visibilitychange'), label + ' does not suspend timers in background tabs');
  assert(code.includes('_syncTimer'), label + ' does not suspend timers outside viewport');
  assert(!/window\.addEventListener\(\s*['"]load['"]\s*,\s*function\s*\(\)\s*\{[\s\S]*?s\._prepare/.test(code), label + ' warms hidden galleries after load');
  assert(!/idle\(function\s*\(\)\s*\{\s*s\._prepare/.test(code), label + ' includes background bulk preloading');
}
assert(html.includes('assets/build/js-2a84e1c14c764d64.js?v=visible-gallery-timers-20261105'),
  'Published HTML is not pointing to the optimized gallery script');
console.log('Gallery lazy-loading regression checks passed.');
