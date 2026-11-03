const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
(async()=>{
 const handlers={}, stores=new Map();let network=async()=>new Response('online');let added=[];
 const key=r=>typeof r==='string'?r:r.url;
 const caches={keys:async()=>[...stores.keys()],delete:async n=>stores.delete(n),open:async n=>{
  if(!stores.has(n))stores.set(n,new Map());const s=stores.get(n);
  return {match:async(r,opts)=>(s.get(key(r))||(opts?.ignoreSearch?[...s].find(([k])=>k.split('?')[0]===key(r).split('?')[0])?.[1]:undefined))?.clone(),put:async(r,v)=>s.set(key(r),v),keys:async()=>[...s.keys()],delete:async r=>s.delete(key(r)),addAll:async urls=>{added=urls;}};
 }};
 const scope='https://example.test/bali/';
 const context={self:{registration:{scope},location:{origin:'https://example.test'},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(n,f)=>handlers[n]=f},caches,fetch:(...a)=>network(...a),Response,URL,console};
 vm.runInNewContext(readFileSync('sw.js','utf8'),context);
 let pending;handlers.install({waitUntil:p=>pending=p});await pending;assert(added.includes('index.html'));assert(added.some(x=>x.endsWith('.css')));
 stores.set('unrelated-app',new Map());stores.set('bali2027-'+scope+'old',new Map());
 handlers.activate({waitUntil:p=>pending=p});await pending;assert(stores.has('unrelated-app'));assert(!stores.has('bali2027-'+scope+'old'));
 const request={method:'GET',url:scope,mode:'navigate'};
 async function get(req=request){let response;const waits=[];handlers.fetch({request:req,respondWith:p=>response=p,waitUntil:p=>waits.push(p)});const r=await response;await Promise.all(waits);return r;}
 assert.equal(await (await get()).text(),'online');
 network=async()=>{throw Error('offline')};assert.equal(await (await get()).text(),'online');
 network=async()=>new Response('server error',{status:503});assert.equal(await (await get()).text(),'online');
 network=async()=>new Response('asset');assert.equal(await(await get({method:'GET',url:scope+'file.js',mode:'cors'})).text(),'asset');
 network=async()=>{throw Error('offline')};assert.equal(await(await get({method:'GET',url:scope+'file.js',mode:'cors'})).text(),'asset');
 let result;network=async()=>new Response('saved');handlers.message({data:{type:'precache',urls:[scope+'photo.png','javascript:bad']},ports:[{postMessage:r=>result=r}],waitUntil:p=>pending=p});await pending;assert.equal(result.fail,1);assert(result.ok>added.length);
 console.log('PASS: shell, scoped cleanup, network/offline/503 fallback, background writes, precache validation');
})().catch(e=>{console.error(e);process.exitCode=1});
