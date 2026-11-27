/* Visual-only water and projected contact shadows. */
(function(root){
'use strict';
function light(time,night,inside){const v=inside?.60:night?.48:1;return [v*(night?.76:1),v*(night?.86:.97),v*(night?1.13:.88)]}
function water(w,h,ponds,river,sea){const a=[];const vertex=(x,y)=>a.push(x,y,.8,.24,.43,.53);function tri(p,q,r){for(const v of [p,q,r])vertex(...v)}function quad(p,q,r,s){tri(p,q,r);tri(p,r,s)}
if(sea){quad([0,0],[w,0],[w,h],[0,h]);return new Float32Array(a)}
for(const [x,y,rx,ry] of ponds){for(let j=0;j<40;j++){const p=j*Math.PI/20,q=(j+1)*Math.PI/20;tri([x,y],[x+Math.cos(p)*rx,y+Math.sin(p)*ry],[x+Math.cos(q)*rx,y+Math.sin(q)*ry])}}
if(river){for(let i=1;i<river.length;i++){const [x,y]=river[i-1],[u,v]=river[i],p=x*w/1792,q=y*h/856,r=u*w/1792,s=v*h/856,d=49*h/856;quad([p,q-d],[r,s-d],[r,s+d],[p,q+d])}}
return new Float32Array(a)}
// Terrain-conforming projected shadows with a darker contact core.
function shadows(objects,height,night){
 const a=[];
 for(const e of objects){
  const r=Math.max(3,Math.min(70,e.r||12)),building=e.k==='b';
  const rings=night?[[.18,.12,1.05,.65,.10]]:[[.55,.34,building?1.55:1.28,.75,.13],[.12,.08,.78,.49,.075]];
  for(const [dx,dy,rx,ry,c] of rings){
   const x=e.x+r*dx,y=e.y+r*dy;
   for(let i=0;i<16;i++){
    const p=i*Math.PI/8,q=(i+1)*Math.PI/8;
    for(const [u,v] of [[x,y],[x+Math.cos(p)*r*rx,y+Math.sin(p)*r*ry],[x+Math.cos(q)*r*rx,y+Math.sin(q)*r*ry]])a.push(u,v,height(u,v)+.24,c,c*1.12,c*.86);
   }
  }
 }
 return new Float32Array(a)
}
const api={light,water,shadows};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KWAtmosphere3D=api;
})(typeof globalThis!=='undefined'?globalThis:this);