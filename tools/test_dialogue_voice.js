/* Regression tests for portrait fallback and uninterrupted voice playback. */
'use strict';
async function test(dialogueCode,voiceCode){
 const check=(condition,message)=>{if(!condition)throw Error(message)};
 const flush=async()=>{for(let i=0;i<32;i++)await Promise.resolve()};
 const assets=new Set(),pendingImages=new Map();
 class MockImage{
  set src(path){
   this.path=path;
   if(pendingImages.has(path)){pendingImages.get(path).push(this);return}
   Promise.resolve().then(()=>{if(assets.has(path)){this.naturalWidth=576;this.naturalHeight=384;this.onload?.()}else this.onerror?.()});
  }
 }
 function element(tag){
  const flags=new Set(),e={tag,hidden:false,children:[],dataset:{},style:{setProperty(){}},classList:{add(x){flags.add(x)},toggle(x,on){if(on)flags.add(x);else flags.delete(x)},contains(x){return flags.has(x)}},append(...children){this.children.push(...children)},setAttribute(k,v){this[k]=v},getAttribute(k){return this[k]??null},removeAttribute(k){delete this[k]},offsetHeight:220};
  if(tag==='canvas'){e.getContext=()=>({drawImage(){}});e.toDataURL=()=> 'data:image/png;base64,atlas';}
  return e;
 }
 const dialog=element('dialog'),article=element('article');dialog.querySelector=()=>article;
 const doc={head:element('head'),body:element('body'),createElement:element};
 const win={};
 const portraitRuntime=new Function('document','dialog','window','Image','setInterval','setTimeout','clearTimeout','ResizeObserver',
 'let talk=null,scenario={id:0},CAM=[{p:"kaz"}],paintTalk=function(){},showTalk=function(lines){talk={lines,n:0};paintTalk()};\n'+dialogueCode+
 '\nreturn {show(lines){showTalk(lines)},advance(n){talk.n=n;paintTalk()},api:window.KWDialogueEmotion};');
 const portraits=portraitRuntime(doc,dialog,win,MockImage,()=>0,()=>0,()=>{},undefined);
 const p=portraits.api;
 const roster={'Казак Данил':'danil','Полуживой Вячислав Кровчински':'krovchinski','Субидей Исатаев':'subidey','Богдан Рыжий':'bogdan','Адмирал Эстон':'eston','Заключенный':'prisoner','Заключённый':'prisoner','Хуторской староста':'elder','Вольный дозорный':'sentry','Дворовый атаман':'concepts/ataman','Араб':'arab','Сожитель':'roommate'};
 for(const [name,key] of Object.entries(roster))check(p.key(name)===key,'Alias missing: '+name);
 check(p.sameSpeaker('Данил','Казак Данил'),'Main hero alias should keep identity');
 check(!p.sameSpeaker('Дозорный','Вольный дозорный'),'Different NPCs sharing a portrait role must keep separate identity');
 check(p.portraitCandidates('Эстон',null).some(x=>x.path.endsWith('boss_admiral.webp')),'Admiral atlas fallback missing');
 check(p.portraitCandidates('Неизвестный персонаж',null).some(x=>x.path.endsWith('special_civilian.webp')),'Unknown speaker fallback missing');
 win.KWDialoguePortraits={danil:{portraits:{angry:'missing-angry.webp',neutral:'neutral-danil.webp'}}};
 assets.add('neutral-danil.webp');
 check(await p.resolvePortrait(p.portraitCandidates('Данил',['Данил','Стой','Злость']))==='neutral-danil.webp','Missing emotion must fall back to neutral art');
 win.KWDialoguePortraits={arab:{portraits:{neutral:'missing-arab.webp'}}};
 assets.add('unit-art/sprites/special_arab.webp');
 check((await p.resolvePortrait(p.portraitCandidates('Араб',null))).startsWith('data:image/png'),'Atlas fallback must be cropped');
 check((await p.resolvePortrait(p.portraitCandidates('Неизвестный персонаж',null))).startsWith('data:image/svg+xml'),'Final fallback must not be blank');
 win.KWDialoguePortraits={danil:{portraits:{neutral:'neutral-danil.webp'}},farmer:{portraits:{neutral:'slow-farmer.webp'}},elder:{portraits:{neutral:'elder.webp'}}};
 pendingImages.set('slow-farmer.webp',[]);assets.add('elder.webp');
 portraits.show([['Хлебороб','Привет','Спокойно'],['Старик','Здравствуй','Спокойно'],['Данил','Добрый день','Спокойно']]);
 await flush();
 const slots=dialog.children[0].children,right=slots[1];
 portraits.advance(1);await flush();
 check(right.children[0].src==='elder.webp','New speaker portrait did not load');
 for(const img of pendingImages.get('slow-farmer.webp')){img.naturalWidth=576;img.naturalHeight=384;img.onload?.()}
 await flush();
 check(right.children[0].src==='elder.webp','Stale async portrait overwrote current speaker');
 portraits.advance(2);await flush();
 check(slots.filter(s=>s.classList.contains('active')).length===1,'Exactly one speaker must be highlighted');
 console.log('Portrait aliases, fallback chain and async speaker changes passed');

 const clock={now:0},winAudio={};
 const voiceRuntime=new Function('performance','window',
 'let run=true,paused=false,IN=null,VCUR=null,speechCurrent=null,speechGap=0,speechPump,queueSpeech;const speechQueue=[],speechLast=new Map(),ST={voice:100,master:100};let gain=.8;function speechVolume(q){return q.ui?1:gain}function speechReset(){speechQueue.length=0;speechLast.clear();if(speechCurrent)speechCurrent.a.pause();speechCurrent=null;VCUR=null;speechGap=0}\n'+voiceCode+
 '\nreturn {queue:(...x)=>queueSpeech(...x),pump:()=>speechPump(),current:()=>speechCurrent,queued:()=>speechQueue.length,pause(v){paused=v},setGain(v){gain=v},stop(){run=false;speechPump()}};');
 const voice=voiceRuntime({now:()=>clock.now},winAudio);
 class FakeAudio{
  constructor(){this.currentTime=0;this.paused=true;this.ended=false;this.volume=0;this.playCount=0;this.pauseCount=0;this.listeners={}}
  play(){this.paused=false;this.playCount++;return Promise.resolve()}
  pause(){this.paused=true;this.pauseCount++}
  addEventListener(name,fn){this.listeners[name]=fn}
  end(){this.ended=true;this.paused=true;this.listeners.ended?.()}
 }
 const hero={team:0,i:9},order={source:hero,key:'kaz/hero/order',priority:1,ttl:1400},ability={source:hero,key:'kaz/hero/ability1',priority:4,ttl:4500};
 const first=new FakeAudio();
 voice.queue(first,order);await flush();
 check(voice.current()?.a===first&&first.playCount===1,'Order should begin playback');
 for(let i=1;i<=30;i++){clock.now=i*1000;first.currentTime=i;voice.queue(new FakeAudio(),order);voice.pump();await flush()}
 check(voice.current()?.a===first&&first.playCount===1&&first.pauseCount===0&&voice.queued()===0,'Repeated orders or fixed length cutoff interrupted active clip');
 voice.setGain(0);voice.pump();check(first.volume===1,'Own hero voice should not fade as camera moves');
 const second=new FakeAudio();
 voice.queue(second,ability);check(voice.current()?.a===first&&voice.queued()===1,'High-priority speech should queue, not interrupt');
 first.end();clock.now+=200;voice.pump();await flush();
 check(voice.current()?.a===second&&second.playCount===1,'Queued ability should start after previous clip finishes');
 second.currentTime=2;voice.pump();voice.pause(true);voice.pump();
 check(second.paused&&second.currentTime===2,'Pause must preserve clip position');
 clock.now+=30000;voice.pause(false);voice.pump();await flush();
 check(voice.current()?.a===second&&second.playCount===2&&second.currentTime===2,'Resume must continue the same clip, not restart it');
 winAudio.kubanOnlineAlpha={remoteInput:true};voice.queue(new FakeAudio(),order);check(voice.queued()===0,'Remote input must not play local speech');
 voice.stop();check(second.paused&&!voice.current(),'Mission exit must stop playback');
 console.log('Repeated movement orders, long clips, camera gain, pause/resume and network suppression passed');
}
if(typeof module!=='undefined'){
 module.exports=test;
 if(require.main===module){
  const fs=require('node:fs'),path=require('node:path');
  test(fs.readFileSync(path.join(__dirname,'dialogue_scene.js'),'utf8'),fs.readFileSync(path.join(__dirname,'voice_continuity.js'),'utf8')).catch(e=>{console.error(e);process.exitCode=1});
 }
}
