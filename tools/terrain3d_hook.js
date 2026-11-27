/* KW 3D terrain integration: no changes to simulation or network state. */
(()=>{
 let enabled=false,renderer=null,failed=false;
 try{enabled=localStorage.getItem('kw.terrain3d')==='1'}catch(_){}
 const toggle=document.createElement('button');toggle.type='button';toggle.className='b';toggle.style.cssText='position:fixed;right:12px;top:50px;z-index:8;font-size:12px;padding:5px 9px';toggle.hidden=true;
 function label(){toggle.textContent=enabled&&!failed?'Рельеф: 3D (тест)':'Рельеф: 2D'}
 label();document.body.append(toggle);
 toggle.onclick=()=>{enabled=!enabled;failed=false;if(!enabled&&renderer){renderer.dispose();renderer=null}try{localStorage.setItem('kw.terrain3d',enabled?'1':'0')}catch(_){}label()};
 const oldDraw=draw;draw=function(...args){toggle.hidden=!run||paused;return oldDraw(...args)};
 const oldMenu=menu;menu=function(...args){toggle.hidden=true;return oldMenu(...args)};
 window.KWDrawTerrain3D=function(ctx,map,x,y,w,h,sx,sy,dw,dh){
 if(!enabled||failed||!map)return false;
 try{
 renderer??=window.KWTerrain3D.create();
 const flat=mis?.ci===4||terrainBiome()==='cellar'||!!layout?.river;
 const mask=(x,y)=>PONDS.some(p=>((x-p[0])/(p[2]+28))**2+((y-p[1])/(p[3]+28))**2<1)||layout?.bases?.some(b=>Math.hypot(x-b.x,y-b.y)<160);
 const frame=renderer.draw(map,x,y,w,h,dw,dh,mapSeed||0,flat,mask);
 if(!frame)throw Error('Terrain context unavailable');
 ctx.drawImage(frame,sx,sy,dw,dh);return true;
 }catch(err){failed=true;renderer?.dispose();renderer=null;label();console.warn('[3D terrain fallback]',err);return false}
 };
})();