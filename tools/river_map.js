// Fixed multiplayer map, coordinates taken from the supplied 1792 x 856 sketch.
const KW_RIVER={bases:[[70,70],[1680,780]],ore:[[210,67],[65,193],[695,379],[992,398],[1692,698],[1535,813]],ponds:[[512,85,42,39],[856,244,39,40],[1680,330,42,41],[101,567,51,53],[891,628,49,50],[1215,784,41,44]],camps:[[1100,109],[577,759]],wagons:[[327,145],[958,90],[719,701],[1444,685]],medics:[[231,461],[1390,404]],villages:[[493,325],[1175,575]],river:[[0,856],[125,765],[320,620],[430,505],[560,490],[660,490],[765,400],[870,390],[980,298],[1100,310],[1240,250],[1385,140],[1510,135],[1640,80],[1792,0]],roads:[[[130,117],[300,165],[390,210],[630,207],[735,193],[850,151],[950,115],[1020,98],[1100,109]],[[300,165],[345,290],[290,382],[231,461]],[[630,207],[720,248],[800,294],[870,390],[925,489],[1005,550],[1045,632],[1250,687],[1400,718],[1500,758],[1600,770]],[[1045,632],[945,699],[850,729],[720,728],[577,759]],[[1400,718],[1370,620],[1404,545],[1390,404]]]};
function kwRiverY(x){const p=KW_RIVER.river;for(let i=1;i<p.length;i++)if(x<=p[i][0])return p[i-1][1]+(p[i][1]-p[i-1][1])*(x-p[i-1][0])/(p[i][0]-p[i-1][0]);return 0}
function kwRiverBlocked(x,y,r=0,w=1792,h=856){const a=x*1792/w,b=y*856/h,p=r*Math.max(1792/w,856/h);if(Math.abs(a-870)<=43-p&&b>=300&&b<=480)return false;return Math.abs(b-kwRiverY(a))<=49+p}
function kwRiverPopulate(opt){
 const X=x=>x*WW/1792,Y=y=>y*WH/856,P=([x,y])=>({x:X(x),y:Y(y)});
 E=E.filter(e=>e.team<2);IT=[];layout.flip=false;layout.vertical=false;layout.shift=0;layout.river=true;layout.obstacles=[];layout.bio=BIOMES[1];layout.routes=KW_RIVER.roads.map(r=>r.map(P));mis.gc=layout.bio.gc;mis.map='Речной мост';mis.seed=mapSeed;
 for(let side=0;side<2;side++){const b=E.find(e=>e.team===side&&e.ty==='h'),pos=P(KW_RIVER.bases[side]);Object.assign(b,pos);const us=E.filter(e=>e.team===side&&e.k==='u');us.forEach((u,i)=>{const a=side?Math.PI+0.15+i*.24:.15+i*.24;u.x=b.x+Math.cos(a)*(b.r+u.r+38);u.y=b.y+Math.sin(a)*(b.r+u.r+38);u.x=cl(u.x,30,WW-30);u.y=cl(u.y,30,WH-30);if(u.hx!=null){u.hx=u.x;u.hy=u.y}})}
 layout.bases=E.filter(e=>e.ty==='h');mis.inc=1;
 KW_RIVER.ore.forEach((p,i)=>mk({k:'m',team:2,...P(p),mh:1,gd:i===2||i===3?2600:1900,r:26,nm:'Золотая жила'}));
 PONDS=KW_RIVER.ponds.map(([x,y,rx,ry])=>[X(x),Y(y),X(rx),Y(ry)]);
 for(const p of KW_RIVER.camps){const q=P(p);camp(q.x,q.y,[2,1,1])}
 for(const p of KW_RIVER.wagons)mk({k:'s',team:2,...P(p),mh:1,r:22,nm:'Заброшенный обоз',kind:'cache',sold:{},reward:roll(1),riverSite:true});
 for(const p of KW_RIVER.medics)mk({k:'s',team:2,...P(p),mh:1,r:22,nm:'Палатка фельдшеров',kind:'healer',sold:{},stock:['sal','med','shw'],riverSite:true});
 for(const p of KW_RIVER.villages){const q=P(p);mk({k:'s',team:2,...q,mh:1,r:30,nm:'Нейтральное поселение',kind:'merchant',sold:{},stock:['kir','kas','pap','bin','per','roundshield','fieldblade','scoutcloak','compass','herb','lantern'],riverSite:true});}
 DEC=[];for(let i=0;i<Math.round(WW*WH/5700);i++){const x=mapRand()*WW,y=mapRand()*WH;if(!campaignWalkable(x,y)||E.some(e=>D(e,{x,y})<100)||Math.abs(x-X(870))<X(100))continue;DEC.push({x,y,t:Math.floor(mapRand()*5),s:.65+mapRand()*.85})}DEC.sort((a,b)=>a.y-b.y);
}
function kwRiverPaint(ctx){const X=x=>x*WW/1792,Y=y=>y*WH/856;ctx.save();ctx.scale(WW/1792,WH/856);const trace=()=>{ctx.beginPath();KW_RIVER.river.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y))};ctx.lineJoin='round';ctx.lineCap='round';// Draw the exact collision strip, not a decorative stroke with differing width.
 const p=KW_RIVER.river;ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y-49):ctx.moveTo(x,y-49));p.slice().reverse().forEach(([x,y])=>ctx.lineTo(x,y+49));ctx.closePath();ctx.fillStyle='#426b83';ctx.fill();ctx.strokeStyle='#344d4a';ctx.lineWidth=5;ctx.stroke();ctx.save();ctx.clip();ctx.strokeStyle='#88b7c633';ctx.lineWidth=2;for(let i=-40;i<=40;i+=16){ctx.beginPath();p.forEach(([x,y],j)=>j?ctx.lineTo(x,y+i):ctx.moveTo(x,y+i));ctx.stroke()}ctx.restore();
 ctx.fillStyle='#58432c';ctx.fillRect(827,300,86,180);ctx.fillStyle='#b69259';ctx.fillRect(832,300,76,180);ctx.strokeStyle='#755636';ctx.lineWidth=2;for(let y=304;y<480;y+=9){ctx.beginPath();ctx.moveTo(832,y);ctx.lineTo(908,y);ctx.stroke()}ctx.fillStyle='#493924';ctx.fillRect(827,300,5,180);ctx.fillRect(908,300,5,180);ctx.restore();
}
if(typeof module!=='undefined')module.exports={KW_RIVER,kwRiverY,kwRiverBlocked};
