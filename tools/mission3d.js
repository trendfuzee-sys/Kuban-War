/* Mission landmarks and obstacle geometry, attached to authored map positions. */
(function(root){
'use strict';
const env=typeof module!=='undefined'&&module.exports?require('./environment3d.js'):root.KWEnvironment3D;
const themes=['village','field','city','steppe','cellar','fort','ruin','dump','factory','prison','rail','swamp','coast','flood'];
function prop(b,p,z){const x=p.x,y=p.y,v=p.variant||0,n=String(p.name||'').toLowerCase(),theme=p.type;
const B=(a,c,d,w,l,h,col)=>b.box(x+a,y+c,z+d,w,l,h,col);
const C=(a,c,d,r,h,col,top=0)=>b.cone(x+a,y+c,z+d,r,h,col,10,top);
const R=(a,c,d,w,l,h,col)=>b.roof(x+a,y+c,z+d,w,l,h,col);
if(theme==='factory'){if(v%3===0||/резервуар|насос/.test(n)){for(const a of [-23,23]){C(a,0,0,18,44,'#707a79',18);C(a,0,44,18,5,'#8e9895',12);B(a,0,49,7,7,11,'#8d775c')}B(0,0,59,48,7,7,'#98774f')}else{B(0,0,0,70,42,37,'#747b78');R(0,0,37,74,46,15,'#505955');C(25,-12,37,6,40,'#887266',5);for(let i=-1;i<=1;i++)B(i*18,22,18,11,2,10,'#344e56')}return}
if(theme==='prison'){B(0,0,0,70,40,36,'#97958a');B(0,0,36,74,44,5,'#585c59');for(let i=-2;i<=2;i++){B(i*12,21,17,9,2,12,'#242b2d');for(const j of [-3,0,3])B(i*12+j,23,17,1,1,12,'#8d8c85')}B(31,-13,36,9,9,22,'#686d68');return}
if(theme==='rail'){B(0,0,0,100,30,4,'#65503c');for(let i=-4;i<=4;i++)B(i*11,0,1,4,36,3,'#493b2c');for(const a of [-12,12])B(0,a,4,104,2,2,'#9b9b93');B(0,0,7,86,24,28,'#795b43');B(0,0,35,90,27,4,'#a89470');return}
if(theme==='city'){if(/грузовик|груз/.test(n)){B(0,0,8,66,23,21,'#64726a');B(25,0,9,20,25,24,'#596c69');B(35,0,27,2,21,7,'#8ba8aa');for(const a of [-22,22])for(const c of [-12,12])B(a,c,0,12,5,12,'#292e2d')}else{B(0,0,0,66,42,46,'#9a9488');B(0,0,46,70,46,4,'#5b5e5a');for(let a=-2;a<=2;a++)for(let d=0;d<3;d++)B(a*12,22,10+d*12,8,2,7,'#4e646a')}return}
if(theme==='cellar'){for(const a of [-30,30])B(a,0,0,13,16,42,'#696661');B(0,0,37,73,16,10,'#787269');B(0,0,0,44,3,5,'#4c443c');for(const a of [-33,33]){B(a,8,19,4,4,9,'#876438');C(a,8,28,4,9,'#f3b651')}return}
if(theme==='dump'||theme==='ruin'){for(let i=0;i<12;i++){const a=i*2.39996,r=8+(i%4)*8;B(Math.cos(a)*r,Math.sin(a)*r,0,10+i%3*3,9,5+i%5*4,['#797268','#514e45','#6b7b62'][i%3])}if(theme==='ruin'){B(-27,0,0,8,40,32,'#898277');B(0,-18,0,46,7,21,'#817568')}return}
if(theme==='fort'){B(0,0,0,70,22,13,'#6b624c');for(let i=-3;i<=3;i++)B(i*10,0,13,7,19,9,'#8f8469');for(const a of [-29,29]){B(a,0,0,15,20,30,'#706753');R(a,0,30,19,24,10,'#594b37')}return}
if(theme==='swamp'){B(0,0,0,52,15,3,'#756247');for(let i=-2;i<=2;i++){C(i*10,8,0,3,17+i*i*2,'#615a40',2);C(i*10,8,16,8,13,'#485e43')}return}
if(theme==='steppe'&&/колодец/.test(n)){C(0,0,0,17,13,'#8d8471',15);C(0,0,13,12,1,'#394746',12);for(const a of [-19,19])B(a,0,0,4,4,30,'#715638');R(0,0,30,46,24,13,'#9b8150');return}
if(theme==='field'||theme==='steppe'){C(0,0,0,26,12,'#b4a07a',25);C(0,0,12,28,23,'#9a8059');B(0,23,0,12,2,13,'#54432d');return}
B(0,0,0,56,36,25,theme==='flood'?'#777e72':'#a48c69');R(0,0,25,63,42,18,theme==='flood'?'#565c56':'#80563e');B(0,19,0,10,2,17,'#4d3e2e');for(const a of [-19,19])B(a,19,13,9,2,8,'#718589');if(theme==='coast'){for(let i=-1;i<=1;i++)B(i*12,29,0,10,10,11,'#876d4e')}
}
function build(props,obstacles,theme,height,visible){const b=env.batch();for(const p of props||[]){if(!visible(p))continue;prop(b,p,height(p.x,p.y))}
const urban=['city','cellar','factory','prison','rail','fort','ruin','dump'].includes(theme);
for(const o of obstacles||[]){if(!visible(o))continue;const count=Math.min(65,Math.max(8,Math.floor(o.rx*o.ry/700)));for(let i=0;i<count;i++){const a=i*2.399963,r=.78*Math.sqrt((i+.5)/count),x=o.x+Math.cos(a)*r*o.rx,y=o.y+Math.sin(a)*r*o.ry,z=height(x,y);if(urban){b.box(x,y,z,Math.min(25,o.rx*.22),Math.min(24,o.ry*.22),12+i%4*7,theme==='cellar'?'#4b4c50':'#77756b')}else{b.cone(x,y,z,3,18,'#63513a',6,2);b.cone(x,y,z+12,12,26,'#496343',7,3)}}}
return b.array()}
const api={build,themes};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KWMission3D=api;
})(typeof globalThis!=='undefined'?globalThis:this);