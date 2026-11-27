'use strict';
// Experimental deterministic command timeline. Not connected to the production engine.
class Lockstep {
 constructor({slots,seed,step=1/30,delay=4,apply,tick,hash}) {
  if(!Array.isArray(slots)||!slots.length||new Set(slots).size!==slots.length||slots.some(s=>!Number.isSafeInteger(s)))throw Error('Invalid slots');
  this.slots=[...slots].sort((a,b)=>a-b);this.seed=seed>>>0;this.step=step;this.delay=delay;this.apply=apply;this.tick=tick;this.hash=hash;this.frame=0;this.batches=new Map();this.checks=new Map();this.localHashes=new Map();this.fault=null;this.sent=new Map();this.nextLocal=0;
 }
 random(){let x=this.seed=(this.seed+0x6D2B79F5)>>>0;x=Math.imul(x^(x>>>15),1|x);x^=x+Math.imul(x^(x>>>7),61|x);return ((x^(x>>>14))>>>0)/4294967296}
 submit(slot,frame,commands){
  if(!this.slots.includes(slot)||!Number.isSafeInteger(frame)||frame<this.frame||frame>this.frame+300||!Array.isArray(commands)||commands.length>64)return false;
  const encoded=JSON.stringify(commands);if(!encoded||encoded.length>65536)return false;
  let batch=this.batches.get(frame);if(!batch)this.batches.set(frame,batch=new Map());
  if(batch.has(slot)){if(batch.get(slot)!==encoded)this.fault='Conflicting command batch';return batch.get(slot)===encoded}
  batch.set(slot,encoded);return true
 }
 prepare(slot,commands=[],through=this.frame+this.delay){
  if(!this.slots.includes(slot)||!Number.isSafeInteger(through)||through<this.frame||through>this.frame+300||!Array.isArray(commands)||commands.length>64)return [];
  const start=Math.max(this.nextLocal,this.frame);if(start>through)return [];
  const out=[];for(let frame=start;frame<=through;frame++){const batch=frame===through?commands:[];if(!this.submit(slot,frame,batch))break;const packet={slot,frame,commands:JSON.parse(JSON.stringify(batch))};this.sent.set(frame,packet);out.push(packet);this.nextLocal=frame+1}return out;
 }
 resend(from,to=from+30){return [...this.sent.values()].filter(p=>p.frame>=from&&p.frame<=to).map(p=>JSON.parse(JSON.stringify(p)))}
 missing(){const batch=this.batches.get(this.frame);return this.slots.filter(s=>!batch?.has(s))}
 advance(limit=8){
  let count=0;while(!this.fault&&count<limit){const batch=this.batches.get(this.frame);if(!batch||!this.slots.every(s=>batch.has(s)))break;
   try{for(const slot of this.slots)for(const cmd of JSON.parse(batch.get(slot)))this.apply(slot,cmd,this);this.tick(this.step,this)}catch(e){this.fault=String(e);break}
   this.batches.delete(this.frame);this.frame++;count++;for(const f of this.sent.keys())if(f<this.frame-300)this.sent.delete(f);
   if(this.hash&&this.frame%30===0){const value=String(this.hash(this))+':'+this.seed;this.localHashes.set(this.frame,value);this.compare(this.frame);for(const f of this.localHashes.keys())if(f<this.frame-300)this.localHashes.delete(f);for(const f of this.checks.keys())if(f<this.frame-300)this.checks.delete(f)}
  }return count
 }
 compare(frame){const local=this.localHashes.get(frame),row=this.checks.get(frame);if(local&&row&&[...row.values()].some(v=>v!==local))this.fault='Desync at tick '+frame}
 receiveHash(slot,frame,value){if(!this.slots.includes(slot)||!Number.isSafeInteger(frame)||frame%30||frame<this.frame-300||frame>this.frame+300||typeof value!=='string'||value.length>128)return false;let row=this.checks.get(frame);if(!row)this.checks.set(frame,row=new Map());if(row.has(slot)&&row.get(slot)!==value){this.fault='Conflicting checksum';return false}row.set(slot,value);this.compare(frame);return true}
}
if(typeof module!=='undefined')module.exports=Lockstep;
