'use strict';
// Experimental deterministic command timeline. Not connected to the production engine.
class Lockstep {
 constructor({slots,seed,step=1/30,delay=4,apply,tick,hash}) {
  if(!Array.isArray(slots)||!slots.length||new Set(slots).size!==slots.length||slots.some(s=>!Number.isSafeInteger(s)))throw Error('Invalid slots');
  this.slots=[...slots].sort((a,b)=>a-b);this.seed=seed>>>0;this.step=step;this.delay=delay;this.apply=apply;this.tick=tick;this.hash=hash;this.frame=0;this.batches=new Map();this.checks=new Map();this.localHashes=new Map();this.fault=null;
 }
 random(){let x=this.seed=(this.seed+0x6D2B79F5)>>>0;x=Math.imul(x^(x>>>15),1|x);x^=x+Math.imul(x^(x>>>7),61|x);return ((x^(x>>>14))>>>0)/4294967296}
 submit(slot,frame,commands){
  if(!this.slots.includes(slot)||!Number.isSafeInteger(frame)||frame<this.frame||frame>this.frame+300||!Array.isArray(commands)||commands.length>64)return false;
  const encoded=JSON.stringify(commands);if(!encoded||encoded.length>65536)return false;
  let batch=this.batches.get(frame);if(!batch)this.batches.set(frame,batch=new Map());
  if(batch.has(slot)){if(batch.get(slot)!==encoded)this.fault='Conflicting command batch';return batch.get(slot)===encoded}
  batch.set(slot,encoded);return true
 }
 advance(limit=8){
  let count=0;while(!this.fault&&count<limit){const batch=this.batches.get(this.frame);if(!batch||!this.slots.every(s=>batch.has(s)))break;
   try{for(const slot of this.slots)for(const cmd of JSON.parse(batch.get(slot)))this.apply(slot,cmd,this);this.tick(this.step,this)}catch(e){this.fault=String(e);break}
   this.batches.delete(this.frame);this.frame++;count++;
   if(this.hash&&this.frame%30===0){const value=String(this.hash(this))+':'+this.seed;this.localHashes.set(this.frame,value);this.compare(this.frame);for(const f of this.localHashes.keys())if(f<this.frame-300)this.localHashes.delete(f);for(const f of this.checks.keys())if(f<this.frame-300)this.checks.delete(f)}
  }return count
 }
 compare(frame){const local=this.localHashes.get(frame),row=this.checks.get(frame);if(local&&row&&[...row.values()].some(v=>v!==local))this.fault='Desync at tick '+frame}
 receiveHash(slot,frame,value){if(!this.slots.includes(slot)||!Number.isSafeInteger(frame)||frame%30||frame<this.frame-300||frame>this.frame+300||typeof value!=='string'||value.length>128)return false;let row=this.checks.get(frame);if(!row)this.checks.set(frame,row=new Map());if(row.has(slot)&&row.get(slot)!==value){this.fault='Conflicting checksum';return false}row.set(slot,value);this.compare(frame);return true}
}
if(typeof module!=='undefined')module.exports=Lockstep;
