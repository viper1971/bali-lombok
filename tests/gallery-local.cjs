const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync('assets/data/gallery-catalog.js','utf8');
const ctx={window:{}};vm.runInNewContext(script,ctx,{timeout:1000});
const entries=Object.entries(ctx.window.BALI_GALLERY_LOCAL||{});
const missing=ctx.window.BALI_GALLERY_MISSING||[];
const manifest=JSON.parse(fs.readFileSync('docs/dynamic-gallery-inventory.json','utf8'));
assert.equal(entries.length+missing.length,manifest.topic_count,'Unaccounted gallery topics');
for(const query of missing){
  assert.equal(typeof query,'string');
  assert(!Object.hasOwn(ctx.window.BALI_GALLERY_LOCAL,query),'Missing topic incorrectly has a photograph');
}

for(const [query,photo] of entries){
  assert(query.length>0);
  assert(photo.src?.startsWith('assets/images/gallery/'),query+' is not local');
  assert(fs.existsSync(photo.src),query+' local file is missing');
  assert(photo.page?.startsWith('https://commons.wikimedia.org/'),query+' has no source credit');
  assert(/^(CC0|CC BY(?:-SA)?[\s\d.-]|Public domain|PD-|PDM)/i.test(photo.license||''),query+' has unapproved license');
}
const html=fs.readFileSync('index.html','utf8');
const src=fs.readFileSync('src/index.html','utf8');
for(const [label,content,needle] of [['production',html,'assets/build/js-2a84e1c14c764d64.js'],['source',src,'assets/js/047.js']]){
 const start=content.indexOf('assets/data/gallery-catalog.js'),use=content.indexOf(needle);
 assert(start>=0&&use>start,label+' does not load local gallery catalog before gallery logic');
}
for(const file of ['assets/js/047.js','assets/build/js-2a84e1c14c764d64.js']){
 const code=fs.readFileSync(file,'utf8');
 assert(code.includes('window.BALI_GALLERY_LOCAL'),file+' fails to prefer local photographs');
 assert(code.includes('window.BALI_GALLERY_MISSING'),file+' does not skip unavailable remote photos');
 new vm.Script(code);
}
console.log('Verified '+entries.length+' locally credited gallery photos');
