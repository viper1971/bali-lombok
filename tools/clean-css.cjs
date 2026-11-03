// Only identical adjacent declarations/rules within the same parent can be removed.
const fs=require('node:fs'),postcss=require('postcss');
const report=[];
for(const file of fs.readdirSync('assets/css').filter(n=>n.endsWith('.css')).sort()){
 const path='assets/css/'+file, before=fs.readFileSync(path,'utf8'),root=postcss.parse(before,{from:path});let declarations=0,rules=0;
 root.walkRules(rule=>{
  if(!rule.nodes.every(n=>['decl','comment'].includes(n.type)))return;
  const seen=new Map();
  for(const node of [...rule.nodes]){
   if(node.type!=='decl')continue;
   const key=JSON.stringify([node.prop,node.value,!!node.important]);
   if(seen.has(key)){seen.get(key).remove();declarations++;}seen.set(key,node);
  }
 });
 function clean(container){
  const seen=new Map();
  for(const node of [...(container.nodes||[])]){
   if(node.type==='atrule'){seen.clear();clean(node);}
   else if(node.type==='rule'){
    const key=node.toString().trim();
    if(seen.has(key)){seen.get(key).remove();rules++;}seen.set(key,node);
   }
  }
 }
 clean(root);
 const after=root.toString();if(before!==after)fs.writeFileSync(path,after);
 if(declarations||rules)report.push({path,declarations,rules,bytesSaved:Buffer.byteLength(before)-Buffer.byteLength(after)});
}
fs.writeFileSync('docs/css-cleanup.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
