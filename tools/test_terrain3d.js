'use strict';
const assert=require('node:assert/strict');
const {mesh,elevation}=require('./terrain3d.js');
for(const [w,h] of [[1800,1100],[2400,1600],[3000,2000],[3600,2400]]){
const a=mesh(w,h,44,(x,y)=>elevation(x,y,w,h,123,false));
assert.equal(a.length,Math.ceil(w/44)*Math.ceil(h/44)*30);
for(let i=0;i<a.length;i+=5){assert.ok(a[i]>=0&&a[i]<=w);assert.ok(a[i+1]>=0&&a[i+1]<=h);assert.ok(a[i+2]>=0&&a[i+2]<=20);assert.ok(a[i+3]>=0&&a[i+3]<=1);assert.ok(a[i+4]>=0&&a[i+4]<=1)}
assert.ok(a.some((v,i)=>i%5===2&&v>0));const flat=mesh(w,h,44,()=>0);assert.ok(flat.every((v,i)=>i%5!==2||v===0));
}
assert.equal(elevation(100,300,1800,1100,42,true),0);
assert.equal(elevation(100,300,1800,1100,42,false),elevation(100,300,1800,1100,42,false));
console.log('Terrain mesh tests passed');

const env=require('./environment3d.js'),actors=require('./actors3d.js'),atmo=require('./atmosphere3d.js'),{camera}=require('./camera3d.js');
const buildings=['kaz','nov','mon','bog'].flatMap((race,i)=>['h','b','s','t','w','l'].map((ty,j)=>({race,ty,r:30,x:100+i*100,y:100+j*100,team:0})));
const geom=env.build(buildings,[{x:100,y:100,t:1,s:1}],()=>0,true,1800,1100);
assert.ok(geom.length>0&&geom.length%18===0&&geom.every(Number.isFinite));
const u={id:1,race:'kaz',i:9,r:12,x:100,y:200,team:0,ph:1,mt:2,spec:{c:'#336699',w:'sabre',h:'pap'}};
const before=JSON.stringify(u),a=actors.build([u],()=>0,2),b=actors.build([u],()=>0,4);
assert.ok(a.length>0&&a.length%18===0&&a.every(Number.isFinite));assert.notDeepEqual(a,b);assert.equal(JSON.stringify(u),before);
assert.ok(atmo.water(1800,1100,[[100,200,30,40]],null,false).every(Number.isFinite));
assert.ok(atmo.shadows([u],()=>0,false).every(Number.isFinite));
for(const angle of [0,.5,1.57,3.14,4.7])for(const tilt of [.65,.8,1]){const v=camera(10,20,900,650,angle,tilt),p=v.project(400,200,17),q=v.unproject(p.x,p.y,17);assert.ok(Math.abs(q.x-400)<1e-8&&Math.abs(q.y-200)<1e-8)}
console.log('Environment, actors, atmosphere and camera tests passed');

const mission=require('./mission3d.js');
for(const theme of mission.themes){const props=[{x:100,y:100,type:theme,variant:0,name:'Резервуар'},{x:200,y:200,type:theme,variant:1,name:'Грузовик'}],obstacles=[{x:400,y:400,rx:90,ry:80}];
const before=JSON.stringify([props,obstacles]),m=mission.build(props,obstacles,theme,()=>0,()=>true);
assert.ok(m.length>0&&m.length%18===0&&m.every(Number.isFinite));
assert.equal(mission.build(props,obstacles,theme,()=>0,()=>false).length,0);
assert.equal(JSON.stringify([props,obstacles]),before)}
console.log('Fourteen campaign theme mesh tests passed');
