const fs=require('node:fs'),{minify}=require('terser');
(async()=>{
 const input=JSON.parse(fs.readFileSync(0,'utf8')),output={};
 for(const [path,code] of Object.entries(input)){
  // No compression or renaming: preserve all functions, bindings and script scopes.
  output[path]=(await minify(code,{compress:false,mangle:false,format:{comments:false,ascii_only:false}})).code;
 }
 process.stdout.write(JSON.stringify(output));
})().catch(e=>{console.error(e);process.exitCode=1});
