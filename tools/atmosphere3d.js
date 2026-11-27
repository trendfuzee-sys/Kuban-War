/* Visual-only water and projected contact shadows. */
(function(root){
'use strict';
function light(time,night,inside){const v=inside?.60:night?.48:1;return [v*(night?.76:1),v*(night?.86:.97),v*(night?1.13:.88)]}
function water(w,h,ponds,river,sea){const a=[];const vertex=(x,y)=>a.push(x,y,.8,.24,.43,.53);function tri(p,q,r){for(const v of [p,q,r])vertex(...v)}function quad(p,q,r,s){tri(p,q,r);tri(p,r,s)}
if(sea){quad([0,0],[w,0],[w,h],[0,h]);return new Float32Array(a)}
for(const [x,y,rx,ry] of ponds){for(let j=0;j<40;j++){const p=j*Math.PI/20,q=(j+1)*Math.PI/20;tri([x,y],[x+Math.cos(p)*rx,y+Math.sin(p)*ry],[x+Math.cos(q)*rx,y+Math.sin(q)*ry])}}
if(river){for(let i=1;i<river.length;i++){const [x,y]=river[i-1],[u,v]=river[i],p=x*w/1792,q=y*h/856,r=u*w/1792,s=v*h/856,d=49*h/856;quad([p,q-d],[r,s-d],[r,s+d],[p,q+d])}}
return new Float32Array(a)}
function shadows(objects,height,night){const a=[];for(const e of objects){const r=Math.max(3,Math.min(70,e.r||12)),x=e.x+r*.38,y=e.y+r*.22,z=height(x,y)+.18;for(let i=0;i<12;i++){const p=i*Math.PI/6,q=(i+1)*Math.PI/6;for(const [u,v] of [[x,y],[x+Math.cos(p)*r*1.25,y+Math.sin(p)*r*.65],[x+Math.cos(q)*r*1.25,y+Math.sin(q)*r*.65]])a.push(u,v,z,.09,.11,.08)}}return new Float32Array(a)}
const api={light,water,shadows};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KWAtmosphere3D=api;
})(typeof globalThis!=='undefined'?globalThis:this);