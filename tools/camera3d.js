/* Orthographic camera transform shared by WebGL and input projection. */
(function(root){
'use strict';
function camera(x,y,w,h,angle=0,tilt=1){const c=Math.cos(angle),s=Math.sin(angle),k=Math.max(.65,Math.min(1,tilt)),cx=x+w/2,cy=y+h/2;
 function project(a,b,z=0){const dx=a-cx,dy=b-cy;return {x:w/2+c*dx-s*dy,y:h/2+(s*dx+c*dy)*k-z*.55}}
 function unproject(a,b,z=0){const dx=a-w/2,dy=(b-h/2+z*.55)/k;return {x:cx+c*dx+s*dy,y:cy-s*dx+c*dy}}
 return {project,unproject,c,s,k,cx,cy,w,h};
}
const api={camera};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KWCamera3D=api;
})(typeof globalThis!=='undefined'?globalThis:this);