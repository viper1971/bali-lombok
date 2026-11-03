const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function fixture(){
 const nodes=[],timers=new Map();let id=0;
 const context={console,Promise,Error,setTimeout:fn=>{timers.set(++id,fn);return id},clearTimeout:n=>timers.delete(n)};
 context.window=context;context.addEventListener=()=>{};
 context.document={createElement:tag=>({tag,remove(){const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1)}}),head:{appendChild:n=>nodes.push(n)},addEventListener:()=>{}};
 vm.runInNewContext(fs.readFileSync('assets/js/008.js','utf8'),context);
 return {context,nodes,timers};
}
(async()=>{
 let {context:c,nodes,timers}=fixture();let p=c.ensureLeaflet();assert.equal(c.ensureLeaflet(),p);assert.equal(nodes.length,2);
 nodes.find(n=>n.tag==='script').onerror();await assert.rejects(p,/Leaflet/);assert.equal(nodes.length,0);assert.equal(timers.size,0);
 p=c.ensureLeaflet();assert.equal(nodes.length,2);c.L={map(){},Map:{addInitHook(){}}};nodes.find(n=>n.tag==='script').onload();
 let resolved=false;p.then(()=>resolved=true,()=>{});await Promise.resolve();assert.equal(resolved,false,'must wait for CSS');
 nodes.find(n=>n.tag==='link').onerror();await assert.rejects(p,/Styly/);assert.equal(nodes.length,0);
 p=c.ensureLeaflet();assert.equal(nodes.length,1,'already loaded JS must not download twice');nodes[0].onload();await p;assert.equal(timers.size,0);assert.equal(await c.ensureLeaflet(),c.L);
 ({context:c,nodes,timers}=fixture());p=c.ensureLeaflet();[...timers.values()][0]();await assert.rejects(p,/časový limit/);assert.equal(nodes.length,0);assert.equal(timers.size,0);
 p=c.ensureLeaflet();assert.equal(nodes.length,2);c.L={map(){},Map:{addInitHook(){}}};nodes[0].onload();nodes[1].onload();await p;
 console.log('PASS: concurrent map loads, CSS failure, JS failure, timeout cleanup and recovery');
})().catch(e=>{console.error(e);process.exitCode=1});
