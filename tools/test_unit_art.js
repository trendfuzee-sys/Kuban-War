'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {pathToFileURL,fileURLToPath}=require('node:url');
const root=path.resolve(process.argv[2]||path.join(__dirname,'unit-art')),meta=JSON.parse(fs.readFileSync(path.join(root,'sprites.json'),'utf8'));
let now=1000,old=0,starts=0,draws=[];
class FakeImage {
 set src(url){queueMicrotask(()=>{try{const b=fs.readFileSync(fileURLToPath(url));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');assert.equal(b.toString('ascii',12,16),'VP8X');this.naturalWidth=1+b.readUIntLE(24,3);this.naturalHeight=1+b.readUIntLE(27,3);this.onload?.()}catch(e){this.onerror?.(e)}})}
}
const c={globalAlpha:1,save(){},restore(){this.globalAlpha=1},translate(){},rotate(){},scale(){},beginPath(){},ellipse(){},stroke(){},drawImage(...a){draws.push(a)}};
const ctx=vm.createContext({window:{},document:{baseURI:pathToFileURL(path.join(path.dirname(root),'voyna_za_kuban.html')).href},Image:FakeImage,URL,performance:{now:()=>now},ST:{q:2},t:2,naval:{phase:2},RC:{kaz:{H:{nm:'Казак Данил'}},nov:{H:{nm:'Полуживой Вячислав Кровчински'}},mon:{H:{nm:'Субидей Исатаев'}},bog:{H:{nm:'Богдан Рыжий'}}},g:c,drawU(){old++},drawA(){old++},drawFX(){old++},paintShip(){old++},start(){starts++}});
vm.runInContext(fs.readFileSync(path.join(root,'units.js'),'utf8'),ctx);const art=ctx.window.KWUnitArt;assert.ok(art);assert.equal(art.stats().sprites,Object.keys(meta).length);
const cases=[[{race:'kaz',i:-1},'kaz/worker'],[{race:'kaz',i:0},'kaz/unit_1'],[{race:'mon',i:9},'mon/hero'],[{race:'bog',spec:{nm:'Богдан Рыжий'}},'bog/hero'],[{race:'nov',i:8},'nov/spy'],[{race:'kaz',militia:true,wk:false,i:-1},'kaz/militia'],[{race:'bog',legendary:true},'bog/legend'],[{race:'mon',siegeWeapon:true},'mon/siege'],[{race:'nov',relic:true,nm:'Хмельной громила'},'boss/relic_2'],[{boardingHuman:true,race:'nov',i:0},'boss/admiral'],[{undeadBoarder:true},'special/undead_pirate'],[{hauntedRole:1},'special/haunted_1'],[{hauntedRole:3},'special/haunted_3'],[{seaUndead:true,rng:115},'special/risen_archer'],[{arab:true},'special/arab'],[{roommate:true},'special/roommate'],[{civilian:true},'special/civilian'],[{localGuard:{}},'special/militia'],[{trialGuard:true},'special/passage_guard'],[{race:'cr',ci:2},'animal/bear'],[{spec:{a:'fox'}},'animal/fox'],[{ship:'boss'},'vehicle/flagship'],[{kind:'cache'},'vehicle/wagon']];
for(const [e,k] of cases)assert.equal(art.keyFor(e),k,JSON.stringify(e));
assert.equal(art.keyFor({race:'other',nm:'unknown'}),null);assert.equal(art.frameFor({}, {sw:0}),12);assert.equal(art.frameFor({}, {sw:1}),19);assert.equal(art.frameFor({}, {death:1}),23);assert.equal(art.frameFor({}, {death:0}),20);assert.ok(art.frameFor({}, {mv:true,ph:3})>=4&&art.frameFor({}, {mv:true,ph:3})<12);
const hero={race:'kaz',i:9,k:'u',id:10,x:50,y:60,r:15,fx:1};const before=JSON.stringify(hero);
ctx.drawU(c,hero,50,60,1,{mv:false});assert.equal(old,1,'fallback before loading');
ctx.start('kaz','nov',1,-1,{});assert.equal(starts,1);
for(const k of Object.keys(meta))art.preload(k);
setImmediate(()=>{
 assert.equal(art.stats().errors,0);assert.equal(art.stats().queued,0);assert.equal(art.stats().inflight,0);assert.equal(art.stats().loaded,Object.keys(meta).length);
 ctx.drawU(c,hero,50,60,1,{mv:true,ph:2});assert.equal(draws.length,1);assert.equal(draws[0].length,9);assert.equal(JSON.stringify(hero),before,'renderer must not mutate entity');
 ctx.drawA(c,{race:'cr',ci:2},50,60,1,{sw:0.6});assert.equal(draws.length,2);
 ctx.drawFX({ty:'c',e:hero,a:1.3,l:.2});assert.equal(draws.length,3);assert.equal(draws[2][1],5*meta['kaz/hero'].size);assert.equal(draws[2][2],3*meta['kaz/hero'].size);
 ctx.paintShip(c,50,60,1,true,true);assert.equal(draws.length,4);assert.equal(art.paintCache(c,{kind:'cache',sold:{cache:false}}),true);assert.equal(draws.length,5);
 ctx.window.kubanOnlineAlpha={role:'guest',currentMatch:{}};const guest={...hero};art.frameFor(guest,{mv:false,ph:0,sw:-1});now+=40;guest.x+=7;const frame=art.frameFor(guest,{mv:false,ph:0,sw:-1});assert.ok(frame>=4&&frame<12,'guest visual locomotion from interpolated coordinates');
 now+=12000;ctx.drawU(c,hero,50,60,1,{mv:false});assert.ok(art.stats().estimatedDecodedBytes<=56*1024*1024);assert.equal(JSON.stringify(hero),before);
 console.log('unit-art tests OK:',Object.keys(meta).length,'atlases;',Object.keys(meta).length*24,'frames');
});
