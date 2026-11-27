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
