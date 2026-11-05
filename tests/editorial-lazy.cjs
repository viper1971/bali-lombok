const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('assets/js/049.js','utf8');
const deployed = fs.readFileSync('assets/build/js-1650a00000000004.js','utf8');
for (const [file, js] of [['source',code],['production',deployed]]) {
  new vm.Script(js,{filename:file+'.js'});
  assert(js.includes('queueEditorial'),file+' lost scroll-activated editorial image queue');
  assert(js.includes('imgStarted.editorial'),file+' duplicates editorial requests');
  assert(js.includes('getBoundingClientRect'),file+' lost viewport check');
  assert(js.includes('pointerdown'),file+' lost touch/mouse activation');
  assert(!/imgStarted\.base\s*=\s*true;\s*\[['"]inl_2/.test(js),file+' immediately queues external images');
}
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('js-1650a00000000004.js?v=lazy-editorial-20261105'),
       'Production page still loads outdated editorial script');
console.log('Deferred editorial Commons requests are intact.');
