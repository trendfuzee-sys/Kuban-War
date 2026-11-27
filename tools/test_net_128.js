const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const src=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const collision=vm.runInNewContext(src('net_collision_113.js')+'\nkwNetCollide');
function original(us,W,H,valid){for(let i=0;i<us.length;i++){const a=us[i];for(let j=i+1;j<us.length;j++){const b=us[j],dx=a.x-b.x,dy=a.y-b.y,m=a.r+b.r;if(Math.abs(dx)>m||Math.abs(dy)>m)continue;const d=Math.hypot(dx,dy);if(d<m){const ang=d>.01?Math.atan2(dy,dx):((a.id*13+b.id*7)%360)*Math.PI/180,push=(m-d)*.25,px=Math.cos(ang)*push,py=Math.sin(ang)*push;if(valid(a.x+px,a.y+py)){a.x+=px;a.y+=py}if(valid(b.x-px,b.y-py)){b.x-=px;b.y-=py}}}a.x=Math.max(5,Math.min(W-5,a.x));a.y=Math.max(5,Math.min(H-5,a.y))}}
for(let seed=1;seed<=32;seed++){let x=seed;const r=()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);const W=600,H=450,area=seed%2===0?80:600;const a=Array.from({length:160},(_,i)=>({id:i+1,x:r()*area,y:r()*Math.min(area,H),r:5+r()*25})),b=JSON.parse(JSON.stringify(a)),valid=(x,y)=>x>=0&&y>=0&&x<=W&&y<=H&&!(x>120&&x<165&&y>100&&y<140);original(a,W,H,valid);collision(b,W,H,valid);for(let i=0;i<a.length;i++){assert.ok(Math.abs(a[i].x-b[i].x)<1e-8,'collision x mismatch');assert.ok(Math.abs(a[i].y-b[i].y)<1e-8,'collision y mismatch')}}
const applied=[],commands=[];
const context=vm.createContext({console,performance,Blob,Response,CompressionStream,DecompressionStream,Uint8Array,ArrayBuffer,DataView,TextEncoder,TextDecoder,structuredClone,btoa,atob,setTimeout,clearTimeout,auth:async()=>{},online:{currentMatch:{id:'test'}},run:true,exiting:false,E:[{id:1,team:1},{id:2,team:0}],WW:100,WH:100,applyHostCommand:(k,p)=>commands.push([k,p]),applySnapshot:s=>applied.push(s),toast:()=>{}});
vm.runInContext(src('net_transport_128.js')+'\n globalThis.test={kwDelta,kwApplyDelta,packSnapshot,unpackSnapshot,queueCommand,receiveEnvelope,receiveChunk,sendState,acceptAck,validatedPayload,setNet:n=>{net=n}};',context);
const T=context.test,wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const n={match:{id:'test'},closed:false,serial:0,hostAck:0,lastSeq:0,ack:0,commandSeq:0,pending:new Map(),queue:new Map(),parts:new Map(),visual:new Map(),state:{readyState:'open',bufferedAmount:0,send:x=>chunks.push(x)}};
  let chunks=[];T.setNet(n);
  const state={mis:{p:'kaz'},gold:[600,600],E:Array.from({length:120},(_,i)=>({id:i+1,x:i*1.234,y:i*2.345,spec:{name:'Казак',description:'Повторяющийся текст для тестирования сжатия'}}))};
  const changed=structuredClone(state);changed.E[0].x=77;delete changed.E[1].spec;changed.E.splice(2,1);changed.E.reverse();changed.E.push({id:900,x:12});changed.gold[0]=555;assert.equal(JSON.stringify(T.kwApplyDelta(state,T.kwDelta(state,changed))),JSON.stringify(changed));
  const e=await T.packSnapshot(n,state);assert.equal(e.codec,'gzip');assert.equal(JSON.stringify(await T.unpackSnapshot(e)),JSON.stringify(state));
  assert.ok(T.sendState(n,e));for(const c of chunks.slice().reverse())T.receiveChunk(n,c);
  for(let i=0;i<60&&!n.lastSeq;i++)await wait(10);
  assert.equal(n.lastSeq,e.seq);assert.equal(applied.length,1);assert.equal(JSON.stringify(applied[0]),JSON.stringify(state));
  T.queueCommand(n,{seq:2,kind:'issue',payload:{ids:[1,2],x:20,y:10}});assert.equal(commands.length,0);
  T.queueCommand(n,{seq:1,kind:'stop',payload:{ids:[1]}});assert.equal(commands.length,2);assert.equal(commands[0][0],'stop');assert.equal(commands[1][0],'issue');assert.equal(JSON.stringify(commands[1][1].ids),'[1]');
  T.queueCommand(n,{seq:2,kind:'issue',payload:{ids:[1],x:20,y:10}});assert.equal(commands.length,2);
  T.queueCommand(n,{seq:3,kind:'train',payload:{buildingId:2,unit:1}});assert.equal(commands.length,2);assert.equal(n.hostAck,3);
  // Drop a complete intermediate frame and apply a later delta against an acknowledged baseline.
  const newer=structuredClone(state);newer.E[0].x=500;newer.gold[1]=720;
  T.receiveEnvelope(n,{kw:128,seq:4,ack:0,base:e.seq,codec:'json',data:T.kwDelta(state,newer)},true);
  for(let i=0;i<60&&n.lastSeq<4;i++)await wait(10);
  assert.equal(n.lastSeq,4);assert.equal(JSON.stringify(applied.at(-1)),JSON.stringify(newer));
  T.receiveEnvelope(n,{kw:128,seq:2,ack:0,codec:'json',data:state},true);await wait(20);assert.equal(n.lastSeq,4);
  n.commandSeq=5;n.pending.set(4,{});n.pending.set(5,{});T.acceptAck(n,4);assert.equal(n.pending.has(4),false);assert.equal(n.pending.has(5),true);T.acceptAck(n,99);assert.equal(n.pending.has(5),true);
  T.queueCommand(n,null);assert.equal(n.hostAck,3);
  const form=T.validatedPayload('formation',{points:[{id:1,x:30,y:20},{id:2,x:40,y:20},{id:1,x:90,y:90},{id:1,x:null,y:30}],assault:true});assert.equal(JSON.stringify(form.points),'[{"id":1,"x":30,"y":20}]');assert.equal(T.validatedPayload('formation',{points:[{id:2,x:30,y:20}]}),null);
  console.log('Network tests passed: collision equivalence, gzip round trip, state chunks, command ordering and ownership');
})().catch(e=>{console.error(e);process.exitCode=1});
