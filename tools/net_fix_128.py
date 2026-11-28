from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding="utf-8")
if 'KW_NET_FIX_128' in s: sys.exit(0)
if 'KW_NET_FIX_112' not in s: raise RuntimeError("Missing previous lifecycle fix")
root=Path(__file__).parent
def replace(a,b):
    global s
    if s.count(a)!=1: raise RuntimeError("Unexpected game source: "+a[:120])
    s=s.replace(a,b,1)
def between(a,b,replacement):
    global s
    if s.count(a)!=1 or s.count(b)!=1: raise RuntimeError("Unexpected anchors: "+a[:80])
    start=s.index(a); end=s.index(b,start+len(a))
    s=s[:start]+replacement+s[end:]

# Keep simulation running while a host's pause/settings overlay is open; never restart a
# live network game as a local match. Single-player loop keeps original behaviour.
replace("if(run&&!paused){try{tick(dt*ST.speed);scrollCam(dt)}",
        "if(run&&(!paused||window.kubanOnlineAlpha?.role==='host')){try{tick(dt*ST.speed);if(!paused)scrollCam(dt)}")
replace("frameFault('simulation',err);paused=1;",
        "frameFault('simulation',err);if(window.kubanOnlineAlpha?.role==='host'){window.kubanOnlineAlpha.abortMatch?.()}else paused=1;")
# A spatial grid accelerates the pairwise collision loop, preserving its original order.
replace("function tick(dt){t+=dt;",(root/"net_collision_113.js").read_text(encoding="utf-8")+"\nfunction tick(dt){t+=dt;")
replace("for(let i=0;i<us.length;i++){const a=us[i];for(let j=i+1;j<us.length;j++)",
        "if(window.kubanOnlineAlpha?.role==='host'&&us.length>=40)kwNetCollide(us,WW,WH,(x,y)=>mis.ci===4||(!layout?.obstacles&&mis.ci>=0)||campaignWalkable(x,y));else for(let i=0;i<us.length;i++){const a=us[i];for(let j=i+1;j<us.length;j++)")
# PvP is not a single-player AI match: disable local-only world events and AI bonuses.
for k in ["worldOn","villageOn","mysteryOn","frontierOn"]:
    replace("const "+k+"=()=>run&&mis&&mis.ci!==4&&mis.ci!==33;",
            "const "+k+"=()=>run&&mis&&mis.ci!==4&&mis.ci!==33&&!window.kubanOnlineAlpha?.currentMatch;")
replace("const jokeOn=()=>run&&!paused&&mis&&mis.ci!==4&&mis.ci!==33;",
        "const jokeOn=()=>run&&!paused&&mis&&mis.ci!==4&&mis.ci!==33&&!window.kubanOnlineAlpha?.currentMatch;")
replace("function livingPopulate(){if(!run||!mis||mis.ci===4",
        "function livingPopulate(){if(window.kubanOnlineAlpha?.currentMatch||!run||!mis||mis.ci===4")
# The second faction must not be controlled by the single-player AI helpers.
replace("if(T===1&&s.collect&&h.o!=='a'",
        "if(T===1&&!window.kubanOnlineAlpha?.currentMatch&&s.collect&&h.o!=='a'")
replace("if(T===1){if(ai.plan?.phase==='attack'||ai.plan?.phase==='defend')",
        "if(T===1&&!window.kubanOnlineAlpha?.currentMatch){if(ai.plan?.phase==='attack'||ai.plan?.phase==='defend')")
# Lifecycle
replace("function closeOnline(){online.active=false;","function closeOnline(){stopTransport();online.active=false;")
replace("function cleanupMatchUI(){clearTimers();","function cleanupMatchUI(){stopTransport();clearTimers();")
replace("function exitNetwork(){if(exiting)return;exiting=true;",
        "function exitNetwork(){if(exiting)return;notifyPeerLeave();exiting=true;")
replace("window.addEventListener('pagehide',()=>{if(netPlayed||online.currentRoom){",
        "window.addEventListener('pagehide',()=>{if(!exiting&&(netPlayed||online.currentRoom)){notifyPeerLeave();")
# Lobby: preserve selected match settings during automatic refresh; skip unnecessary room listing.
replace("const cfg={hostRace:root.querySelector","const cfg={protocol:128,hostRace:root.querySelector")
replace("room&&players.length>=2&&players.every(p=>p.ready)","room&&players.length===2&&players.every(p=>p.ready)")
replace("const box=online.panel.querySelector('[data-list]');box.replaceChildren();",
        "const box=online.panel.querySelector('[data-list]');const draft={};for(const k of ['host-race','guest-race','gold','size','biome','neutral']){const el=box.querySelector('[data-'+k+']');if(el)draft[k]=el.type==='checkbox'?el.checked:el.value}box.replaceChildren();")
replace("box.append(panel);box.append(lobbyButtons('Начать сетевой бой'",
        "box.append(panel);for(const [k,v] of Object.entries(draft)){const el=panel.querySelector('[data-'+k+']');if(el){if(el.type==='checkbox')el.checked=v;else el.value=v}}box.append(lobbyButtons('Начать сетевой бой'")
replace("()=>rpc('kuban_start_match',{p_room_id:state.room.id,p_config:configFromPanel()})",
        "async()=>{await rpc('kuban_start_match',{p_room_id:state.room.id,p_config:configFromPanel()});try{await rpc('kuban_start_game',{p_room_id:state.room.id})}catch(e){console.warn('[room status]',e)}}")
replace("const rooms=await get('kuban_rooms?select=id,code,name,host_id,max_players,is_private,status&status=eq.waiting&order=created_at.desc&limit=30');",
        "const rooms=mine.length?[]:await get('kuban_rooms?select=id,code,name,host_id,max_players,is_private,status&status=eq.waiting&order=created_at.desc&limit=30');")
replace("Подключено к серверу · обновление списка каждые 3 секунды","Подключено к серверу · обновление списка каждые 5 секунд")
replace("Играбельная альфа · полноценный сетевой матч 1v1","Сетевой матч 1v1 · обоим игрокам нужна версия 1.2.8")
# One seeded generator for the entire synchronous start (not just layout).
between("const baseSetupMap=setupMap;","const baseAI=ai;","")
between("const baseTick=tick;tick=function","const baseEnd=end;", """let netStarting=false;
const netOriginalStart=start;
start=function(...args){if(netPlayed&&!netStarting){exitNetwork();return}return netOriginalStart(...args)};
const netOriginalPause=pauseMenu;
pauseMenu=function(){const r=netOriginalPause();if(online.currentMatch){const shell=$id('mw');shell.querySelector('[data-go2]')?.remove();const p=shell.querySelector('.pause-head p');if(p)p.textContent='Сетевой матч продолжается';}return r};
const baseTick=tick;
function kwStartClock(n){
  let previous=performance.now(),acc=0;
  n.simTimer=setInterval(()=>{
    if(!alive(n)||!run)return;
    const now=performance.now();acc=Math.min(.25,acc+Math.max(0,(now-previous)/1000));previous=now;
    let count=0;while(acc>=1/30&&count++<6&&alive(n)&&run){acc-=1/30;const p=paused;paused=0;try{baseTick(1/30)}catch(e){console.error('[simulation clock]',e);exitNetwork();break}finally{if(run)paused=p}}
  },15);
}
tick=function(dt){
  if(online.currentMatch&&run&&mis?.ci<0){
    const step=dt/Math.max(.1,Number(ST.speed)||1);
    if(online.role==='guest'){if((fog.t=(fog.t||0)-step)<=0){fog.t=.2;fog()}return}
    if(online.role==='host'&&net){
      return
    }
  }return baseTick(dt)
};
""")
replace("function serializeSnapshot(){return {t,mis:{...mis},",
        "function serializeSnapshot(){return {t,NIGHT,mis:{...mis},factionState:shallowSanitize(factionState),herbPatches:shallowSanitize(herbPatches),")
replace("FX:FX.map(f=>shallowSanitize(f))}}","FX:FX.slice(-300).map(f=>shallowSanitize(f))}}")
replace("if(c.ARAB)c.ARAB=[c.ARAB[1],c.ARAB[0]];",
        "if(c.ARAB)c.ARAB=[c.ARAB[1],c.ARAB[0]];if(c.factionState)c.factionState=[c.factionState[1],c.factionState[0]];if(c.herbPatches)for(const h of c.herbPatches)if(h.T===0||h.T===1)h.T=1-h.T;")
# Stable identity, correct selection, faction UI and render interpolation.
between("function applySnapshot(raw){","function battleCfgFromMatch(match){", """function renderPoint(v,now){const f=Math.max(0,Math.min(1,(now-v.at)/v.duration));return {x:v.x+(v.tx-v.x)*f,y:v.y+(v.ty-v.y)*f}}
function applySnapshot(raw){
  const n=net,snap=swapPerspectiveSnapshot(raw),now=clock(),first=!n.lastSeq;
  const wanted=first?[]:(sel?.map?.(u=>u.id)||[]);
  if(snap.mis){if(!mis)mis=snap.mis;else Object.assign(mis,snap.mis);document.body.dataset.race=mis.p}
  t=snap.t||0;NIGHT=!!snap.NIGHT;gold=snap.gold;UP=snap.UP||[[0,0],[0,0]];ARAB=snap.ARAB||[0,0];run=!!snap.run;
  if(Array.isArray(snap.factionState))factionState=snap.factionState;
  if(Array.isArray(snap.herbPatches))herbPatches=snap.herbPatches;
  const existing=new Map((E||[]).map(e=>[e.id,e])),map=new Map(),next=[],visual=new Map();
  const duration=Math.max(45,Math.min(300,n.lastApplied?now-n.lastApplied:100));
  for(const rawEntity of snap.E){
    if(!Number.isSafeInteger(rawEntity.id)||map.has(rawEntity.id))throw Error('Invalid entity ID');
    const prior=existing.get(rawEntity.id),same=prior&&prior.k===rawEntity.k&&prior.race===rawEntity.race;
    const entity=same?prior:{};map.set(rawEntity.id,entity);next.push(entity);
    if(rawEntity.k==='u'&&Number.isFinite(rawEntity.x)&&Number.isFinite(rawEntity.y)){
      const old=n.visual.get(rawEntity.id),pos=old?renderPoint(old,now):{x:rawEntity.x,y:rawEntity.y};
      const smooth=!first&&same&&Math.hypot(pos.x-rawEntity.x,pos.y-rawEntity.y)<180;
      visual.set(rawEntity.id,{x:smooth?pos.x:rawEntity.x,y:smooth?pos.y:rawEntity.y,tx:rawEntity.x,ty:rawEntity.y,at:now,duration});
    }
  }
  for(let i=0;i<snap.E.length;i++){
    const v=reviveValue(snap.E[i],map),o=next[i];
    for(const k of Object.keys(o))if(!Object.prototype.hasOwnProperty.call(v,k))delete o[k];
    Object.assign(o,v);
  }
  E=next;n.visual=visual;
  IT=(snap.IT||[]).map(v=>reviveValue(v,map));FX=(snap.FX||[]).map(v=>reviveValue(v,map));
  sel=wanted.map(id=>map.get(id)).filter(e=>e&&!e.dead);
  if(!sel.length){const h=E.find(e=>e.team===0&&!e.dead&&(e.i===9||e.arab));if(h){sel=[h];if(first){cam.x=h.x-W/Z/2;cam.y=h.y-H/Z/2;clampC()}}}
  if(first){ficApply();setMus(mis.p+'/battle');fog();hud.p=''}
}
const netDraw=draw;
draw=function(...args){
  const n=net;if(!n||online.role!=='guest'||!n.lastSeq||!run)return netDraw(...args);
  const now=clock(),restore=[],oldT=t;
  try{
    for(const e of E){const v=n.visual.get(e.id);if(!v)continue;const pos=renderPoint(v,now);restore.push([e,e.x,e.y]);e.x=pos.x;e.y=pos.y}
    t=oldT+Math.min(.2,Math.max(0,(now-n.lastApplied)/1000));
    return netDraw(...args);
  }finally{t=oldT;for(const [e,x,y] of restore){e.x=x;e.y=y}}
};
""")
replace("function hostPerspectiveSwap(fn){const oldSel=sel, oldPlace=place;",
        "function hostPerspectiveSwap(fn){const oldSel=sel, oldPlace=place, oldPause=paused;const swapFaction=()=>{if(factionState.length===2)[factionState[0],factionState[1]]=[factionState[1],factionState[0]];for(const h of herbPatches)if(h.T===0||h.T===1)h.T=1-h.T;[heroMemory[0],heroMemory[1]]=[heroMemory[1],heroMemory[0]]};swapFaction();paused=0;")
replace("sel=oldSel;place=oldPlace;hud.p='';}}","swapFaction();paused=oldPause;sel=oldSel;place=oldPlace;hud.p='';}}")
between("function sendCommand(kind,payload){","issue=function(wx,wy,am){","function sendCommand(kind,payload){return netCommand(kind,payload)}\n")
# Replace polling-only transport with the new independent transport.
between("const netLocks=new Set();","const style=html('style');style.textContent=", (root/"net_transport_128.js").read_text(encoding="utf-8")+"\n")
replace("window.kubanOnlineAlpha=online;","online.abortMatch=exitNetwork;window.kubanOnlineAlpha=online;")

# Store the player's choice in the existing nickname field using a reversible suffix.
# Room membership policy already restricts each player to their own row; readiness
# is reset through leave/join only if an existing RPC does not permit profile edits.
replace("function configFromPanel(){const root=online.panel;", """function kwChoice(p){const m=String(p?.nickname||'').match(/^(.*)~([0-9a-z_-]+)$/i);return {name:m?m[1]:String(p?.nickname||''),race:m?m[2]:null}}
function kwSelectedRace(){return localStorage.getItem('kuban.online.race')||DEFAULT_CFG.hostRace}
function kwNick(){return saveNick().slice(0,14).replace(/~/g,'')+'~'+kwSelectedRace()}
function configFromPanel(){const root=online.panel;""")
replace("hostRace:root.querySelector('[data-host-race]')?.value||DEFAULT_CFG.hostRace,guestRace:root.querySelector('[data-guest-race]')?.value||DEFAULT_CFG.guestRace", "hostRace:kwChoice(online.lobbyState.players.find(p=>p.user_id===online.lobbyState.room.host_id)).race||DEFAULT_CFG.hostRace,guestRace:kwChoice(online.lobbyState.players.find(p=>p.user_id!==online.lobbyState.room.host_id)).race||DEFAULT_CFG.guestRace")
replace("online.currentRoom=state.room;const box=", "online.currentRoom=state.room;online.lobbyState=state;const box=")
replace("p_nickname:saveNick()", "p_nickname:kwNick()") if s.count("p_nickname:saveNick()")==1 else None
s=s.replace("p_nickname:saveNick()", "p_nickname:kwNick()")
replace("?.nickname||'—')", "?.nickname?.split('~')[0]||'—')")
replace("\x60\x24{p.nickname}\x24{p.user_id", "\x60\x24{kwChoice(p).name} · \x24{RACE_NAMES[kwChoice(p).race]||'—'}\x24{p.user_id")
replace("const myReady=!!state.mine?.ready;", """const myReady=!!state.mine?.ready;
if(!state.match||state.match.status!=='running'){
 const chooser=html('div',null,'kw-online-config');chooser.innerHTML='<h2>Ваша фракция</h2>'+raceSelectMarkup(kwChoice(state.mine).race||kwSelectedRace(),'data-my-race');
 const select=chooser.querySelector('select');select.disabled=myReady;select.onchange=()=>{localStorage.setItem('kuban.online.race',select.value);guarded(async()=>{try{await rpc('kuban_choose_faction',{p_room_id:state.room.id,p_faction:select.value})}catch(err){try{await patch('kuban_players?user_id=eq.'+encodeURIComponent(state.me)+'&room_id=eq.'+encodeURIComponent(state.room.id),{nickname:kwNick()})}catch(_){setStatus('Выбор сохранён локально. Хост может указать фракцию в настройках матча.');return}}const rows=await get('kuban_players?select=nickname&user_id=eq.'+encodeURIComponent(state.me));if(kwChoice(rows[0]).race!==select.value){setStatus('Выбор сохранён локально. Сервер не разрешает изменение фракции; хост может выбрать её в настройках матча.');return}await refreshLobby()})};box.append(chooser);
}""")
replace("<label>Раса хоста \x24{raceSelectMarkup(DEFAULT_CFG.hostRace,'data-host-race')}</label><label>Раса гостя \x24{raceSelectMarkup(DEFAULT_CFG.guestRace,'data-guest-race')}</label>","")
replace("players.every(p=>p.ready)&&room.host_id", "players.every(p=>p.ready&&Object.hasOwn(RACE_NAMES,kwChoice(p).race))&&room.host_id")
# Keep selection intentionally empty rather than forcing the hero on every update.
replace("if(!sel.length){const h=E.find", "if(first&&!sel.length){const h=E.find")

# Input feedback is local UI, not authoritative world state.
replace("function say(id,act,pr){if(!id", "function say(id,act,pr){if(window.kubanOnlineAlpha?.remoteInput)return;if(!id")
replace("function sfx(f,d,ty){if(!ST.vol", "function sfx(f,d,ty){if(window.kubanOnlineAlpha?.remoteInput)return;if(!ST.vol")
replace("function toast(s){$('ms').textContent=s;", "function toast(s){if(window.kubanOnlineAlpha?.remoteInput)return;$('ms').textContent=s;")
replace("FX.push({ty:'r',x:wx,y:wy,rad:14,l:.4,c:p&&p.team==1?'#f66':'#7f7'});","if(!window.kubanOnlineAlpha?.remoteInput)FX.push({ty:'r',localInput:true,x:wx,y:wy,rad:14,l:.4,c:p&&p.team==1?'#f66':'#7f7'});")
replace("FX.push({ty:'r',x:wx,y:wy,rad:22,l:.7,c:'#f5d477'});","if(!window.kubanOnlineAlpha?.remoteInput)FX.push({ty:'r',localInput:true,x:wx,y:wy,rad:22,l:.7,c:'#f5d477'});")
replace("FX.push({ty:'r',x:p.x,y:p.y,rad:10,l:.45,c:'#e7cd83'})","if(!window.kubanOnlineAlpha?.remoteInput)FX.push({ty:'r',localInput:true,x:p.x,y:p.y,rad:10,l:.45,c:'#e7cd83'})")
replace("FX:FX.slice(-300).map(f=>shallowSanitize(f))","FX:FX.filter(f=>!f.localInput).slice(-300).map(f=>shallowSanitize(f))")
replace("function applyHostCommand(kind,payload){hostPerspectiveSwap(()=>{","function applyHostCommand(kind,payload){const previous=online.remoteInput;online.remoteInput=true;try{hostPerspectiveSwap(()=>{")
replace("case 'faction':originalFns.factionAct(0,payload.key);break;default:break}})}","case 'faction':originalFns.factionAct(0,payload.key);break;default:break}})}finally{online.remoteInput=previous}}")
replace("sendCommand('issue',{ids,x:wx,y:wy,am:!!am});FX.push({ty:'r',x:wx,y:wy,rad:14,l:.4,c:'#7f7'});","sendCommand('issue',{ids,x:wx,y:wy,am:!!am});say(vk(sel.find(u=>ids.includes(u.id)&&(u.i===9||u.arab))||sel.find(u=>ids.includes(u.id))),'order');kwLocalClick(wx,wy,14,.4,'#7f7');")
replace("sendCommand('rally',{ids:buildings,x:wx,y:wy});toast('Точка сбора отправлена');","sendCommand('rally',{ids:buildings,x:wx,y:wy});kwLocalClick(wx,wy,22,.7,'#f5d477');toast('Точка сбора отправлена');")
replace("function renderPoint(v,now){","function kwLocalClick(x,y,rad,l,c){if(!net)return;(net.localClicks??=[]).push({ty:'r',localInput:true,x,y,rad,l,c,until:clock()+l*1000});}\nfunction renderPoint(v,now){")
replace("const now=clock(),restore=[],oldT=t;","const now=clock(),restore=[],oldT=t,oldFX=FX;")
replace("t=oldT+Math.min(.2,Math.max(0,(now-n.lastApplied)/1000));","t=oldT+Math.min(.2,Math.max(0,(now-n.lastApplied)/1000));n.localClicks=(n.localClicks||[]).filter(f=>f.until>now);FX=oldFX.concat(n.localClicks.map(f=>({...f,l:(f.until-now)/1000})));")
replace("}finally{t=oldT;for(const [e,x,y] of restore)","}finally{FX=oldFX;t=oldT;for(const [e,x,y] of restore)")

# The later positional-audio mixer replaces the original say() at runtime.
replace("say=function(id,act,pr,source){if(!id", "say=function(id,act,pr,source){if(window.kubanOnlineAlpha?.remoteInput)return;if(!id")
replace("function queueSpeech(a,{source=null,priority=1,ui=false,enemy=false,key='',ttl=2400}={}){if(!ST.voice", "function queueSpeech(a,{source=null,priority=1,ui=false,enemy=false,key='',ttl=2400}={}){if(window.kubanOnlineAlpha?.remoteInput)return;if(!ST.voice")
replace("fieldSound=function(key,u){if(!run", "fieldSound=function(key,u){if(window.kubanOnlineAlpha?.remoteInput)return;if(!run")
replace("function speechVolume(q){return Math.max", "function speechVolume(q){if(window.kubanOnlineAlpha?.currentMatch&&q.source?.team!==undefined&&q.source.team!==0){if(q.ui||!fxVisible(q.source)||cameraGain(q.source)<.035)return 0}return Math.max")
replace("const previous=online.remoteInput;online.remoteInput=true;try{hostPerspectiveSwap", "const previous=online.remoteInput,oldShake=shake;online.remoteInput=true;try{hostPerspectiveSwap")
replace("finally{online.remoteInput=previous}}", "finally{online.remoteInput=previous;shake=oldShake}}")
replace("if(n)FX.push({ty:'r',x:s.x,y:s.y,rad:22,l:.6,c:'#a6e3ef'});","if(n&&!window.kubanOnlineAlpha?.remoteInput)FX.push({ty:'r',localInput:true,x:s.x,y:s.y,rad:22,l:.6,c:'#a6e3ef'});")
# Formation drag was bypassing the guest command router and being reverted by snapshots.
replace("function formationCommit(plan,assault=false){const ok=plan.filter(p=>p.ok);","function formationCommit(plan,assault=false){if(window.kubanOnlineAlpha?.role==='guest'){window.kubanOnlineAlpha.sendFormation?.(plan,assault);return}const ok=plan.filter(p=>p.ok);")
replace("formationFlash={plan:ok,until:performance.now()+700};","if(!window.kubanOnlineAlpha?.remoteInput)formationFlash={plan:ok,until:performance.now()+700};")
replace("case 'stance':{sel=E.filter","case 'formation':{const points=payload.points||[];const plan=points.map(p=>{const u=E.find(e=>e.id===p.id&&e.team===0&&e.k==='u'&&!e.dead);return u?{u,x:cl(p.x,u.r+4,WW-u.r-4),y:cl(p.y,u.r+4,WH-u.r-4),ok:!blocked(p.x,p.y,u.r)}:null}).filter(Boolean);formationCommit(plan,!!payload.assault);break}case 'stance':{sel=E.filter")
replace("online.abortMatch=exitNetwork;window.kubanOnlineAlpha=online;","online.abortMatch=exitNetwork;online.sendFormation=(plan,assault)=>{const ok=plan.filter(p=>p.ok&&p.u?.team===0&&!p.u.dead);if(!ok.length)return;sendCommand('formation',{points:ok.map(p=>({id:p.u.id,x:p.x,y:p.y})),assault:!!assault});say(vk(ok.find(p=>p.u.i===9)?.u||ok[0].u),'order');formationFlash={plan:ok,until:performance.now()+700};for(const p of ok)kwLocalClick(p.x,p.y,10,.45,'#e7cd83')};window.kubanOnlineAlpha=online;")

# Fixed river layout is selected through the existing network biome field.
replace("function relocateMap(){", (root/"river_map.js").read_text(encoding="utf-8").split("if(typeof module")[0]+"\nfunction relocateMap(){if(layout?.riverRequested){kwRiverPopulate({});return;}")
replace("shift:ci>=0?0:(mapRand()-.5)*.13};PONDS=[];", "shift:ci>=0?0:(mapRand()-.5)*.13,riverRequested:ci<0&&opt?.biome==='river'};PONDS=[];")
replace("if(ci_<0||ci_===4)populateSites(opt);", "if((ci_<0||ci_===4)&&!layout?.river)populateSites(opt);")
replace("function campaignBarrier(x,y,r=0){return", "function campaignBarrier(x,y,r=0){if(layout?.river&&kwRiverBlocked(x,y,r,WW,WH))return true;return")
replace("paintMissionProps(x);paintCampaignBarriers(x)}", "paintMissionProps(x);paintCampaignBarriers(x);if(layout?.river)kwRiverPaint(x)}")
replace("<option value=\"random\">Случайная</option><option value=\"0\">Степь</option>", "<option value=\"river\" selected>Речной мост</option><option value=\"random\">Случайная</option><option value=\"0\">Степь</option>")
replace("const DEFAULT_CFG={hostRace:'kaz',guestRace:'nov',gold:600,size:1,biome:'random'", "const DEFAULT_CFG={hostRace:'kaz',guestRace:'nov',gold:600,size:1,biome:'river'")
# No shortcuts through water, including movement paths used by fishing and collision pushes.
replace("if(!layout?.obstacles||mis?.ci===4||mis?.ci<0)return directCampaignMove", "if(!layout?.obstacles||mis?.ci===4||(mis?.ci<0&&!layout?.river))return directCampaignMove")
replace("function combatSight(a,b){if(!layout?.obstacles||mis?.ci<0||mis?.ci===4)", "function combatSight(a,b){if(!layout?.obstacles||(mis?.ci<0&&!layout?.river)||mis?.ci===4)")
# Both players can use the fixed neutral objects without opening host-side merchant UI.
replace("function openSite(site,h){if(tradeSite", """function kwRiverVisit(site,h){if(site.kind==='cache'&&!site.sold.cache){if(putReward(h,site.reward)){site.sold.cache=1;gold[h.team]+=120;gxp(h,65)}}else if(site.kind==='merchant'&&!(site.sold['welcome'+h.team])){site.sold['welcome'+h.team]=1;gold[h.team]+=100}}
function openSite(site,h){if(layout?.river&&window.kubanOnlineAlpha?.currentMatch){kwRiverVisit(site,h);return}if(tradeSite""")
replace("if(h.team==0&&(h.i==9||h.arab)&&h.inv){pickup(h);", "if((h.team==0||(layout?.river&&h.team==1))&&(h.i==9||h.arab)&&h.inv){if(h.team==0)pickup(h);")
replace("function doPlace(wx,wy){", "function doPlace(wx,wy){if(layout?.river&&Math.abs(wx*1792/WW-870)<70&&Math.abs(wy*856/WH-390)<120){toast('На мосту нельзя строить');return;}")
replace("(!ST.fog||ex[ci(s.x,s.y)])", "(!ST.fog||window.kubanOnlineAlpha?.remoteInput||ex[ci(s.x,s.y)])")
p.write_text(s,encoding="utf-8")
