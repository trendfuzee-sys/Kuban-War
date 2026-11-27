/* Two-sided story presentation, preserving original mission and choice logic. */
(()=>{
'use strict';
const aliases={'данил':'danil','казак данил':'danil','кровчински':'krovchinski','полуживой вячислав кровчински':'krovchinski','субидей':'subidey','субидей исатаев':'subidey','богдан':'bogdan','богдан рыжий':'bogdan','адмирал эстон':'eston','эстон':'eston','сосед':'neighbor','хлебороб':'farmer','казак':'cossack','дозорный':'sentry','беглец':'fugitive','рабочий':'worker','посланник орды':'envoy','торговец':'merchant','всадник':'rider','старик':'elder','студент':'student','ботан':'nerd','араб':'arab','сожитель':'roommate','заключённый':'prisoner','выживший':'survivor','атаман':'concepts/ataman','военачальник':'concepts/commander','лидер беглецов':'concepts/outlaw','преподаватель':'concepts/dean','аристократ':'concepts/aristocrat'};
const key=n=>aliases[String(n||'').trim().toLowerCase()]||null;
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
function portrait(who,line){const k=key(who),m=window.KWDialoguePortraits||{},v=m[k],entry=v?.placeholder_only?m[v.fallback]:v,images=entry?.portraits||{};for(const e of [...emotionOrder(line?.[2],line?.[1]),'neutral'])if(images[e])return images[e];return oldPortrait[k]?'img/'+oldPortrait[k]+'/hero.png.png':null}
function lastLine(lines,n,who){for(let i=n;i>=0;i--)if(lines[i]?.[0]===who||!!key(who)&&key(lines[i]?.[0])===key(who))return lines[i];return null}
window.KWDialogueEmotion={emotionOrder,lastLine};
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
function updateSlot(slot,who,active,line){slot.el.hidden=!who;slot.el.classList.toggle('active',!!who&&active);slot.label.textContent=who||'';const path=portrait(who,line);if(slot.who!==who||slot.path!==path){slot.who=who;slot.path=path;slot.img.hidden=!path;if(path){slot.img.onerror=()=>{const neutral=portrait(who,null);if(neutral&&neutral!==path&&slot.img.getAttribute('src')===path){slot.img.src=neutral}else slot.img.hidden=true};slot.img.src=path}else slot.img.removeAttribute('src')}}
const previous=paintTalk;paintTalk=function(...args){const result=previous(...args);if(!talk)return result;const who=talk.lines[talk.n]?.[0],preferred=hero[CAM[scenario?.id??talk.id]?.p],pair=assign(talk.lines,talk.n,preferred);for(let i=0;i<2;i++)updateSlot(slots[i],pair[i],(pair[i]===who||!!key(who)&&key(pair[i])===key(who)),lastLine(talk.lines,talk.n,pair[i]));resize();return result};
// Older portrait renderer references the current wrapper's token.
paintTalk.token=0;
})();
