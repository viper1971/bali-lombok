const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('assets/js/068-magazine-layout.js','utf8');
const deployed=fs.readFileSync('assets/build/js-036fff53752dca28.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sourceHtml=fs.readFileSync('src/index.html','utf8');
for(const [label,script] of [['source',source],['production',deployed]]){
  new vm.Script(script);
  assert(script.includes('mg-entry-spacer'),label+' does not reserve the original cover slot');
  assert(script.includes('spacer.remove()'),label+' fails to remove spacer after entry');
  assert(script.includes('gate.showModal()'),label+' has removed the original magazine dialog');
  assert(script.includes('gate.replaceWith(cover)'),label+' does not restore cover after entry');
}
for(const [label,content,path] of [
  ['source',sourceHtml,'assets/css/074-travel-magazine.css'],
  ['production',html,'assets/build/css-73431e86df8d618e.css']]){
  const first=content.indexOf('data-bali-critical-magazine="1"');
  assert(first>=0&&first<content.indexOf('</head>'),label+' needs magazine CSS before first paint');
  assert(content.indexOf('href="'+path+'"')<content.indexOf('</head>'),label+' early stylesheet missing');
  assert(content.lastIndexOf('href="'+path+'"')>content.indexOf('</head>'),label+' original cascade stylesheet was moved');
}
for(const [label,content,journey] of [
  ['source',sourceHtml,'assets/css/078-journey-overview.css'],
  ['production',html,'assets/build/css-fb292f813752ad3a.css']]){
  assert(content.indexOf('href="'+journey+'"')<content.indexOf('</head>'),
    label+' journey grid must load before first paint');
  assert(content.lastIndexOf('href="'+journey+'"')>content.indexOf('</head>'),
    label+' original journey CSS cascade must remain intact');
}
assert(html.includes('js-036fff53752dca28.js?v=20261105-cleanheadings-cls-spacer'),
  'Published HTML is using old magazine dialog JavaScript');
console.log('Magazine CLS guard passed with dialog interaction unchanged.');
