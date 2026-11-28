(()=>{'use strict';
const offline=()=>!window.kubanOnlineAlpha?.currentMatch;
const validCode=v=>String(v||'').trim().normalize('NFKC').toLowerCase()==='fuzz';
try{dinoEnabled=localStorage.getItem('kw.unlock.campaign')==='1'}catch(_){}
const codeMenu=$('menu');
codeMenu.addEventListener('submit',e=>{if(e.target.id!=='dinoForm')return;e.preventDefault();e.stopImmediatePropagation();const input=$('dinoCode');if(!validCode(input?.value)){const l=$('dinoStatus');if(l)l.textContent='Неизвестный код';return}dinoEnabled=!dinoEnabled;try{localStorage.setItem('kw.unlock.campaign',dinoEnabled?'1':'0')}catch(_){}atlasSelected=null;atlasFaction=0;menu('c');toast(dinoEnabled?'Все главы открыты':'Обычный режим восстановлен')},true);
let fuzzBuffer='',fuzzAt=0;
window.addEventListener('keydown',e=>{if(run||$('menu').hidden||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.target?.closest?.('input,textarea,select,[contenteditable=true]')){fuzzBuffer='';return}const k=/^Key[A-Z]$/.test(e.code)?e.code.slice(3).toLowerCase():e.key?.toLowerCase();if(!/^[a-z]$/.test(k||'')){fuzzBuffer='';return}const now=performance.now();if(now-fuzzAt>2500)fuzzBuffer='';fuzzAt=now;fuzzBuffer=(fuzzBuffer+k).slice(-4);if(fuzzBuffer!=='fuzz')return;fuzzBuffer='';e.preventDefault();e.stopImmediatePropagation();dinoEnabled=!dinoEnabled;try{localStorage.setItem('kw.unlock.campaign',dinoEnabled?'1':'0')}catch(_){}atlasSelected=null;atlasFaction=0;menu('c');toast(dinoEnabled?'Все кампании открыты':'Обычный режим восстановлен')},true);
const allowed=chapterAllowed;chapterAllowed=i=>dinoEnabled&&Number.isInteger(i)&&!!CAM[i]||allowed(i);
const ad=admiralUnlocked;admiralUnlocked=()=>dinoEnabled||ad();
const css=document.createElement('style');css.textContent=`
#storyDialog{place-items:end center!important;background:linear-gradient(transparent 35%,#0007)!important;padding:0!important}
#storyDialog article{position:relative;width:min(1100px,100vw)!important;max-height:49vh!important;overflow:auto!important;padding:14px 26px!important;background:linear-gradient(120deg,#101617f5,#20201cf5)!important;border:1px solid #b39a69!important;border-top:3px solid #c9ab72!important}
#storyDialog p{min-height:2.5em!important;margin:8px 0!important;font-size:clamp(16px,1.6vw,22px)!important}
#storyDialog h3{color:#f4d276!important}
#storyDialog header img{display:none!important}
#storyDialog .kw-speaker{position:absolute;right:max(4vw,calc((100vw - 1060px)/2));bottom:calc(var(--kw-dialog-height, 220px) - 2px);height:clamp(100px,36vh,340px);width:clamp(100px,28vw,310px);object-fit:contain;object-position:bottom;border:0!important;filter:drop-shadow(0 5px 12px #0009);pointer-events:none}
#storyDialog .kw-speaker[hidden]{display:none!important}
#storyDialog .kw-speaker{height:clamp(100px,36vh,340px)!important;width:clamp(100px,28vw,310px)!important}
#kw-interior{position:fixed;inset:0;z-index:110;background:#0009;display:grid;place-items:center}
#kw-interior[hidden]{display:none!important}
#kw-interior section{width:min(540px,90vw);padding:24px;background:linear-gradient(135deg,#25312d,#151a1d);color:#f6ead3;border:2px solid #ad9363;box-shadow:0 12px 50px #000;max-height:85vh;overflow:auto}
#kw-interior h2{color:#f2d18a;margin:0 0 12px}
#kw-interior .kw-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}
#kw-interior button{min-height:46px;background:#303e38;color:#f5e9d1;border:1px solid #9c895f;padding:8px;cursor:pointer}
#kw-interior button:disabled{opacity:.55}
#kw-interior .kw-success{color:#b4edaf}
`;document.head.append(css);
const portraitCache=new Map();const speaker=document.createElement('img');speaker.className='kw-speaker';speaker.hidden=true;dialog.append(speaker);if(typeof ResizeObserver==='function')new ResizeObserver(()=>dialog.style.setProperty('--kw-dialog-height',dialog.querySelector('article').offsetHeight+'px')).observe(dialog.querySelector('article'));
const oldPaint=paintTalk;paintTalk=function(){oldPaint();const who=String(talk?.lines[talk.n]?.[0]||'');const race=/данил|казак|хлебороб/i.test(who)?'kaz':/кровчин|беглец/i.test(who)?'nov':/суб[ие]д|всадник/i.test(who)?'mon':/богдан|студент|араб/i.test(who)?'bog':(CAM[scenario?.id]?.p||'kaz');const key=/эстон|адмирал/i.test(who)?'boss_admiral':/араб/i.test(who)?'special_arab':/данил|кровчин|суб[ие]д|богдан/i.test(who)?race+'_hero':/дозор|развед|всадник|казак/i.test(who)?race+'_unit_1':race+'_worker';
speaker.hidden=!key;if(key){const path='unit-art/sprites/'+key+'.webp';const token=++paintTalk.token;if(portraitCache.has(key)){speaker.src=portraitCache.get(key);speaker.hidden=false;return}const img=new Image();img.onload=()=>{if(token!==paintTalk.token||!talk)return;const c=document.createElement('canvas'),n=img.naturalWidth/6;c.width=n;c.height=img.naturalHeight/4;c.getContext('2d').drawImage(img,0,0,n,c.height,0,0,n,c.height);speaker.src=c.toDataURL();portraitCache.set(key,speaker.src);speaker.hidden=false};img.onerror=()=>{if(token!==paintTalk.token)return;if(race){speaker.src='img/'+race+'/hero.png.png';speaker.hidden=false}else speaker.hidden=true};speaker.hidden=true;img.src=path}else ++paintTalk.token};paintTalk.token=0;
const panel=document.createElement('div');panel.id='kw-interior';panel.hidden=true;document.body.append(panel);
let active=null,blockUntil=0;
function closeInterior(){if(!active)return;const a=active;active=null;panel.hidden=true;panel.replaceChildren();if(run)paused=a.prev;blockUntil=performance.now()+1400}
function challenge(kind,id){if(kind==='repair'||kind==='worker')return {title:'Ремонт оборудования',hint:'Восстановите цепь: питание → соединение → запуск.',items:['Запуск','Питание','Соединение'],order:[1,2,0]};if(kind==='inspect'||kind==='scout')return {title:'Поиск улик',hint:'Осмотрите три предмета со следами — колею, ткань и печать.',items:['Камень','Колея','Пустая банка','Ткань','Печать','Доска'],order:[1,3,4],unordered:true};if(kind==='recover')return {title:'Обыск помещения',hint:'По записке тайник находится за ящиком с синей меткой.',items:['Красный ящик','Синий ящик','Пустая полка'],order:[1]};if(kind==='pay'||kind==='talk')return {title:'Переговоры',hint:'Чтобы договориться, сначала выслушайте собеседника, затем предложите помощь.',items:['Угрожать','Выслушать','Предложить помощь'],order:[1,2]};return {title:'Организация эвакуации',hint:'Проверьте выход, соберите людей, подайте сигнал.',items:['Сигнал','Проверить выход','Собрать людей'],order:[1,2,0]}}
function openInterior(q){if(active||!offline()||!run||talk)return;if(q.kind==='pay'||q.kind==='talk'){const who=castSpeaker(scenario.id),person=q.who;showTalk([[who,'Здравствуйте. Что здесь случилось?','Спокойно'],[person,mis.ci===1?'Людей собрали, но оружия и припасов не хватает. На снаряжение нужно 60 золота.':q.line,'С тревогой'],[who,q.cost?'Хорошо. Помогу со снаряжением, если хватит денег.':'Расскажи подробнее. Я выслушаю.','Сдержанно']],()=>{q.kwSolved=true});return}const puzzle=challenge(q.kind,mis.ci);const a=active={q,puzzle,prev:paused,progress:0,used:new Set()};paused=1;panel.hidden=false;panel.replaceChildren();const section=document.createElement('section'),title=document.createElement('h2'),name=document.createElement('p'),hint=document.createElement('p'),grid=document.createElement('div'),status=document.createElement('p'),leave=document.createElement('button');title.textContent=puzzle.title;name.textContent=q.name;hint.textContent=puzzle.hint;grid.className='kw-grid';status.textContent='Действий выполнено: 0/'+puzzle.order.length;leave.textContent='Вернуться на карту';leave.onclick=closeInterior;
puzzle.items.forEach((v,i)=>{const b=document.createElement('button');b.textContent=v;b.onclick=()=>{if(active!==a)return;const correct=puzzle.unordered?puzzle.order.includes(i)&&!a.used.has(i):puzzle.order[a.progress]===i;if(!correct){status.textContent='Не подходит. Проверьте подсказку и попробуйте снова.';return}a.used.add(i);b.disabled=true;a.progress++;status.textContent='Действий выполнено: '+a.progress+'/'+puzzle.order.length;if(a.progress===puzzle.order.length){q.kwSolved=true;closeInterior();toast('Испытание пройдено: '+q.name)}};grid.append(b)});section.append(title,name,hint,grid,status,leave);panel.append(section)}
const qp=questPulse;questPulse=function(){if(!offline())return qp();if(!questActive()||talk||paused||active)return;const q=questState.tasks.find(v=>!v.done);if(!q)return;const safe=!E.some(u=>!u.dead&&u.team===1&&u.k==='u'&&!u.wk&&D(u,q)<115);const price=questState.waiting?Math.min(q.cost,Math.max(0,gold[0])):q.cost;if(!questActors(q)||!safe||gold[0]<price)return;if(!q.kwSolved){if(performance.now()>=blockUntil)openInterior(q);return}q.hold=100;qp();if(q.done){gold[0]+=65;ft(q,'+65 золота','#f1d38a')}};
const prevStatus=statusText;statusText=function(){const line=prevStatus();if(offline()&&questActive()){const q=questState.tasks.find(v=>!v.done);if(q&&!q.kwSolved)return line.replace(/\s\d+\/\d+ с$/,'')+' · Войдите в отмеченное здание'}return line};
const prevStart=start;start=function(...args){closeInterior();const r=prevStart(...args);if(!offline()||!run||mis?.ci!==args[3])return r;gold[0]+=mis.ci>=0?180:100;mis.inc=mis.ci>=0?([.7,1,1.15][mis.d]??1):([.85,.95,1.05][mis.d]??.95);if(scenario?.mode==='capture')scenario.holdRequired=10;return r};
const oldMenu=menu;menu=function(...args){closeInterior();return oldMenu(...args)};
const oldHit=hit;hit=function(v,dm,s){const alive=v&&!v.dead;if(offline()&&s?.team===1&&v?.team===0&&mis?.ci!==4&&!s.relic)dm*=mis?.ci>=0?([.6,1,1.15][mis.d]??1):([.76,.86,.96][mis?.d]??.86);const r=oldHit(v,dm,s);if(offline()&&alive&&v.dead&&s?.team===0&&v.team===1&&!v.civilian&&mis?.ci!==4){const b=v.k==='b'?(v.ty==='h'?85:25):v.wk?2:8;gold[0]+=b;ft(v,'+'+b+' золота','#edcd83')}return r};
const oldDraw=draw;draw=function(...args){const r=oldDraw(...args);if(!run||!offline()||!questActive())return r;const q=questState.tasks.find(v=>!v.done);if(!q||ST.fog&&!ex[ci(q.x,q.y)])return r;g.save();try{g.setTransform(S*Z,0,0,S*Z,-cam.x*S*Z,-cam.y*S*Z);g.translate(q.x,q.y);g.fillStyle='#151a18b0';g.fillRect(-28,-10,56,30);g.fillStyle='#79654b';g.fillRect(-24,-34,48,35);g.fillStyle='#43382d';g.beginPath();g.moveTo(-29,-32);g.lineTo(0,-54);g.lineTo(29,-32);g.closePath();g.fill();g.fillStyle='#f6d28a';g.fillRect(-15,-25,9,10);g.fillRect(6,-25,9,10);g.fillStyle='#32271d';g.fillRect(-5,-17,10,18);g.strokeStyle='#e7d19b';g.lineWidth=1;g.strokeRect(-5,-17,10,18)}finally{g.restore()}return r};
window.addEventListener('keydown',e=>{if(e.key!=='Escape'||e.repeat||!run||IN||bindWaiting)return;if(active){e.preventDefault();e.stopImmediatePropagation();closeInterior();return}if(talk)return;if(tradeSite||place||amode)return;if($('menu').hidden){e.preventDefault();e.stopImmediatePropagation();pauseMenu()}},true);
const baseTerrain=buildTerrain;buildTerrain=function(){const r=baseTerrain();if(!TR||mis?.ci===4||!layout||!ST.q)return r;const c=TR.getContext('2d'),rng=seeded(mapSeed^99113),urban=['city','factory','prison','rail','cellar','ruin','dump'].includes(terrainBiome());c.save();try{for(let i=0;i<Math.min(1800,WW*WH/4000);i++){const x=rng()*WW,y=rng()*WH;if(!campaignWalkable(x,y)||layout.routes?.some(route=>route.some(p=>D(p,{x,y})<40)))continue;c.strokeStyle=urban?'#292a252b':'#233c2840';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+2+rng()*4,y-2-rng()*5);c.stroke();if(i%3===0){c.fillStyle=urban?'#c2b9a237':'#d5cc8940';c.fillRect(x+3,y-3,2,2)}}}finally{c.restore()}return r};

const armyTargets={1:10,5:15,7:25,9:10,14:25,16:15,21:35,23:15,27:25,28:35};
const soldier=u=>!u.dead&&u.team===0&&u.k==='u'&&!u.wk&&!u.civilian&&!u.spy&&!u.ship&&u.i!==9&&u.dmg>0;
const armyCount=()=>E.filter(soldier).length;
const targetFor=id=>armyTargets[id]||0;
diversityPlans[1]=['recruit',10,'Подготовить 10 новых бойцов',160];
diversityPlans[21]=['recruit',35,'Собрать армию из 35 бойцов',250];
const armyPulse=diversityPulse;diversityPulse=function(){if(diversityActive()&&diversity.p[0]==='recruit'){const d=diversity;if(!paused&&!talk&&!d.done&&!d.failed){d.progress=Math.min(d.p[1],armyCount());if(d.progress>=d.p[1]){d.done=true;gold[0]+=d.p[3];toast('Армия собрана: '+d.p[1]+' бойцов')}}return}return armyPulse()};
const actorsOld=questActors;questActors=function(q){if(q.kind!=='rally')return actorsOld(q);const n=mis.ci===21?35:25;return E.some(u=>!u.dead&&u.team===0&&u.i===9&&D(u,q)<160)&&E.filter(u=>soldier(u)&&D(u,q)<220).length>=n};
const armyEnd=end;let armyNotice=-Infinity;end=function(win){const n=run&&offline()&&scenario?targetFor(scenario.id):0;if(win&&n&&armyCount()<n){if(t-armyNotice>8||t<armyNotice){armyNotice=t;toast('Соберите армию: '+armyCount()+'/'+n+' бойцов')}return}return armyEnd(win)};
const armyStatus=statusText;statusText=function(){let line=armyStatus();if(!run||!scenario||!offline())return line;const n=targetFor(scenario.id);line=line.replace('герой и до 3 бойцов','герой и '+(scenario.id===21?35:25)+' бойцов в зоне сбора');return line+(n?' · Армия: '+armyCount()+'/'+n+' бойцов (рабочие не учитываются)':'')};
const armyStart=start;start=function(...args){const result=armyStart(...args);armyNotice=-Infinity;if(run&&scenario&&offline()&&targetFor(scenario.id)){gold[0]+=targetFor(scenario.id)*20;missionRadio(castSpeaker(scenario.id),'Нам нужно собрать '+targetFor(scenario.id)+' бойцов. Стройте дома и казармы, пополняйте отряд.')}return result};
const oldSiteRender=renderSite;renderSite=function(){oldSiteRender();const s=tradeSite;if(s?.kind!=='encounter')return;const el=$('trade').querySelector('article');if(!el)return;const hint=document.createElement('p');hint.textContent=s.resolved?'Вы уже приняли решение.':'Сначала расспросите собеседника бесплатно. Сделка стоит 25 золота и требует свободного места в инвентаре. Нападение исключает мирное решение.';el.querySelector('h2')?.after(hint);if(!s.resolved){const b=document.createElement('button');b.className='b';b.dataset.offer='kwAsk';b.textContent='Поговорить с предводителем';el.querySelector('footer')?.before(b)}};
const oldSiteAction=siteAction;siteAction=function(k){const s=tradeSite,h=tradeHero;if(s?.kind!=='encounter'||!h||h.dead||D(h,s)>90||s.resolved)return oldSiteAction(k);const who=castSpeaker(scenario.id);if(k==='kwAsk'){closeSite();return showTalk([[who,'Здорово. Кто вы и что здесь делаете?','Спокойно'],[s.person,s.speech,'Настороженно'],[who,'А что знаешь о дороге впереди?','Сдержанно'],[s.person,s.hint,'Спокойно']],()=>{if(run&&!h.dead&&D(h,s)<=80)openSite(s,h)})}if(k==='encFight'){const button=$('trade').querySelector('[data-offer="encFight"]');if(button&&button.dataset.confirm!=='yes'){button.dataset.confirm='yes';button.textContent='Подтвердить нападение';return}}return oldSiteAction(k)};


/* Main menu visual pass, without replacing existing navigation handlers. */
const menuSkin=document.createElement('style');menuSkin.textContent=
'body:has(#menu.kw-home:not([hidden])) #menu{background:radial-gradient(ellipse at 75% 15%,#80734a48,transparent 58%),linear-gradient(125deg,#101715f5,#202822fa 48%,#100e0df5)!important}'+
'#menu.kw-home #mw{width:min(1120px,94vw);padding:clamp(16px,3vw,42px);border:1px solid #aa925b;border-radius:12px;background:linear-gradient(140deg,#343b30e8,#141b17f5 42%,#25231df5);box-shadow:0 20px 70px #000b,inset 0 0 0 3px #151b17,inset 0 1px #e4d3a355}'+
'#menu.kw-home h1.T{font-family:Georgia,serif;letter-spacing:.085em;text-shadow:0 3px #382717,0 6px 16px #000;color:#f2d394}'+
'#menu.kw-home h1.T small{letter-spacing:.23em;color:#e3c18a}'+
'#menu.kw-home .tabs{gap:8px;display:flex;flex-wrap:wrap;justify-content:center;padding:12px 0;border-top:1px solid #9a80584d;border-bottom:1px solid #9a80584d}'+
'#menu.kw-home .tabs .b{min-height:44px;flex:1 1 125px;font-weight:bold;border:1px solid #a48a55;background:linear-gradient(#4e5140,#282e26 47%,#191e19)!important;color:#f2e3c1;box-shadow:inset 0 1px #fff3,0 3px 0 #090e0b,0 5px 10px #0008}'+
'#menu.kw-home .tabs .b.on,#menu.kw-home .tabs .b:hover{background:linear-gradient(#b79a5e,#655331 52%,#3b3020)!important;color:#fff4d0;border-color:#e4c58a}'+
'#menu.kw-home .card{background:linear-gradient(135deg,#313a30d9,#151d19e8);border:1px solid #82744e;border-radius:8px;box-shadow:inset 0 1px #d5bc8533,0 4px 16px #0006}'+
'#menu.kw-home .kw-home-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:18px;padding-top:12px;border-top:1px solid #a48a5555;color:#c0bba9;font:12px Arial}'+
'#menu.kw-home .kw-home-footer button{min-width:120px}';
document.head.append(menuSkin);
const skinMenu=menu;menu=function(...args){const result=skinMenu(...args);const root=$('menu'),content=$('mw');root.classList.toggle('kw-home',!run);if(!run&&content){const footer=document.createElement('footer');footer.className='kw-home-footer';const version=document.createElement('span');version.textContent='KUBAN WAR  •  Стратегия и сюжетная кампания';footer.append(version);if(dinoEnabled){const unlocked=document.createElement('span');unlocked.textContent='Все кампании открыты';footer.append(unlocked)}if(window.kubanDesktop&&!content.querySelector('[data-pc-action="close"]')){const exit=document.createElement('button');exit.className='b';exit.dataset.pcAction='close';exit.textContent='Выйти из игры';footer.append(exit)}content.querySelector('.kw-home-footer')?.remove();content.append(footer)}return result};


/* Campaign difficulty is chosen once and stored with story progress. */
const difficultyNames=['Лёгкий','Нормальный','Сложный'];
const difficultyHints=['Слабее противники, медленнее их экономика, дополнительные ресурсы игроку.','Обычный урон и одинаковые базовые экономические коэффициенты.','Противник наносит на 15% больше урона, добывает на 15% больше и нанимает войска дешевле.'];
const difficultyValid=d=>Number.isInteger(d)&&d>=0&&d<=2;
if(!difficultyValid(storySave.difficulty)&&storySave.done.length){storySave.difficulty=1;persistStory()}
const difficultyCSS=document.createElement('style');difficultyCSS.textContent=
'#menu.kw-compact{overflow:hidden!important;padding:8px 12px!important}#menu.kw-compact #mw{box-sizing:border-box;max-height:calc(100dvh - 16px);padding:clamp(8px,2vh,20px)!important;overflow:hidden}'+
'#menu.kw-compact h1.T{font-size:clamp(30px,8vh,76px)!important;margin:4px 0!important}#menu.kw-compact #sh{height:clamp(50px,17vh,155px)!important;margin:0!important}'+
'#menu.kw-compact .s{margin:4px auto!important;padding:3px 12px!important}#menu.kw-compact .tabs{margin:5px 0!important;padding:5px 0!important;gap:5px!important}'+
'#menu.kw-compact .b{min-height:32px!important;padding:6px 12px!important}#menu.kw-compact .kw-home-footer{margin:6px 0 0!important;padding:6px 0 0!important}'+
'#menu.kw-compact .kw-home-footer button{margin:0!important}#menu.kw-compact .kw-home-footer{position:relative}'+
'#kw-difficulty{position:fixed;inset:0;z-index:150;background:#000c;display:grid;place-items:center;padding:16px}#kw-difficulty[hidden]{display:none!important}#kw-difficulty section{box-sizing:border-box;width:min(570px,95vw);max-height:95vh;overflow:auto;background:linear-gradient(140deg,#34372c,#171b18);border:2px solid #b99a61;padding:22px;color:#f1e2c4;box-shadow:0 10px 40px #000}#kw-difficulty button{display:block;width:100%;margin:8px 0;padding:12px;text-align:left}#kw-difficulty small{display:block;margin-top:4px;font-weight:normal}';
document.head.append(difficultyCSS);
const difficultyPanel=document.createElement('div');difficultyPanel.id='kw-difficulty';difficultyPanel.hidden=true;document.body.append(difficultyPanel);
const launchWithDifficulty=start;
start=function(...args){
 if(!offline()||args[3]<0||!chapterAllowed(args[3]))return launchWithDifficulty(...args);
 if(!difficultyValid(storySave.difficulty)){
  difficultyPanel.replaceChildren();const section=document.createElement('section'),heading=document.createElement('h2'),intro=document.createElement('p');heading.textContent='Выберите сложность кампании';intro.textContent='Выбор сохраняется до конца истории, включая остальные фракции.';section.append(heading,intro);
  difficultyNames.forEach((name,i)=>{const b=document.createElement('button'),small=document.createElement('small');b.className='b';b.textContent=name;small.textContent=difficultyHints[i];b.append(small);b.onclick=()=>{storySave.difficulty=i;persistStory();difficultyPanel.hidden=true;start(...args)};section.append(b)});
  const cancel=document.createElement('button');cancel.className='b';cancel.textContent='Назад в меню';cancel.onclick=()=>{difficultyPanel.hidden=true;menu('c')};section.append(cancel);difficultyPanel.append(section);difficultyPanel.hidden=false;return;
 }
 args[2]=storySave.difficulty;const result=launchWithDifficulty(...args);
 if(run&&mis?.ci===args[3]){mis.inc=[.7,1,1.15][mis.d];if(mis.d===0)gold[0]+=250;toast('Сложность кампании: '+difficultyNames[mis.d])}return result;
};
const finalPrice=specialPrice;specialPrice=function(T,i,c){if(offline()&&mis?.ci>=0&&T===1)return Math.ceil(c*([1.15,1,.9][mis.d]??1));return finalPrice(T,i,c)};
const compactMenu=menu;menu=function(...args){const result=compactMenu(...args);const root=$('menu'),mw=$('mw'),tab=args[0]||'home';root.classList.toggle('kw-compact',!run&&tab==='home');if(!run&&tab==='home'&&mw){const footer=mw.querySelector('.kw-home-footer'),tabs=mw.querySelector('.tabs');if(footer&&tabs)tabs.after(footer)}return result};


/* The front screen already owns its frame: never nest it inside a second panel. */
const viewportStyle=document.createElement('style');viewportStyle.textContent=
'#menu:has(.front-menu){inset:0!important;width:100%!important;height:100%!important;padding:0!important;overflow:hidden!important}'+
'#menu:has(.front-menu) .w,#menu:has(.front-menu) #mw{width:100%!important;max-width:100%!important;height:100%!important;max-height:100%!important;min-width:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:none!important;box-shadow:none!important;overflow:hidden!important;box-sizing:border-box!important}'+
'#menu #mw:has(.front-menu)>.kw-home-footer{display:none!important}'+
'#menu .front-menu{width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;grid-template-columns:minmax(0,1fr) minmax(230px,32%)!important;gap:clamp(12px,3vw,48px)!important;padding:clamp(16px,3vw,48px)!important;box-sizing:border-box!important;overflow:hidden!important}'+
'#menu .front-left,#menu .front-right{min-width:0!important;min-height:0!important;height:100%!important;max-height:100%!important;margin:0!important;padding:0!important;box-sizing:border-box!important}'+
'#menu .front-emblem{width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;transform:none!important}#menu .front-emblem img{width:100%!important;max-width:100%!important;height:auto!important;max-height:35vh!important;object-fit:contain!important}'+
'#menu .front-bottom{min-width:0!important;max-width:100%!important}#menu .dlc-panel{max-width:100%!important;box-sizing:border-box!important}#menu .dlc-list{min-width:0!important}'+
'#menu .front-menu-shell{width:100%!important;max-width:100%!important;max-height:100%!important;box-sizing:border-box!important;padding:clamp(6px,1.3vh,16px)!important}'+
'#menu .front-deck{gap:clamp(4px,.9vh,12px)!important;padding:clamp(4px,1vh,12px)!important}#menu .front-deck .b,#menu .front-deck button{min-height:0!important;padding:clamp(8px,1.5vh,16px)!important;font-size:clamp(14px,2.1vh,20px)!important}'+
'@media(max-height:780px){#menu .front-prompt,#menu .dlc-note{display:none!important}#menu .dlc-card p{display:none!important}#menu .dlc-icon{max-height:48px!important}#menu .menu-crest{margin:0!important;padding:4px!important}}'+
'@media(max-width:700px){#menu .front-menu{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;padding:12px!important}#menu .dlc-panel{display:none!important}}';
document.head.append(viewportStyle);
const viewportMenu=menu;menu=function(...args){const result=viewportMenu(...args);const root=$('menu'),front=root.querySelector('.front-menu');if(front){root.scrollTop=0;root.scrollLeft=0;const footer=$('mw').querySelector('.kw-home-footer'),exit=footer?.querySelector('[data-pc-action="close"]'),deck=front.querySelector('.front-deck');if(exit&&deck&&!front.querySelector('[data-pc-action="close"]'))deck.append(exit);footer?.remove()}return result};

})();