// Remove formatting only. Selectors, values, media queries and rule order stay intact.
const fs=require('node:fs'),postcss=require('postcss');
const input=JSON.parse(fs.readFileSync(0,'utf8')),output={};
for(const [path,text] of Object.entries(input)){
 const root=postcss.parse(text,{from:path});
 root.walk(node=>{
  if(node.type==='comment'){node.remove();return;}
  node.raws.before='';node.raws.after='';
  if(node.type==='decl'){
   // Whitespace-only custom property values can be semantically meaningful.
   if(!node.prop.startsWith('--'))node.raws.between=':';
  }else if(node.type==='rule'||(node.type==='atrule'&&node.nodes))node.raws.between='';
 });
 root.raws.after='';output[path]=root.toString();
}
process.stdout.write(JSON.stringify(output));
