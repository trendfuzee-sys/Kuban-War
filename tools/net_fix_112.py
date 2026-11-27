from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding="utf-8")
if 'KW_NET_FIX_112' in s:
    sys.exit(0)
def replace(a,b):
    global s
    if s.count(a)!=1:
        raise RuntimeError("Unexpected game source: "+a[:100])
    s=s.replace(a,b,1)
replace("const TICK_ROOM=3000, TICK_MATCH=260, PUSH_SNAPSHOT=360, PULL_COMMANDS=140;", "const TICK_ROOM=5000, TICK_MATCH=450, PUSH_SNAPSHOT=650, PULL_COMMANDS=280; // KW_NET_FIX_112")
replace("if(tb==='o')open();return result", "return result")
replace("const baseMenu=menu;menu=function(tb='home'){if(!online.suppressMenuClose)closeOnline();const out=baseMenu(tb);if(tb==='o')openOnlineMenu();return out};", """let netPlayed=false, exiting=false, pendingLeaveKey='kuban.online.pendingLeave';
async function leaveRemote(){localStorage.setItem(pendingLeaveKey,'1');await rpc('kuban_leave_room');localStorage.removeItem(pendingLeaveKey)}
function exitNetwork(){if(exiting)return;exiting=true;run=false;paused=0;closeOnline();localStorage.setItem(pendingLeaveKey,'1');Promise.race([leaveRemote().catch(console.error),new Promise(r=>setTimeout(r,3500))]).finally(()=>location.reload())}
const baseMenu=menu;menu=function(tb='home'){if(exiting)return;if(netPlayed||online.currentMatch){exitNetwork();return}if(online.currentRoom&&tb!=='o'){exitNetwork();return}closeOnline();const out=baseMenu(tb);if(tb==='o')openOnlineMenu();return out};
window.addEventListener('pagehide',()=>{if(netPlayed||online.currentRoom){localStorage.setItem(pendingLeaveKey,'1');if(online.session?.access_token)fetch(URL+'/rest/v1/rpc/kuban_leave_room',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+online.session.access_token,'Content-Type':'application/json'},body:'{}',keepalive:true}).catch(()=>{})}});""")
replace("async function roomState(){await auth();", "async function roomState(){await auth();if(localStorage.getItem('kuban.online.pendingLeave'))await leaveRemote();")
replace("online.suppressMenuClose=true;online.currentMatch=match;online.role='host'", "netPlayed=true;online.suppressMenuClose=false;online.currentMatch=match;online.role='host'")
replace("online.suppressMenuClose=true;online.currentMatch=match;online.role='guest'", "netPlayed=true;online.suppressMenuClose=false;online.currentMatch=match;online.role='guest'")
replace("const map=new Map();E=(snap.E||[]).map(e=>{const o=reviveValue(e,new Map());map.set(o.id,o);return o});E=E.map(e=>reviveValue(e,map));", "const map=new Map();E=(snap.E||[]).map(e=>{const o={};map.set(e.id,o);return o});(snap.E||[]).forEach((e,i)=>Object.assign(E[i],reviveValue(e,map)));")
replace("paused=0;const map=new Map();", "const map=new Map();")
replace("hud.p='';fog();}", "hud.p='';}")
replace("const c=JSON.parse(JSON.stringify(s));if(c.gold)", "const c=s;if(c.gold)")
replace("async function pullCommands(){", """const netLocks=new Set();let nextPeerCheck=0;
async function singleNet(key,fn){if(netLocks.has(key)||exiting)return;netLocks.add(key);try{await fn()}catch(e){if(!exiting)console.warn('[net]',e)}finally{netLocks.delete(key)}}
async function pullCommands(){""")
replace("const rows=await get('kuban_match_commands?select=id,kind,payload,sender_id&match_id=eq.'+encodeURIComponent(online.currentMatch.id)+'&id=gt.'+online.lastCommand+'&order=id.asc');for(const row of rows){online.lastCommand=row.id;applyHostCommand(row.kind,row.payload||{})}", """const m=online.currentMatch,gen=online.generation;if(Date.now()>=nextPeerCheck){nextPeerCheck=Date.now()+2000;const peers=await get('kuban_players?select=user_id&room_id=eq.'+encodeURIComponent(m.room_id));if(gen!==online.generation||online.currentMatch!==m)return;if(!peers.some(p=>p.user_id===m.guest_id)){exitNetwork();return}}const rows=await get('kuban_match_commands?select=id,kind,payload,sender_id&match_id=eq.'+encodeURIComponent(m.id)+'&id=gt.'+online.lastCommand+'&order=id.asc&limit=100');if(gen!==online.generation||online.currentMatch!==m||!run)return;for(const row of rows){online.lastCommand=row.id;if(row.sender_id===m.guest_id)applyHostCommand(row.kind,row.payload||{})}""")
replace("setInterval(()=>pullCommands().catch(err=>console.error(err)),PULL_COMMANDS)", "setInterval(()=>singleNet('commands',pullCommands),PULL_COMMANDS)")
replace("setInterval(()=>pushSnapshot().catch(err=>console.error(err)),PUSH_SNAPSHOT);pushSnapshot().catch(err=>console.error(err));", "setInterval(()=>singleNet('snapshot',pushSnapshot),PUSH_SNAPSHOT);singleNet('snapshot',pushSnapshot);")
replace("setInterval(()=>pollMatch().catch(err=>console.error(err)),TICK_MATCH)", "setInterval(()=>singleNet('poll',pollMatch),TICK_MATCH)")
replace("const rows=await get('kuban_matches?select=id,status,snapshot,snapshot_version,result&id=eq.'+encodeURIComponent(online.currentMatch.id));const row=rows[0];if(!row)return;", """const m=online.currentMatch,gen=online.generation;const rows=await get('kuban_matches?select=id,status,snapshot_version,result,updated_at&id=eq.'+encodeURIComponent(m.id));if(gen!==online.generation||online.currentMatch!==m)return;const row=rows[0];if(!row||row.status==='abandoned'||(row.status==='running'&&Date.now()-Date.parse(row.updated_at)>30000)){exitNetwork();return}if(row.snapshot_version>online.lastSnapshot){const data=await get('kuban_matches?select=snapshot,snapshot_version&id=eq.'+encodeURIComponent(m.id));if(gen!==online.generation||online.currentMatch!==m)return;if(data[0])Object.assign(row,data[0]);}""")
replace("function sendCommand(kind,payload){if(!(online.currentMatch&&online.role==='guest'))return Promise.resolve();return rpc('kuban_submit_command',{p_match_id:online.currentMatch.id,p_kind:kind,p_payload:payload})}", "function sendCommand(kind,payload){if(!(online.currentMatch&&online.role==='guest')||exiting)return Promise.resolve();return rpc('kuban_submit_command',{p_match_id:online.currentMatch.id,p_kind:kind,p_payload:payload}).catch(e=>{if(!exiting)console.warn('[command]',e)})}")
# Avoid automatic return to a stale match after application restart.
replace("if(state.match?.status==='running'){box.append", "if(state.match?.status==='running'&&state.match.id===localStorage.getItem('kuban.online.lastMatch')&&!online.currentMatch){await leaveRemote();return}if(state.match?.status==='running'){box.append")
replace("function enterMatch(match,room,players){if(online.currentMatch&&online.currentMatch.id===match.id)return;", "function enterMatch(match,room,players){if(online.currentMatch&&online.currentMatch.id===match.id)return;localStorage.setItem('kuban.online.lastMatch',match.id);")
p.write_text(s,encoding="utf-8")
