const fs=require('node:fs'),postcss=require('postcss'),assert=require('node:assert/strict');
function semantic(node){
 if(node.type==='comment')return null;
 const result={type:node.type};
 for(const key of ['selector','prop','value','important','name','params'])if(node[key]!==undefined)result[key]=node[key];
 if(node.nodes)result.nodes=node.nodes.map(semantic).filter(Boolean);
 return result;
}
for(const entry of JSON.parse(fs.readFileSync('assets/build-manifest.json'))){
 if(!entry.output.endsWith('.css'))continue;
 const source=entry.sources.map(p=>fs.readFileSync(p,'utf8')).join('\n');
 assert.deepEqual(semantic(postcss.parse(fs.readFileSync(entry.output,'utf8'))),semantic(postcss.parse(source)),entry.output);
}
console.log('PASS: CSS selectors, declarations, values, conditions and order are preserved');
