(function(root){
'use strict';
const presets=[
 {pixels:960,texture:1024,step:80,actors:65,decor:0.45,detail:0,shadows:false,water:false},
 {pixels:1440,texture:2048,step:60,actors:130,decor:.75,detail:0,shadows:true,water:true},
 {pixels:1920,texture:4096,step:44,actors:250,decor:1,detail:1,shadows:true,water:true},
 {pixels:2560,texture:4096,step:32,actors:350,decor:1,detail:1,shadows:true,water:true}
];
function preset(q){return presets[Math.max(0,Math.min(3,Math.floor(Number(q)||0)))]}
function adaptive(){let factor=1,avg=16,last=0,frames=0;return {sample(now){if(last&&now-last<150){avg=avg*.94+(now-last)*.06;if(++frames%60===0){if(avg>27)factor=Math.max(.65,factor-.08);else if(avg<17.5)factor=Math.min(1,factor+.04)}}last=now;return factor},reset(){factor=1;avg=16;last=0;frames=0}}}
function choose(actors,cap,cx,cy){return actors.slice().sort((a,b)=>Number(b.i===9)-Number(a.i===9)||((a.x-cx)**2+(a.y-cy)**2)-((b.x-cx)**2+(b.y-cy)**2)||(a.id||0)-(b.id||0)).slice(0,cap)}
const api={preset,adaptive,choose};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KWQuality3D=api;
})(typeof globalThis!=='undefined'?globalThis:this);