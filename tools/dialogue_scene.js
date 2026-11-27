/* Two-sided story presentation, preserving original mission and choice logic. */
(()=>{
'use strict';
const aliases={'данил':'danil','казак данил':'danil','кровчински':'krovchinski','полуживой вячислав кровчински':'krovchinski','субидей':'subidey','субидей исатаев':'subidey','богдан':'bogdan','богдан рыжий':'bogdan','адмирал эстон':'eston','эстон':'eston','сосед':'neighbor','хлебороб':'farmer','казак':'cossack','дозорный':'sentry','беглец':'fugitive','рабочий':'worker','посланник орды':'envoy','торговец':'merchant','всадник':'rider','старик':'elder','студент':'student','ботан':'nerd','араб':'arab','сожитель':'roommate','заключённый':'prisoner','выживший':'survivor','атаман':'concepts/ataman','военачальник':'concepts/commander','лидер беглецов':'concepts/outlaw','преподаватель':'concepts/dean','аристократ':'concepts/aristocrat'};
const normalize=n=>String(n||'').normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[«»"'.,:!?()]/g,' ').replace(/\s+/g,' ').trim();
const normalizedAliases=Object.fromEntries(Object.entries(aliases).map(([n,k])=>[normalize(n),k]));
function key(n){
 const name=normalize(n);if(!name)return null;
 if(normalizedAliases[name])return normalizedAliases[name];
 for(const [pattern,k] of [[/данил/,'danil'],[/кровчинск/,'krovchinski'],[/суб[ие]дей|исатаев/,'subidey'],[/богдан/,'bogdan'],[/эстон/,'eston'],[/араб/,'arab'],[/сожител/,'roommate'],[/атаман/,'concepts/ataman'],[/военачальник|десятник|командир/,'concepts/commander'],[/староста|старик/,'elder'],[/дозор|развед|страж|охранник/,'sentry'],[/торгов|купец/,'merchant'],[/крестья|хлебороб|земледел/,'farmer'],[/беглец|мародер/,'fugitive'],[/заключен|узник/,'prisoner'],[/студент/,'student'],[/ботан/,'nerd'],[/преподав|декан/,'concepts/dean'],[/аристократ/,'concepts/aristocrat'],[/выживш|бежен/,'survivor'],[/всадник/,'rider'],[/посланник/,'envoy'],[/казак/,'cossack'],[/рабоч|механик|мастер/,'worker'],[/житель|сосед/,'neighbor']])if(pattern.test(name))return k;
 return null;
}
const hero={kaz:'danil',nov:'krovchinski',mon:'subidey',bog:'bogdan'};
const oldPortrait={danil:'kaz',krovchinski:'nov',subidey:'mon',bogdan:'bog'};
const style=document.createElement('style');style.textContent=
'#storyDialog.kw-duet{background:linear-gradient(180deg,#0002 0%,#0005 46%,#000d 100%)!important;isolation:isolate}'+
'#storyDialog.kw-duet article{z-index:2;width:min(1040px,96vw)!important;max-height:45vh!important;border:2px solid #987b4d!important;border-top:4px solid #e0c58c!important;border-radius:12px 12px 0 0;background:linear-gradient(145deg,#35312a,#171b1c 42%,#21201b)!important;box-shadow:inset 0 0 0 3px #171817,inset 0 6px 12px #fff1,0 -8px 32px #0009!important}'+
'#storyDialog.kw-duet .kw-speaker{display:none!important}'+
'#storyDialog.kw-duet .kw-duet-stage{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}'+
'#storyDialog.kw-duet .kw-duet-slot{position:absolute;bottom:calc(var(--kw-duet-height,220px) - 6px);width:min(37vw,410px);height:min(48vh,430px);margin:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;filter:brightness(.48) saturate(.62);transform:scale(.94);transform-origin:bottom center;transition:filter .25s ease,transform .25s ease;opacity:.88}'+
'#storyDialog.kw-duet .kw-duet-slot[data-side=left]{left:clamp(4px,6vw,120px)}#storyDialog.kw-duet .kw-duet-slot[data-side=right]{right:clamp(4px,6vw,120px)}'+
'#storyDialog.kw-duet .kw-duet-slot.active{filter:brightness(1.05) saturate(1.06);transform:scale(1);opacity:1}'+
'#storyDialog.kw-duet .kw-duet-slot img{display:block;width:100%;height:calc(100% - 34px);object-fit:contain;object-position:center bottom;filter:drop-shadow(0 6px 12px #000c);border:0!important}'+
'#storyDialog.kw-duet .kw-duet-slot.active img{filter:drop-shadow(0 0 18px #e6bc6266) drop-shadow(0 6px 12px #000b)}'+
'#storyDialog.kw-duet .kw-duet-slot figcaption{max-width:100%;padding:5px 16px;color:#e0d4bd;background:linear-gradient(#484136,#22221d);border:1px solid #89754e;box-shadow:inset 0 1px #fff3,0 3px 8px #0008;font-weight:bold;text-align:center;border-radius:4px}'+
'#storyDialog.kw-duet .kw-duet-slot.active figcaption{color:#ffe8b1;border-color:#dfba6d;box-shadow:inset 0 1px #fff5,0 0 14px #cba04955}'+
'#storyDialog.kw-duet .kw-duet-slot[hidden],#storyDialog.kw-duet .kw-duet-slot img[hidden]{display:none!important}'+
'#storyDialog.kw-duet footer .b{background:linear-gradient(#514834,#29261e);border:1px solid #b39a69;box-shadow:inset 0 1px #e7d0a344,0 3px 0 #111;color:#f5e6c6}'+
'@media(max-height:650px){#storyDialog.kw-duet .kw-duet-slot{height:29vh}}@media(prefers-reduced-motion:reduce){#storyDialog.kw-duet .kw-duet-slot{transition:none}}';
document.head.append(style);dialog.classList.add('kw-duet');
const stage=document.createElement('div');stage.className='kw-duet-stage';stage.setAttribute('aria-hidden','true');
const slots=['left','right'].map(side=>{const el=document.createElement('figure'),img=document.createElement('img'),label=document.createElement('figcaption');el.className='kw-duet-slot';el.dataset.side=side;el.hidden=true;img.alt='';img.decoding='async';el.append(img,label);stage.append(el);return {el,img,label,who:null,path:null}});
dialog.append(stage);
const article=dialog.querySelector('article');const resize=()=>dialog.style.setProperty('--kw-duet-height',article.offsetHeight+'px');if(typeof ResizeObserver==='function')new ResizeObserver(resize).observe(article);
function emotionOrder(mood,txt){
 const m=String(mood||'').toLowerCase().replace(/ё/g,'е'),t=String(txt||'').toLowerCase();
 if(/горьк.*усмеш|насмеш|ирони|сарказ/.test(m))return ['smirk','sad'];
 if(/угроз/.test(m))return ['threatening','angry','commanding'];
 if(/раздраж|ярост|злост|резко|досад|нетерпел/.test(m))return ['angry','threatening'];
 if(/сомнен|сомнева|подозр|неувер|тревог|тревож|напряж/.test(m))return ['suspicious','wary','thinking','surprised'];
 if(/самоувер|горд/.test(m))return ['proud','smirk','determined'];
 if(/гореч|печал|устал|отчаян/.test(m))return ['sad','tired','wounded'];
 if(/страх|испуг|растерян|удив/.test(m))return ['surprised','wary','suspicious'];
 if(/боль|усили|ранен/.test(m))return ['wounded','fading','sad','tired'];
 if(/решит|приказ|команд/.test(m))return ['determined','commanding','hopeful'];
 if(/надежд|радост/.test(m))return ['hopeful','happy','smirk'];
 if(/холод|сдержан|тихо/.test(m))return ['neutral'];
 if(/^(что\?|как\?|не может быть|серьезно\?)/.test(t))return ['surprised'];
 return ['neutral'];
}
const atlasByKey={danil:'kaz_hero',krovchinski:'nov_hero',subidey:'mon_hero',bogdan:'bog_hero',eston:'boss_admiral',neighbor:'special_civilian',farmer:'kaz_worker',cossack:'kaz_unit_1',sentry:'special_guard',fugitive:'nov_unit_1',worker:'nov_worker',envoy:'mon_worker',merchant:'special_civilian',rider:'mon_unit_1',elder:'special_civilian',student:'bog_worker',nerd:'bog_worker',arab:'special_arab',roommate:'special_roommate',prisoner:'nov_worker',survivor:'special_civilian','concepts/ataman':'kaz_legend','concepts/commander':'mon_legend','concepts/outlaw':'nov_legend','concepts/dean':'bog_legend','concepts/aristocrat':'special_guard'};
const neutralSilhouette='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300"><defs><linearGradient id="a" x2="0" y2="1"><stop stop-color="#b3a17a"/><stop offset="1" stop-color="#383a35"/></linearGradient></defs><path fill="#202623" d="M22 290V236Q27 175 79 158L88 147Q66 120 71 82Q76 40 120 35Q164 40 169 82Q174 120 152 147L161 158Q213 175 218 236V290Z"/><path fill="url(#a)" opacity=".8" d="M22 290V236Q27 175 79 158L88 147Q66 120 71 82Q76 40 120 35Q164 40 169 82Q174 120 152 147L161 158Q213 175 218 236V290Z"/><path fill="none" stroke="#c7ac72" stroke-width="2" d="M22 290V236Q27 175 79 158L88 147Q66 120 71 82Q76 40 120 35Q164 40 169 82Q174 120 152 147L161 158Q213 175 218 236V290Z"/></svg>');
function portraitCandidates(who,line){
 const k=key(who),m=window.KWDialoguePortraits||{},v=m[k],entry=v?.placeholder_only?m[v.fallback]:v,images=entry?.portraits||{};
 const out=[];for(const e of [...emotionOrder(line?.[2],line?.[1]),'neutral',...Object.keys(images)])if(images[e])out.push({path:images[e],atlas:false});
 if(oldPortrait[k])out.push({path:'img/'+oldPortrait[k]+'/hero.png.png',atlas:false});
 out.push({path:'unit-art/sprites/'+(atlasByKey[k]||'special_civilian')+'.webp',atlas:true});
 if(atlasByKey[k]!=='special_civilian')out.push({path:'unit-art/sprites/special_civilian.webp',atlas:true});
 return out.filter((p,i)=>out.findIndex(q=>q.path===p.path)===i);
}
const portraitCache=new Map();
function loadPortrait(candidate){
 const {path,atlas}=candidate,cacheKey=path+'|'+atlas;
 if(portraitCache.has(cacheKey))return portraitCache.get(cacheKey);
 const pending=new Promise(resolve=>{
  const image=new Image();let done=false;
  const finish=value=>{if(done)return;done=true;clearTimeout(timer);image.onload=image.onerror=null;resolve(value)};
  const timer=setTimeout(()=>finish(null),5000);
  image.onerror=()=>finish(null);
  image.onload=()=>{try{if(!atlas){finish(path);return}const w=image.naturalWidth/6,h=image.naturalHeight/4;if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1){finish(null);return}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(image,0,0,w,h,0,0,w,h);finish(c.toDataURL('image/png'))}catch(_){finish(null)}};
  image.src=path;
 });
 portraitCache.set(cacheKey,pending);return pending;
}
async function resolvePortrait(candidates){for(const c of candidates){const p=await loadPortrait(c);if(p)return p}return neutralSilhouette}
function lastLine(lines,n,who){for(let i=n;i>=0;i--)if(lines[i]?.[0]===who||!!key(who)&&key(lines[i]?.[0])===key(who))return lines[i];return null}
window.KWDialogueEmotion={emotionOrder,lastLine,key,portraitCandidates,resolvePortrait};
// Keep the protagonist (or first speaker) on the left for the entire scene.
function assign(lines,n,preferred){
 const now=lines[n]?.[0];if(!now)return [null,null];
 const known=lines.map(l=>l[0]).filter(w=>key(w));
 const left=known.find(w=>key(w)===preferred)||known[0]||lines[0]?.[0]||now;
 const same=(a,b)=>a===b||!!key(a)&&key(a)===key(b);
 if(!same(now,left))return [left,now];
 const partner=[...lines.slice(0,n).reverse(),...lines.slice(n+1)].map(l=>l[0]).find(w=>w&&!same(w,left));
 return [left,partner||null];
}
function updateSlot(slot,who,active,line){
 slot.el.hidden=!who;slot.el.classList.toggle('active',!!who&&active);slot.label.textContent=who||'';
 if(!who){slot.token=(slot.token||0)+1;slot.who=null;slot.path=null;slot.img.hidden=true;return}
 const candidates=portraitCandidates(who,line),signature=candidates.map(c=>c.path).join('|');
 if(slot.who===who&&slot.path===signature)return;
 const token=slot.token=(slot.token||0)+1;
 const changed=slot.who!==who;slot.who=who;slot.path=signature;slot.img.hidden=false;
 if(changed||!slot.img.getAttribute('src'))slot.img.src=neutralSilhouette;
 slot.img.onerror=()=>{if(slot.token===token&&slot.img.getAttribute('src')!==neutralSilhouette)slot.img.src=neutralSilhouette};
 resolvePortrait(candidates).then(path=>{if(slot.token===token&&slot.who===who)slot.img.src=path});
}
const previous=paintTalk;paintTalk=function(...args){const result=previous(...args);if(!talk)return result;const who=talk.lines[talk.n]?.[0],preferred=hero[CAM[scenario?.id??talk.id]?.p],pair=assign(talk.lines,talk.n,preferred);if(Math.floor(talk.n/4)%2&&pair[0]&&pair[1])pair.reverse();for(let i=0;i<2;i++)updateSlot(slots[i],pair[i],(pair[i]===who||!!key(who)&&key(pair[i])===key(who)),lastLine(talk.lines,talk.n,pair[i]));resize();return result};
// Older portrait renderer references the current wrapper's token.
paintTalk.token=0;

/* Campaign presentation and optional civilian conversations. */
const polish=document.createElement('style');
const cursor=(svg,x,y)=>'url("data:image/svg+xml,'+encodeURIComponent(svg)+'") '+x+' '+y;
const arrow=cursor('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M3 2L5 27L12 19L19 28L24 24L16 15L27 12Z" fill="#ead39b" stroke="#382719" stroke-width="2" stroke-linejoin="round"/><path d="M5 5L22 12L12 14Z" fill="#fff3cd"/></svg>',3,2);
const hand=cursor('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M11 17V5Q14 1 17 5V13L21 12L27 16V23L22 29H12L4 18Q4 14 8 15Z" fill="#ecd49a" stroke="#39291b" stroke-width="2"/></svg>',14,4);
polish.textContent='html,body{cursor:'+arrow+',auto}button:not(:disabled),[role=button],a,select{cursor:'+hand+',pointer!important}#cv:not([style*="cursor"]){cursor:'+arrow+',auto}'+
'#top,#pan{background:linear-gradient(180deg,#655440 0%,#30291f 12%,#1d211e 55%,#332b20 100%);box-shadow:inset 0 2px #e6ca8540,inset 0 -3px #090a09,0 4px 14px #0008}'+
'#obj,.chip,.pt,#mm{border-color:#a48b56;box-shadow:inset 0 2px #f4d28a24,inset 0 -3px #0008,0 3px 8px #0009;border-radius:6px}'+
'.b:not(:disabled):not(.on){background:linear-gradient(180deg,#5b4b35,#332b20 48%,#231e18);box-shadow:inset 0 1px #e9c98766,inset 0 -2px #0008,0 3px 0 #111,0 4px 8px #0005}'+
'.b:hover:not(:disabled){filter:brightness(1.17)}.b:active:not(:disabled){transform:translateY(2px);box-shadow:inset 0 2px 5px #0008}'+
'.hp{box-shadow:inset 0 2px 4px #000a}.hp i{box-shadow:inset 0 2px #fff4,inset 0 -2px #0005}'+
'#kw-civil-talk{position:fixed;bottom:12.4rem;right:1rem;z-index:4;max-width:45vw}#kw-civil-talk[hidden]{display:none!important}';
document.head.append(polish);
const edits=new Map([
['Пускай между собой договорятся, кто из них главный бухгалтер. Мы никому платить не будем. Зато надо сделать так, чтобы сюда больше не заходили без приглашения.','Пусть сначала между собой договорятся. Мы им ничего не должны. Лучше укрепим вход, а то опять кто-нибудь заявится.'],
['Можем укрепить проходы, наладить добычу ресурсов и организовать обучение. Но понадобится время и деньги.','Можем укрепить проходы, наладить добычу и обучить ребят. Только это не за один день делается. И денег понадобится немало.'],
['Хорошо, идём вместе. Нам нужно оборудование, не очередная бессмысленная война за двор.','Ладно, идём вместе. Заберём оборудование и домой. Мне ещё одной драки за двор не хватало.'],
['Если откроешь дверь, назад уже не отыграешь.','Богдан, подумай. Откроешь дверь — обратно уже ничего не вернёшь.'],
['Я слышу. Просто не знаю, как признаться, что сам его боюсь.','Да слышу я. Просто... я сам его боюсь, понимаешь?'],
['Проверим, если будет время.','Ладно, запомню. Если будет время, загляну.']
]);
const originalShow=showTalk;
showTalk=function(lines,done){return originalShow(lines.map(l=>Array.isArray(l)&&edits.has(l[1])?[l[0],edits.get(l[1]),...l.slice(2)]:l),done)};
const btn=document.createElement('button');btn.id='kw-civil-talk';btn.className='b';btn.hidden=true;document.body.append(btn);
const conversations=[
 {name:'Хлебороб',lines:['С утра на ногах. Хорошо хоть сегодня дождя нет.','Да куда нам уходить? Здесь дом, земля. Вот бы только спокойно дожить до вечера.']},
 {name:'Сосед',lines:['Здорово. Ты к нам по делу или просто мимо шёл?','Если увидишь наших на дороге, скажи, чтобы домой возвращались. Неспокойно нынче.']},
 {name:'Старик',lines:['Эх, раньше по этой дороге спокойно ходили.','Береги себя. Землю ещё вспашем, а человека не вернёшь.']},
 {name:'Торговец',lines:['Привет. Торговля нынче совсем встала.','Я бы и рад товар привезти, да дороги неспокойные.'] }
];
const visits=new WeakMap();let candidate=null;
function nearby(){
 if(!run||paused||talk||IN||!document.getElementById('menu').hidden||window.kubanOnlineAlpha?.currentMatch||!scenario||scenario.finished)return null;
 const h=E.find(u=>!u.dead&&u.team===0&&u.k==='u'&&u.i===9);
 if(!h)return null;
 let best=null,dist=135;
 for(const u of E){if(!u.dead&&u.civilian&&u.village&&u.civicRole!=='child'){const d=D(h,u);if(d<dist){best=u;dist=d}}}
 return best;
}
btn.onclick=()=>{const u=nearby();if(!u)return;const v=visits.get(u)||0;visits.set(u,v+1);const c=conversations[Math.abs(Number(u.id)||0)%conversations.length],who=castSpeaker(scenario.id);
 const lines=v===0?[[c.name,c.lines[0],'Спокойно'],[who,'Как у вас тут? Всё нормально?','Сдержанно'],[c.name,c.lines[1],'С тревогой'],[who,'Понял. Берегите себя.','Спокойно']]:[[c.name,'Опять ты? Рад, что всё ещё цел.','Спокойно'],[who,'И вы держитесь.','Спокойно']];
 btn.hidden=true;showTalk(lines);
};
setInterval(()=>{candidate=nearby();btn.hidden=!candidate;if(candidate)btn.textContent='Поговорить с жителем';},250);

})();
