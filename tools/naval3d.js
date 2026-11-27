/* Naval geometry; independent of combat and collision state. */
(function(root){
'use strict';
const env=typeof module!=='undefined'&&module.exports?require('./environment3d.js'):root.KWEnvironment3D;
function build(ships,time,shield=false,phase=1){
 const output=[];
 for(const e of ships){
 const b=env.batch(),boss=e.ship==='boss',k=boss?1:.55,angle=e.sailAngle||0,c=Math.cos(angle),s=Math.sin(angle),bob=Math.sin(time*1.9+(e.id||0)*.3)*2;
 const hull=[[-90,0],[-58,-30],[65,-30],[90,0],[65,31],[-58,31]];
 const pt=(p,z,f=1)=>[p[0]*f,p[1]*f,z];
 for(let i=0;i<hull.length;i++){const a=hull[i],q=hull[(i+1)%hull.length];b.quad(pt(a,3,.78),pt(q,3,.78),pt(q,17),pt(a,17),'#34464b');b.tri([0,0,17],pt(a,17),pt(q,17),'#706d5c');b.quad(pt(a,17),pt(q,17),pt(q,21),pt(a,21),'#617976')}
 b.box(0,0,17,51,39,14,'#555f60');b.box(-4,0,31,43,33,3,'#a2a292');
 for(const a of [-55,52]){b.box(a,0,17,20,25,9,'#757d78');b.box(a-16,0,24,30,7,5,'#394b50')}
 for(const a of [-44,13,55]){b.box(a,0,20,3,3,48,'#a49d83');const glow=phase===3?'#a897b8':'#78b6b0';b.quad([a,0,66],[a-28,0,58],[a-18,0,30],[a,0,29],glow);b.quad([a,0,66],[a-28,0,58],[a-18,0,30],[a,0,29],glow)}
 if(boss){b.box(13,0,65,21,2,10,'#557a93');b.box(13,0,69,21,2,2,'#d9d4c2')}
 if(boss&&shield){for(let i=0;i<32;i++){const a=i*Math.PI/16,q=(i+1)*Math.PI/16;b.quad([Math.cos(a)*99,Math.sin(a)*43,2],[Math.cos(q)*99,Math.sin(q)*43,2],[Math.cos(q)*99,Math.sin(q)*43,5],[Math.cos(a)*99,Math.sin(a)*43,5],'#8bdcfb')}}
 const data=b.array();for(let i=0;i<data.length;i+=6){const x=data[i]*k,y=data[i+1]*k;output.push(e.x+c*x-s*y,e.y+s*x+c*y,data[i+2]*k+bob,data[i+3],data[i+4],data[i+5])}
 }
 return new Float32Array(output)
}
function sea(w,h,deck){const out=[];function rect(x,y,r,b){if(r<=x||b<=y)return;for(const p of [[x,y],[r,y],[x,b],[r,y],[r,b],[x,b]])out.push(p[0],p[1],.8,.18,.35,.46)}
 const x=deck.x-15,y=deck.y-15,r=w-deck.x+15,b=h-deck.y+15;rect(0,0,w,y);rect(0,b,w,h);rect(0,y,x,b);rect(r,y,w,b);return new Float32Array(out)}
const api={build,sea};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KWNaval3D=api;
})(typeof globalThis!=='undefined'?globalThis:this);