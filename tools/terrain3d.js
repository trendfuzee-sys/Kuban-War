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
 const vs='attribute vec3 p;attribute vec2 uv;uniform vec2 origin,extent;uniform vec3 view;varying vec2 v;varying vec3 world;void main(){v=uv;world=p;vec2 d=p.xy-origin-extent*.5;vec2 q=vec2(view.x*d.x-view.y*d.y,(view.y*d.x+view.x*d.y)*view.z)/extent+.5;gl_Position=vec4(q.x*2.0-1.0,1.0-q.y*2.0+p.z/extent.y*(1.1+1.6*(1.0-view.z)),clamp(-p.z/100.0, -0.9,0.9),1.0);}';
 const fs='precision mediump float;uniform sampler2D tex;uniform vec3 lighting;varying vec2 v;varying vec3 world;void main(){vec3 c=texture2D(tex,v).rgb;float s=0.93+world.z*0.006;gl_FragColor=vec4(c*s*lighting,1.0);}';
 function shader(type,source){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh}
 const program=gl.createProgram();const a=shader(gl.VERTEX_SHADER,vs),b=shader(gl.FRAGMENT_SHADER,fs);gl.attachShader(program,a);gl.attachShader(program,b);gl.linkProgram(program);gl.deleteShader(a);gl.deleteShader(b);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 const objectProgram=gl.createProgram();
 const oa=shader(gl.VERTEX_SHADER,'attribute vec3 p;attribute vec3 color;uniform vec2 origin,extent;uniform vec3 view;varying vec3 c;varying vec2 worldXY;void main(){c=color;worldXY=p.xy;vec2 d=p.xy-origin-extent*.5;vec2 q=vec2(view.x*d.x-view.y*d.y,(view.y*d.x+view.x*d.y)*view.z)/extent+.5;gl_Position=vec4(q.x*2.0-1.0,1.0-q.y*2.0+p.z/extent.y*(1.1+1.6*(1.0-view.z)),clamp(-p.z/100.0,-0.99,0.99),1.0);}'),ob=shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 c;varying vec2 worldXY;uniform vec3 lighting;uniform float clock,mode;void main(){vec3 col=c;float alpha=1.0;if(mode>1.5){float wave=sin(worldXY.x*.09+worldXY.y*.15+clock*2.0)*sin(worldXY.y*.19-clock*1.4);col+=vec3(.11,.15,.17)*wave+vec3(.09,.10,.08)*pow(max(0.0,wave),8.0);alpha=.88;}else if(mode>.5){alpha=.25;}gl_FragColor=vec4(col*lighting,alpha);}');
 gl.attachShader(objectProgram,oa);gl.attachShader(objectProgram,ob);gl.linkProgram(objectProgram);gl.deleteShader(oa);gl.deleteShader(ob);if(!gl.getProgramParameter(objectProgram,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(objectProgram));
 const effectBuffer=gl.createBuffer(),actorBuffer=gl.createBuffer(),objectBuffer=gl.createBuffer(),ol={p:gl.getAttribLocation(objectProgram,'p'),color:gl.getAttribLocation(objectProgram,'color'),origin:gl.getUniformLocation(objectProgram,'origin'),extent:gl.getUniformLocation(objectProgram,'extent'),view:gl.getUniformLocation(objectProgram,'view'),lighting:gl.getUniformLocation(objectProgram,'lighting'),clock:gl.getUniformLocation(objectProgram,'clock'),mode:gl.getUniformLocation(objectProgram,'mode')};let objectKey=null,objectCount=0;
 const buffer=gl.createBuffer(),texture=gl.createTexture();let source=null,count=0,stamp='',lost=false;
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true});
 const loc={p:gl.getAttribLocation(program,'p'),uv:gl.getAttribLocation(program,'uv'),origin:gl.getUniformLocation(program,'origin'),extent:gl.getUniformLocation(program,'extent'),view:gl.getUniformLocation(program,'view'),tex:gl.getUniformLocation(program,'tex'),lighting:gl.getUniformLocation(program,'lighting')};
 function draw(map,x,y,w,h,pw,ph,seed,flat,mask,environment,actors,fx={}){
 if(lost||!map||!w||!h)return null;
 const signature=[map.width,map.height,seed,flat].join(':');
 if(source!==map||signature!==stamp){
 const limit=Math.min(4096,gl.getParameter(gl.MAX_TEXTURE_SIZE)),ratio=Math.min(1,limit/Math.max(map.width,map.height));let image=map;
 if(ratio<1){image=document.createElement('canvas');image.width=Math.max(1,Math.floor(map.width*ratio));image.height=Math.max(1,Math.floor(map.height*ratio));image.getContext('2d').drawImage(map,0,0,image.width,image.height)}
 gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
 const data=mesh(map.width,map.height,44,(x,y)=>elevation(x,y,map.width,map.height,seed,flat||mask?.(x,y)));gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);count=data.length/5;source=map;stamp=signature;
 }
 const scale=Math.min(1,1920/Math.max(pw,ph));const cw=Math.max(1,Math.round(pw*scale)),ch=Math.max(1,Math.round(ph*scale));if(canvas.width!==cw)canvas.width=cw;if(canvas.height!==ch)canvas.height=ch;
 gl.viewport(0,0,cw,ch);gl.clearColor(.09,.13,.09,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(loc.p);gl.vertexAttribPointer(loc.p,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(loc.uv);gl.vertexAttribPointer(loc.uv,2,gl.FLOAT,false,20,12);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(loc.tex,0);gl.uniform3fv(loc.lighting,fx.light||[1,1,1]);gl.uniform2f(loc.origin,x,y);gl.uniform2f(loc.extent,w,h);gl.uniform3fv(loc.view,fx.view||[1,0,1]);gl.drawArrays(gl.TRIANGLES,0,count);
 function effect(data,mode){if(!data?.length)return;gl.useProgram(objectProgram);gl.uniform3fv(ol.lighting,fx.light||[1,1,1]);gl.uniform1f(ol.mode,0);gl.disableVertexAttribArray(loc.p);gl.disableVertexAttribArray(loc.uv);gl.bindBuffer(gl.ARRAY_BUFFER,effectBuffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(ol.p);gl.vertexAttribPointer(ol.p,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(ol.color);gl.vertexAttribPointer(ol.color,3,gl.FLOAT,false,24,12);gl.uniform2f(ol.origin,x,y);gl.uniform2f(ol.extent,w,h);gl.uniform3fv(ol.view,fx.view||[1,0,1]);gl.uniform3fv(ol.lighting,fx.light||[1,1,1]);gl.uniform1f(ol.clock,fx.time||0);gl.uniform1f(ol.mode,mode);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,data.length/6);gl.depthMask(true);gl.disable(gl.BLEND);gl.disableVertexAttribArray(ol.p);gl.disableVertexAttribArray(ol.color)}
 effect(fx.water,2);effect(fx.shadows,1);
 if(environment){if(objectKey!==environment){gl.bindBuffer(gl.ARRAY_BUFFER,objectBuffer);gl.bufferData(gl.ARRAY_BUFFER,environment,gl.STATIC_DRAW);objectKey=environment;objectCount=environment.length/6}
 gl.useProgram(objectProgram);gl.uniform3fv(ol.lighting,fx.light||[1,1,1]);gl.uniform1f(ol.mode,0);gl.disableVertexAttribArray(loc.p);gl.disableVertexAttribArray(loc.uv);gl.bindBuffer(gl.ARRAY_BUFFER,objectBuffer);gl.enableVertexAttribArray(ol.p);gl.vertexAttribPointer(ol.p,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(ol.color);gl.vertexAttribPointer(ol.color,3,gl.FLOAT,false,24,12);gl.uniform2f(ol.origin,x,y);gl.uniform2f(ol.extent,w,h);gl.uniform3fv(ol.view,fx.view||[1,0,1]);gl.drawArrays(gl.TRIANGLES,0,objectCount);gl.disableVertexAttribArray(ol.p);gl.disableVertexAttribArray(ol.color)}
 if(actors?.length){gl.useProgram(objectProgram);gl.uniform3fv(ol.lighting,fx.light||[1,1,1]);gl.uniform1f(ol.mode,0);gl.disableVertexAttribArray(loc.p);gl.disableVertexAttribArray(loc.uv);gl.bindBuffer(gl.ARRAY_BUFFER,actorBuffer);gl.bufferData(gl.ARRAY_BUFFER,actors,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(ol.p);gl.vertexAttribPointer(ol.p,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(ol.color);gl.vertexAttribPointer(ol.color,3,gl.FLOAT,false,24,12);gl.uniform2f(ol.origin,x,y);gl.uniform2f(ol.extent,w,h);gl.uniform3fv(ol.view,fx.view||[1,0,1]);gl.drawArrays(gl.TRIANGLES,0,actors.length/6);gl.disableVertexAttribArray(ol.p);gl.disableVertexAttribArray(ol.color)}
 return canvas;
 }
 return {draw,dispose(){gl.deleteBuffer(effectBuffer);gl.deleteBuffer(actorBuffer);gl.deleteBuffer(objectBuffer);gl.deleteProgram(objectProgram);gl.deleteBuffer(buffer);gl.deleteTexture(texture);gl.deleteProgram(program);lost=true}};
}
const api={mesh,elevation,create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KWTerrain3D=api;
})(typeof globalThis!=='undefined'?globalThis:this);
