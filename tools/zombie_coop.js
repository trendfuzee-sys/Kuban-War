/* KW cooperative survival, host-authoritative. */
(function(){
const active=()=>!!window.kubanOnlineAlpha?.currentMatch&&mis?.ci<0&&mis?.zombies===true;
const settings=[{count:.7,hp:.75,damage:.65,gold:1000,rest:45},{count:1,hp:1,damage:1,gold:750,rest:35},{count:1.25,hp:1.15,damage:1.15,gold:600,rest:25}];
window.KWCoopAllied=(a,b)=>a===b||active()&&a<2&&b<2&&a>=0&&b>=0;
const onlineMatch=()=>!!window.kubanOnlineAlpha?.currentMatch&&mis?.ci<0;
const baseLoot=lootDrop;lootDrop=function(u){if(!onlineMatch())return baseLoot(u);if(Math.random()<(u.zombie?.10:u.i===9?.65:u.wk?.02:.12))dropIt(u.x,u.y,0)};
const baseDrop=dropIt;dropIt=function(...args){if(!onlineMatch())return baseDrop(...args);const before=IT.length;const result=baseDrop(...args);for(const item of IT.slice(before)){item.l=45;const prior=IT.slice(0,before).find(v=>!v.t&&!v.q&&!v.dropper&&v.k===item.k&&D(v,item)<100&&(v.stack||1)<8);if(prior){prior.stack=(prior.stack||1)+1;prior.l=Math.min(prior.l,45);item.t=1}}IT=IT.filter(v=>!v.t);return result};
const basePickup=pickup;pickup=function(h){if(!onlineMatch())return basePickup(h);const stacks=IT.filter(v=>v.stack>1&&D(v,h)<=42&&!v.t);for(const item of stacks){const free=h.inv.filter(v=>v===null).length+h.bp.filter(v=>v===null).length;if(!free)continue;const n=Math.min(free,item.stack-1);for(let i=0;i<n;i++){const a=h.inv.includes(null)?h.inv:h.bp;a[a.indexOf(null)]=item.k;item.stack--}gear(h);if(item.stack>1&&free===n)continue}return basePickup(h)};
const originalStart=start;
start=function(...args){
 const net=window.kubanOnlineAlpha,config=net?.currentMatch?.config;
 const result=originalStart(...args);
 if(!run||args[3]!==-1||config?.mode!=='zombies')return result;
 mis.zombies=true;mis.zDifficulty=([0,1,2].includes(Number(config.zDifficulty))?Number(config.zDifficulty):1);mis.zWave=0;mis.zRemaining=0;mis.zNext=t+120;mis.zSpawnAt=t;mis.zPhase='prepare';
 E=E.filter(e=>e.team<2||e.k==='m');
 const d=settings[mis.zDifficulty];gold[0]=gold[1]=d.gold;
 const halls=E.filter(e=>e.k==='b'&&e.ty==='h'&&e.team<2);for(const b of halls){const x=WW/2+(b.team===0?-180:180),y=WH/2,dx=x-b.x,dy=y-b.y;for(const e of E.filter(e=>e.team===b.team&&(e.k==='u'||e.k==='b'))){const p=campaignFree(e.x+dx,e.y+dy);e.x=p.x;e.y=p.y;if(e.tx!=null)e.tx=e.x;if(e.ty!=null&&e.k==='u')e.ty=e.y;e.tg=null;e.pt=null;} } const mines=E.filter(e=>e.k==='m');for(let i=0;i<Math.min(2,mines.length);i++){mines[i].x=WW/2+(i===0?-290:290);mines[i].y=WH/2+200;}const own=E.find(e=>e.team===0&&e.i===9);if(own){cam.x=own.x-W/Z/2;cam.y=own.y-H/Z/2;clampC();}
 // Both bases remain separately owned; neutral team 2 is the hostile horde.
 for(const b of E.filter(e=>e.k==='b'&&e.ty==='h')){const team=b.team,race=b.race;for(let i=0;i<4;i++){const a=i*Math.PI/2;const p=campaignFree(b.x+Math.cos(a)*110,b.y+Math.sin(a)*110);unit(team,race,i%2,p.x,p.y)}}
 fog();return result;
};
const originalCheck=chk;
chk=function(){
 if(!active())return originalCheck();
 if(window.kubanOnlineAlpha.role!=='host'||!run)return;
 if(!E.some(e=>!e.dead&&e.team<2&&e.k==='b'&&e.ty==='h'))return end(0);
 if(mis.zWave===20&&mis.zRemaining===0&&!E.some(e=>!e.dead&&e.zombie))return end(1);
};
const originalAI=ai;
ai=function(dt){
 if(!active())return originalAI(dt);
 if(window.kubanOnlineAlpha.role!=='host'||!run)return;
 const d=settings[mis.zDifficulty],live=E.filter(e=>!e.dead&&e.zombie),targets=E.filter(e=>!e.dead&&e.team<2&&(e.k==='b'||e.k==='u'));
 if(!targets.length)return;
 if(mis.zRemaining===0&&!live.length){
  if(mis.zPhase==='fight'){mis.zPhase='prepare';mis.zNext=t+d.rest;gold[0]+=100+mis.zWave*15;gold[1]+=100+mis.zWave*15;}
  if(t>=mis.zNext&&mis.zWave<20){mis.zWave++;mis.zRemaining=Math.round(Math.min(180,20+(mis.zWave-1)*160/19)*d.count);mis.zPhase='fight';mis.zSpawnAt=t;toast('Орда '+mis.zWave+' / 20');}
 }
 if(mis.zRemaining>0&&t>=mis.zSpawnAt&&live.length<120){
  mis.zSpawnAt=t+.65;
  for(let j=0;j<Math.min(5,mis.zRemaining,120-live.length);j++){
   const side=Math.floor(Math.random()*4),v=.12+Math.random()*.76;
   const p=campaignFree(side===0?45:side===1?WW-45:v*WW,side===2?45:side===3?WH-45:v*WH);
   const u=unit(2,'nov',0,p.x,p.y);hauntedStyle(u,0);u.zombie=true;u.nm='Зомби';u.mh=Math.round((65+mis.zWave*5)*d.hp);u.hp=u.mh;u.dmg=(8+mis.zWave*.55)*d.damage;u.sp=65+Math.min(18,mis.zWave);u.gd=18;u.sn='agg';mis.zRemaining--;
  }
 }
 if(t>=(mis.zRetarget||0)){mis.zRetarget=t+.8;for(const u of live){if(u.tg&&!u.tg.dead&&u.tg.team<2&&u.o==='a')continue;let target=null,best=Infinity;for(const e of targets){const v=D(u,e)+(e.k==='b'?0:40);if(v<best){best=v;target=e}}if(target){u.tg=target;u.o='a';u.auto=0}}}
};
window.KWTransferGold=function(amount,team=0){if(!active()||!run||!Number.isSafeInteger(amount)||amount<25||amount>10000||![0,1].includes(team)||gold[team]<amount)return false;gold[team]-=amount;gold[1-team]+=amount;return true};
const box=document.createElement('div');box.id='kw-zombie-hud';box.style.cssText='position:fixed;top:48px;left:50%;transform:translateX(-50%);z-index:12;pointer-events:auto;background:#171d19e8;color:#f5dc9a;border:1px solid #a48a55;padding:8px 16px;font:bold 14px Arial;text-align:center;border-radius:4px';box.hidden=true;document.body.append(box);const label=document.createElement('span');box.append(label);for(const amount of [100,250,500]){const b=document.createElement('button');b.className='b';b.textContent='Передать '+amount;b.onclick=()=>{const n=window.kubanOnlineAlpha;if(n?.role==='guest')n.transferGold?.(amount);else if(!window.KWTransferGold(amount))toast('Недостаточно золота');};box.append(b)}
setInterval(()=>{box.hidden=!run||!active()||!document.getElementById('menu').hidden;if(!box.hidden){const remaining=E.filter(e=>!e.dead&&e.zombie).length+(mis.zRemaining||0);label.textContent='Зомби · '+['Лёгкий','Нормальный','Сложный'][mis.zDifficulty]+' · Волна '+mis.zWave+'/20 · '+(mis.zPhase==='prepare'?'Подготовка: '+Math.max(0,Math.ceil(mis.zNext-t))+' с':'Осталось: '+remaining)}},250);
})();