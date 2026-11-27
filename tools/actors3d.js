/* Animated low-poly actors; purely visual, no simulation writes. */
(function(root){
'use strict';
const env=typeof module!=='undefined'&&module.exports?require('./environment3d.js'):root.KWEnvironment3D;
const safe=(c,f)=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)?c:f;
function pose(e,time){const moving=time-(e.mt??-99)<.22,work=e.wk&&time-(e.wrk??-99)<.3,attack=(e.sw||0)>0;const phase=Number.isFinite(e.ph)?e.ph:time*8;return {stride:moving?Math.sin(phase):0,bob:moving?Math.abs(Math.sin(phase))*1.6:Math.sin(time*2+(e.id||0))*.35,swing:attack?Math.sin(Math.PI*Math.max(0,Math.min(1,1-e.sw/.4))):work?Math.sin(time*7)*.5+.5:0};}
function build(actors,height,time){
 const b=env.batch();
 for(const e of actors){
 const d=e.spec||{},r=Math.max(5,Math.min(32,e.r||11)),s=r/11,x=e.x,y=e.y,z=height(x,y),p=pose(e,time),f=e.fx<0?-1:1;
 const coat=safe(d.c,'#727f66'),pants=safe(d.p,'#454039'),skin=safe(d.sk,'#d4ab83'),team=e.team===0?'#64a4ca':e.team===1?'#bd5345':'#b2a46c';
 const B=(dx,dy,dz,w,l,h,c)=>b.box(x+dx*s*f,y+dy*s,z+dz*s,w*s,l*s,h*s,c);
 const C=(dx,dy,dz,rad,h,c,n=6,top=0)=>b.cone(x+dx*s*f,y+dy*s,z+dz*s,rad*s,h*s,c,n,top*s);
 if(e.race==='cr'||d.a){const fur=coat;B(0,0,7+p.bob,17,8,7,fur);C(10,0,10,5,7,fur,6,3);for(const a of [-6,6])for(const k of [-1,1])B(a+p.stride*k*2,k*3,0,3,3,8,fur);continue}
 const mounted=!!d.m,base=mounted?15:0;
 if(mounted){const horse=safe(d.m,'#745539');B(0,0,8+p.bob,23,10,10,horse);B(12,0,14,7,6,12,horse);B(16,0,21,8,5,6,horse);for(const a of [-8,8])for(const k of [-1,1])B(a+p.stride*k*3,k*4,0,3,3,10,horse);B(-13,0,5,3,4,10,'#44352e');}
 const h=base+p.bob;
 for(const k of [-1,1]){B(k*3+p.stride*k*2,0,base,4,5,10,pants);B(k*3+p.stride*k*2,1,base,4.5,6,3,'#302b27')}
 B(0,0,h+10,10,7,13,coat);B(0,0,h+10,10.5,7.5,2,'#574433');B(0,3.8,h+18,5,1.2,3,team);
 C(0,0,h+23,4.4,8,skin,8,3.2);
 const hat=d.h||'';if(hat)C(0,0,h+29,5,hat==='pap'?7:4,hat==='helm'?'#777f83':hat==='straw'?'#c2a265':coat,8,hat==='helm'?2:4.2);
 B(-6,0,h+12+p.stride*2,4,4,10,coat);B(6+p.swing*4,0,h+12-p.stride*2+p.swing*5,4,4,10,coat);
 const weapon=d.w||'';if(weapon&&weapon!=='none'){const wx=8+p.swing*5,wz=h+11+p.swing*8;B(wx,0,wz,2.4,2.4,weapon==='staff'||weapon==='spear'?23:15,weapon==='bottle'?'#54835e':weapon==='club'?'#79573c':'#b7b9b3');if(weapon==='pick')B(wx,0,wz+13,11,3,3,'#a5a9a5');if(weapon==='bow')B(wx+3,0,wz+2,2,2,13,'#a07844')}
 if(e.i===9||e.livingBoss||e.boardingHuman){B(0,-4,h+10,12,2,14,team);C(0,0,h+33,3,3,'#d1af61',6,1)}
 }
 return b.array();
}
const api={pose,build};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KWActors3D=api;
})(typeof globalThis!=='undefined'?globalThis:this);