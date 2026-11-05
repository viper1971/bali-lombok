/* Magazine stability: hero stays in normal document flow, with native scrolling. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('assets/js/068-magazine-layout.js','utf8');
const deployed=fs.readFileSync('assets/build/js-head-critical-a-20261105.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sourceHtml=fs.readFileSync('src/index.html','utf8');
for(const [label,script] of [['source',source],['production',deployed]]){
  new vm.Script(script);
  assert(!script.includes('gate.showModal()'),label+' still traps the magazine cover in a modal');
  assert(!script.includes('mg-entry-spacer'),label+' still moves the cover out of normal flow');
  assert(!script.includes('.mg-cover-cta'),label+' still binds removed entry button');
}
for(const [label,markup] of [['source',sourceHtml],['production',html]]){
  assert(markup.includes('class="mg-cover mg-only"'),label+' has lost the magazine cover');
  assert(!markup.includes('class="mg-cover-cta"'),label+' still renders Explore trip CTA');
  assert(markup.includes('class="page-fullscreen-btn mg-cover-fullscreen"'),label+' has lost fullscreen button');
  assert(markup.includes('href="assets/native-scroll-20261105.css"'),label+' lacks natural scrolling override');
  assert(markup.includes('data-bali-critical-magazine="1"'),label+' lacks early magazine stylesheet');
}
assert.equal(sourceHtml,html,'canonical published page must match source');
const nativeScroll=fs.readFileSync('assets/native-scroll-20261105.css','utf8');
assert(/scroll-behavior:\s*auto\s*!important/.test(nativeScroll),'scroll override must disable global smooth scrolling');
console.log('PASS: in-flow magazine hero, fullscreen preserved, no CTA/modal, natural scrolling CSS');
