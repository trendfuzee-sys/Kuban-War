/* KW 3D terrain integration: no changes to simulation or network state. */
(()=>{
 let enabled=false,renderer=null,failed=false,ready=false,cache=null,signature='',lastMap=null,waterMap=null,waterMesh=null,drawnBuildings=new Set(),drawnDecor=new Set(),drawnActors=new Set();
 window.KW3DActor=e=>ready&&drawnActors.has(e);
 window.KW3DBuilding=e=>ready&&drawnBuildings.has(e);window.KW3DDecor=e=>ready&&drawnDecor.has(e);
 try{enabled=localStorage.getItem('kw.terrain3d')==='1'}catch(_){}
 const toggle=document.createElement('button');toggle.type='button';toggle.className='b';toggle.style.cssText='position:fixed;right:12px;top:50px;z-index:8;font-size:12px;padding:5px 9px';toggle.hidden=true;
 function label(){toggle.textContent=enabled&&!failed?'Рельеф: 3D (тест)':'Рельеф: 2D'}
 label();document.body.append(toggle);
 toggle.onclick=()=>{enabled=failed||!enabled;failed=false;ready=false;if(!enabled&&renderer){renderer.dispose();renderer=null}try{localStorage.setItem('kw.terrain3d',enabled?'1':'0')}catch(_){}label()};
 const oldDraw=draw;draw=function(...args){toggle.hidden=!run||paused;return oldDraw(...args)};
 const oldMenu=menu;menu=function(...args){toggle.hidden=true;return oldMenu(...args)};
 window.KWDrawTerrain3D=function(ctx,map,x,y,w,h,sx,sy,dw,dh){
 ready=false;if(!enabled||failed||!map)return false;
 try{
 renderer??=window.KWTerrain3D.create();
 const flat=mis?.ci===4||terrainBiome()==='cellar'||!!layout?.river;
 const mask=(x,y)=>PONDS.some(p=>((x-p[0])/(p[2]+28))**2+((y-p[1])/(p[3]+28))**2<1)||layout?.bases?.some(b=>Math.hypot(x-b.x,y-b.y)<160);
 const margin=160,visible=o=>o.x>=x-margin&&o.x<=x+w+margin&&o.y>=y-margin&&o.y<=y+h+margin;
 const objects=E.filter(e=>e.k==='b'&&!e.dead&&e.pg>=1&&['h','b','s','t','w','l'].includes(e.ty)&&visible(e)&&known(e));
 const decors=DEC.filter(d=>visible(d));
 const key=objects.map(e=>[e.id,e.x,e.y,e.r,e.race,e.ty,e.team].join(',')).join(';')+'|'+decors.map(d=>[d.x,d.y,d.t,d.s].join(',')).join(';');
 if(lastMap!==map||signature!==key){cache=window.KWEnvironment3D.build(objects,decors,(a,b)=>window.KWTerrain3D.elevation(a,b,map.width,map.height,mapSeed||0,flat||mask(a,b)),!!layout?.river,map.width,map.height);signature=key;lastMap=map}
 const actors=E.filter(e=>e.k==='u'&&!e.dead&&!e.ship&&visible(e)&&seen(e)).slice(0,350);
 const actorMesh=window.KWActors3D.build(actors,(a,b)=>window.KWTerrain3D.elevation(a,b,map.width,map.height,mapSeed||0,flat||mask(a,b)),t);
 const atmosphere=window.KWAtmosphere3D;
 const height=(a,b)=>window.KWTerrain3D.elevation(a,b,map.width,map.height,mapSeed||0,flat||mask(a,b));
 if(waterMap!==map){waterMesh=atmosphere.water(map.width,map.height,PONDS,layout?.river&&typeof KW_RIVER!=='undefined'?KW_RIVER.river:null,false);waterMap=map}
 const fx={time:t,light:atmosphere.light(t,!!(ST.dn&&NIGHT),terrainBiome()==='cellar'),water:mis?.ci===4?null:waterMesh,shadows:ST.sh?atmosphere.shadows(objects.concat(actors),height,!!NIGHT):null};
 const frame=renderer.draw(map,x,y,w,h,dw,dh,mapSeed||0,flat,mask,cache,actorMesh,fx);
 if(!frame)throw Error('Terrain context unavailable');
 ctx.drawImage(frame,sx,sy,dw,dh);drawnBuildings=new Set(objects);drawnDecor=new Set(decors);drawnActors=new Set(actors);ready=true;return true;
 }catch(err){failed=true;renderer?.dispose();renderer=null;label();console.warn('[3D terrain fallback]',err);return false}
 };
})();