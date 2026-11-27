/* Low-poly environment mesh, world coordinates, baked directional face lighting. */
(function(root){
'use strict';
const colors={kaz:['#b8a17b','#794431','#5d4332'],nov:['#77756b','#44494a','#39342e'],mon:['#d3bd91','#84623d','#63482f'],bog:['#a29e8e','#5a6873','#504841']};
function rgb(s){return [parseInt(s.slice(1,3),16)/255,parseInt(s.slice(3,5),16)/255,parseInt(s.slice(5,7),16)/255]}
function batch(){const data=[];
 function tri(a,b,c,color){const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;const light=.62+.38*Math.abs((n[0]*-.45+n[1]*-.35+n[2]*.82)/l);const col=rgb(color).map(x=>x*light);for(const p of [a,b,c])data.push(...p,...col)}
 function quad(a,b,c,d,col){tri(a,b,c,col);tri(a,c,d,col)}
 function box(x,y,z,w,d,h,col){const a=[x-w/2,y-d/2,z],b=[x+w/2,y-d/2,z],c=[x+w/2,y+d/2,z],e=[x-w/2,y+d/2,z],top=p=>[p[0],p[1],p[2]+h];quad(a,b,top(b),top(a),col);quad(b,c,top(c),top(b),col);quad(c,e,top(e),top(c),col);quad(e,a,top(a),top(e),col);quad(top(a),top(b),top(c),top(e),col)}
 function cone(x,y,z,r,h,col,segments=7,top=0){for(let i=0;i<segments;i++){const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;const p=[x+Math.cos(a)*r,y+Math.sin(a)*r,z],q=[x+Math.cos(b)*r,y+Math.sin(b)*r,z],s=[x+Math.cos(a)*top,y+Math.sin(a)*top,z+h],t=[x+Math.cos(b)*top,y+Math.sin(b)*top,z+h];quad(p,q,t,s,col);if(top)tri(s,t,[x,y,z+h],col)}}
 function roof(x,y,z,w,d,h,col){const a=[x-w/2,y-d/2,z],b=[x+w/2,y-d/2,z],c=[x+w/2,y+d/2,z],e=[x-w/2,y+d/2,z],p=[x,y-d/2,z+h],q=[x,y+d/2,z+h];quad(a,e,q,p,col);quad(b,c,q,p,col);tri(a,b,p,col);tri(e,c,q,col)}
 return {tri,quad,box,cone,roof,array:()=>new Float32Array(data)};
}
function building(b,e,z){const r=e.r||28,x=e.x,y=e.y,p=colors[e.race]||colors.kaz,h=r*(e.ty==='t'?1.9:.85),w=r*1.65,d=r*1.35;
 if(e.ty==='w'){b.box(x,y,z,r*1.8,r*.65,r*.8,p[0]);b.box(x,y,z+r*.8,r*1.85,r*.72,3,p[2]);for(let i=-2;i<=2;i++)b.box(x+i*r*.34,y,z+r*.8,r*.17,r*.72,r*.22,p[0]);return}
 if(e.race==='mon'&&e.ty!=='t'){b.cone(x,y,z,r*.85,h,p[0],10,r*.85);b.cone(x,y,z+h,r*.94,r*.65,p[1],12);for(let i=0;i<8;i++){const a=i*Math.PI/4;b.box(x+Math.cos(a)*r*.80,y+Math.sin(a)*r*.80,z+h*.14,2,2,h*.74,'#927b56')}b.cone(x,y,z+h+r*.65,2,r*.12,'#b59a62',6);b.box(x,y+r*.78,z,9,3,h*.65,p[2]);return}
 b.box(x,y,z,w,d,h,p[0]);
 b.box(x,y,z,w*1.04,d*1.04,Math.max(2,r*.12),'#625d51');
 if(e.race==='kaz'){for(const k of [-1,1]){b.box(x+k*w*.44,y+d/2+1,z,3,3,h,'#684d35');b.box(x+k*w*.44,y-d/2-1,z,3,3,h,'#684d35');}
 for(let k=1;k<5;k++)b.box(x,y+d/2+.5,z+h*k/5,w,1.2,1.1,'#938069');
 for(const k of [-1,1]){b.box(x+k*w*.31,y+d/2+1,z+h*.40,w*.18,2,h*.30,'#493e30');b.box(x+k*w*.31,y+d/2+2,z+h*.43,w*.13,1,h*.24,'#78929a');}}
 if(e.race==='nov'){for(let k=0;k<4;k++){const a=x-w*.37+k*w*.24;b.box(a,y+d/2+1,z+h*(.12+(k%2)*.14),w*.15,2,h*.21,k%2?'#4c4840':'#948d78');}b.box(x+w*.37,y+d/2+1,z+h*.5,w*.16,3,h*.20,'#302e2a');}
 if(e.race==='bog'){for(let k=1;k<3;k++)b.box(x,y+d/2+1,z+h*k/3,w,2,2,'#77766d');for(const sign of [-1,1])b.box(x+sign*w*.43,y,z,w*.08,d*1.02,h,'#817d70');}
 if(e.race==='nov'){b.box(x-w*.19,y,z+h,w*.70,d*1.08,r*.13,p[1]);b.box(x+w*.36,y-d*.19,z+h,w*.35,d*.68,r*.11,'#62594b');b.box(x-r*.35,y,z+h+r*.13,r*.18,r*.21,r*.35,p[2]);}
 else if(e.race==='bog'){b.box(x,y,z+h,w*1.08,d*1.08,r*.16,p[1]);for(let k=-1;k<=1;k++)b.box(x+k*w*.28,y+d/2+1,z+h*.45,w*.16,2,h*.2,'#536c73')}
 else {b.roof(x,y,z+h,w*1.12,d*1.12,r*.55,p[1]);b.box(x,y,z+h+r*.55,2,d*1.15,2,'#684b3b');b.box(x-w*.25,y-d*.2,z+h+r*.32,r*.15,r*.15,r*.40,'#8e7965')}
 b.box(x,y+d/2+1,z,Math.max(5,w*.22),2,h*.62,p[2]);
 // Architectural details on all visible facades.
 for(const side of [-1,1]){
  for(const k of [-1,1]){
   const xx=x+k*w*.31,yy=y+side*(d/2+1.5);
   b.box(xx,yy,z+h*.43,w*.17,2,h*.25,'#403d33');
   b.box(xx,yy+side,z+h*.46,w*.12,1,h*.19,'#76929a');
   b.box(xx,yy+side*2,z+h*.46,1,1,h*.19,p[2]);
   b.box(xx,yy+side*2,z+h*.55,w*.13,1,1,p[2]);
   b.box(x+side*(w/2+1),y+k*d*.25,z+h*.45,2,d*.20,h*.23,'#4e6469');
  }
 }
 b.box(x,y+d/2+3,z,w*.28,5,2,'#81705b');
 b.box(x,y+d/2+5,z,w*.34,5,1.3,'#62594b');
 if(e.ty==='t'){for(const k of [-1,1]){b.box(x+k*w*.42,y,z+h,w*.12,d,5,p[2]);b.box(x,y+k*d*.42,z+h,w,d*.12,5,p[2]);}}
 if(e.ty==='b'||e.ty==='s'){for(const k of [-1,1]){b.box(x+k*w*.37,y+d*.65,z,7,7,7,'#8e7351');b.box(x+k*w*.37,y+d*.65,z+7,7.5,7.5,1,'#b0986e');}}
 if(e.ty==='l'){b.box(x,y+d*.65,z,12,8,2,'#b9a98b');b.box(x,y+d*.65,z+2,3,3,10,'#ded1aa');}

 const team=e.race==='nov'?'#181818':e.team===0?'#64a4ca':e.team===1?'#bd5345':'#b2a46c';b.box(x+w*.33,y-d*.28,z+h,2,2,r*.65,'#51412d');b.box(x+w*.33+5,y-d*.28,z+h+r*.49,10,1,7,team);
}
function decor(b,o,z){const s=o.s||1,x=o.x,y=o.y;if(o.t===0||o.t===1||o.t===4){const h=(o.t===4?17:38)*s;b.cone(x,y,z,3*s,h*.65,'#654c35',6,2*s);if(o.t===1){for(let i=0;i<3;i++)b.cone(x,y,z+h*.25+i*h*.19,(15-i*3)*s,h*.55,['#355a43','#426b4c','#52764e'][i],7)}else{b.cone(x,y,z+h*.27,15*s,h*.58,'#477044',9,8*s);for(let j=0;j<4;j++){const a=j*Math.PI/2+x*.013;b.cone(x+Math.cos(a)*7*s,y+Math.sin(a)*7*s,z+h*.43,9*s,h*.38,['#3d6240','#537749','#486e40','#66844e'][j],7,4*s)}b.cone(x-3*s,y,z+h*.65,10*s,h*.44,'#64844c',9)}}else if(o.t===3){b.cone(x,y,z,10*s,9*s,'#85847c',7,5*s);b.cone(x+7*s,y-3*s,z,5*s,4*s,'#6e746b',5,2*s)}else{b.cone(x,y,z,4*s,12*s,'#6d8b45',5,1*s);b.cone(x,y,z+10*s,4*s,3*s,'#d7ad49',6)}}
function bridge(b,w,h){const x=870*w/1792,y=390*h/856,dx=86*w/1792,dy=180*h/856;b.box(x,y,0,dx,dy,4,'#a48653');for(const sign of [-1,1]){b.box(x+sign*(dx/2-3),y,4,4,dy,5,'#59422e');for(let i=0;i<5;i++)b.box(x+sign*(dx/2-3),y-dy/2+i*dy/4,4,5,5,12,'#624b32')}}
function build(objects,decors,height,river,w,h){const b=batch();for(const e of objects)building(b,e,height(e.x,e.y));for(const d of decors)decor(b,d,height(d.x,d.y));if(river)bridge(b,w,h);return b.array()}
const api={batch,build};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KWEnvironment3D=api;
})(typeof globalThis!=='undefined'?globalThis:this);