/* Keep voice playback independent of repeated orders and unit movement. */
(()=>{
'use strict';
const nowMs=()=>performance.now();
const isOrder=q=>!q.enemy&&q.key.endsWith('/order');
const isOwnHero=(source,key,enemy)=>!enemy&&(source?.team===0&&(source.i===9||source.arab||source.roommate)||(!source&&/\/(?:hero|arab)\//.test(key)));
function finish(q,now){
 if(speechCurrent!==q)return;
 q.attempt=(q.attempt||0)+1;q.playPending=false;
 if(!q.a.ended&&!q.a.paused)q.a.pause();
 if(isOrder(q))speechLast.set(q.key,now);
 speechCurrent=null;VCUR=null;speechGap=now+180;
}
function play(q,now){
 if(q.playPending)return;
 q.playPending=true;q.lastAttempt=now;
 const attempt=q.attempt=(q.attempt||0)+1;
 const settle=failed=>{if(speechCurrent!==q||q.attempt!==attempt)return;q.playPending=false;if(failed&&!q.suspended)q.failed=true};
 try{Promise.resolve(q.a.play()).then(()=>settle(false),()=>settle(true))}catch(_){settle(true)}
}
function suspend(q,now){
 if(q.suspended)return;
 q.suspended=true;q.attempt=(q.attempt||0)+1;q.playPending=false;
 q.a.pause();q.lastProgressAt=now;
}
function start(q,now){
 speechCurrent=q;VCUR=q.a;q.started=now;q.lastProgressAt=now;q.lastTime=Number(q.a.currentTime)||0;
 q.a.volume=speechVolume(q);
 q.a.addEventListener('ended',()=>finish(q,nowMs()),{once:true});
 q.a.addEventListener('error',()=>{if(speechCurrent===q){q.failed=true;finish(q,nowMs())}},{once:true});
 play(q,now);
}
speechPump=function(){
 const now=nowMs();
 if(!run||IN){if(speechCurrent||speechQueue.length)speechReset();return}
 if(paused){
  speechQueue.length=0;
  if(speechCurrent&&!speechCurrent.a.ended&&!speechCurrent.failed)suspend(speechCurrent,now);
  else if(speechCurrent)finish(speechCurrent,now);
  return;
 }
 if(speechCurrent){
  const q=speechCurrent;
  if(q.a.ended||q.failed){finish(q,now)}
  else {
   const current=Number(q.a.currentTime)||0;
   if(q.suspended){q.suspended=false;q.lastProgressAt=now;q.lastTime=current;play(q,now)}
   if(Math.abs(current-q.lastTime)>.005){q.lastTime=current;q.lastProgressAt=now}
   // No fixed clip-length cutoff: only recover from an actual playback stall.
   if(now-q.lastProgressAt>15000){finish(q,now)}
   else{
    q.a.volume=speechVolume(q);
    if(q.a.paused&&!q.playPending&&now-(q.lastAttempt||0)>500)play(q,now);
    return;
   }
  }
 }
 if(now<speechGap)return;
 while(speechQueue.length){
  speechQueue.sort((a,b)=>b.priority-a.priority||a.at-b.at);
  const q=speechQueue.shift();
  if(now-q.at>q.ttl||speechVolume(q)<.035)continue;
  start(q,now);return;
 }
};
queueSpeech=function(a,{source=null,priority=1,ui=false,enemy=false,key='',ttl=2400}={}){
 if(window.kubanOnlineAlpha?.remoteInput||!ST.voice||!ST.master||!run||paused||IN)return;
 const now=nowMs(),q={a,source,priority,ui:ui||isOwnHero(source,key,enemy),enemy,key,ttl,at:now};
 if(speechVolume(q)<.035)return;
 // Reissuing a movement command never cancels or restarts the current clip.
 // Coalesce rapid commands instead of accumulating stale speech.
 if(isOrder(q)){
  if(speechCurrent?.key===key)return;
  const pending=speechQueue.find(x=>x.key===key);
  if(pending){pending.at=now;return}
  if(now-(speechLast.get(key)??-1e9)<1100)return;
 }
 if(key&&now-(speechLast.get(key)??-1e9)<(enemy?2200:650))return;
 if(key&&(speechCurrent?.key===key||speechQueue.some(x=>x.key===key)))return;
 if(speechCurrent&&priority===0)return;
 if(speechQueue.length>=3){
  const worst=speechQueue.reduce((m,x,i)=>x.priority<speechQueue[m].priority?i:m,0);
  if(speechQueue[worst].priority>=priority)return;
  speechQueue.splice(worst,1);
 }
 if(key)speechLast.set(key,now);
 speechQueue.push(q);speechPump();
};
})();