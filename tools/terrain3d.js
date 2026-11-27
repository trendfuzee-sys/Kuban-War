/* KW 3D terrain foundation — no external runtime dependencies. */
(function(root){
'use strict';
function mesh(w,h,step,height){
 const nx=Math.ceil(w/step),ny=Math.ceil(h/step),out=new Float32Array(nx*ny*6*5);let n=0;
 function vertex(i,j){const x=i*w/nx,y=j*h/ny;out[n++]=x;out[n++]=y;out[n++]=height(x,y);out[n++]=x/w;out[n++]=y/h}
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){vertex(i,j);vertex(i+1,j);vertex(i,j+1);vertex(i+1,j);vertex(i+1,j+1);vertex(i,j+1)}
 return out;
}
function elevation(x,y,w,h,seed,flat){
 if(flat)return 0;
 const a=seed%997*.013;
 return Math.max(0,7+5*Math.sin(x/135+a)*Math.cos(y/171-a)+4*Math.sin((x+y)/251+a)+3*Math.cos(y/86+a));
}
function create(){
 const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,depth:true});
 if(!gl)throw Error('WebGL unavailable');
 const vs='attribute vec3 p;attribute vec2 uv;uniform vec2 origin,extent;varying vec2 v;varying vec3 world;void main(){v=uv;world=p;vec2 q=(p.xy-origin)/extent;gl_Position=vec4(q.x*2.0-1.0,1.0-q.y*2.0+p.z/extent.y*1.1,clamp(-p.z/100.0, -0.9,0.9),1.0);}';
 const fs='precision mediump float;uniform sampler2D tex;varying vec2 v;varying vec3 world;void main(){vec3 c=texture2D(tex,v).rgb;float s=0.93+world.z*0.006;gl_FragColor=vec4(c*s,1.0);}';
 function shader(type,source){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh}
 const program=gl.createProgram();const a=shader(gl.VERTEX_SHADER,vs),b=shader(gl.FRAGMENT_SHADER,fs);gl.attachShader(program,a);gl.attachShader(program,b);gl.linkProgram(program);gl.deleteShader(a);gl.deleteShader(b);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 const buffer=gl.createBuffer(),texture=gl.createTexture();let source=null,count=0,stamp='',lost=false;
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true});
 const loc={p:gl.getAttribLocation(program,'p'),uv:gl.getAttribLocation(program,'uv'),origin:gl.getUniformLocation(program,'origin'),extent:gl.getUniformLocation(program,'extent'),tex:gl.getUniformLocation(program,'tex')};
 function draw(map,x,y,w,h,pw,ph,seed,flat,mask){
 if(lost||!map||!w||!h)return null;
 const signature=[map.width,map.height,seed,flat].join(':');
 if(source!==map||signature!==stamp){
 const limit=Math.min(4096,gl.getParameter(gl.MAX_TEXTURE_SIZE)),ratio=Math.min(1,limit/Math.max(map.width,map.height));let image=map;
 if(ratio<1){image=document.createElement('canvas');image.width=Math.max(1,Math.floor(map.width*ratio));image.height=Math.max(1,Math.floor(map.height*ratio));image.getContext('2d').drawImage(map,0,0,image.width,image.height)}
 gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
 const data=mesh(map.width,map.height,44,(x,y)=>elevation(x,y,map.width,map.height,seed,flat||mask?.(x,y)));gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);count=data.length/5;source=map;stamp=signature;
 }
 const scale=Math.min(1,1920/Math.max(pw,ph));const cw=Math.max(1,Math.round(pw*scale)),ch=Math.max(1,Math.round(ph*scale));if(canvas.width!==cw)canvas.width=cw;if(canvas.height!==ch)canvas.height=ch;
 gl.viewport(0,0,cw,ch);gl.clearColor(.09,.13,.09,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(loc.p);gl.vertexAttribPointer(loc.p,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(loc.uv);gl.vertexAttribPointer(loc.uv,2,gl.FLOAT,false,20,12);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(loc.tex,0);gl.uniform2f(loc.origin,x,y);gl.uniform2f(loc.extent,w,h);gl.drawArrays(gl.TRIANGLES,0,count);return canvas;
 }
 return {draw,dispose(){gl.deleteBuffer(buffer);gl.deleteTexture(texture);gl.deleteProgram(program);lost=true}};
}
const api={mesh,elevation,create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KWTerrain3D=api;
})(typeof globalThis!=='undefined'?globalThis:this);
