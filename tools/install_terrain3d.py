from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding="utf-8")
if 'KW_TERRAIN_130' in s:sys.exit(0)
a="if(TR)g.drawImage(TR,cam.x,cam.y,W/Z,H/Z,sx,sy,W,H);"
if s.count(a)!=1:raise RuntimeError("Missing terrain rendering anchor")
s=s.replace(a,"if(TR&&!window.KWDrawTerrain3D?.(g,TR,cam.x,cam.y,W/Z,H/Z,sx,sy,W,H))g.drawImage(TR,cam.x,cam.y,W/Z,H/Z,sx,sy,W,H);",1)
for a,b in [
 ("else if(e.k=='b'){drawB(g,e,e.x,e.y,1,{t});","else if(e.k=='b'){if(!window.KW3DBuilding?.(e))drawB(g,e,e.x,e.y,1,{t});"),
 ("if(e.k=='d')drawDec(g,e.d);else drawE(e)","if(e.k=='d'){if(!window.KW3DDecor?.(e.d))drawDec(g,e.d)}else drawE(e)")
]:
    if s.count(a)!=1:raise RuntimeError("Missing environment anchor: "+a)
    s=s.replace(a,b,1)
a="if(e.race=='cr')drawA(g,e,e.x,fy,r/(e.ci==2?20:11),P);else drawU(g,e,e.x,fy,k,P);"
if s.count(a)!=1:raise RuntimeError("Missing actor rendering anchor")
s=s.replace(a,"if(!window.KW3DActor?.(e)){"+a+"}",1)
for a,b in [["g.setTransform(S*Z,0,0,S*Z,(-cam.x+sx/Z)*S*Z,(-cam.y+sy/Z)*S*Z);const x0=cam.x-90,x1=cam.x+W/Z+90,y0=cam.y-120,y1=cam.y+H/Z+90;","window.KWCameraTransform?.(g,sx,sy);const margin=window.KWCameraMargin?.()||0,x0=cam.x-90-margin,x1=cam.x+W/Z+90+margin,y0=cam.y-120-margin,y1=cam.y+H/Z+90+margin;"],["wx=mx/Z+cam.x,wy=my/Z+cam.y,bad=blocked(wx,wy,B.r)","wp=window.KWCameraWorld(mx,my),wx=wp.x,wy=wp.y,bad=blocked(wx,wy,B.r)"],["const wx=e.offsetX/Z+cam.x,wy=e.offsetY/Z+cam.y;","const {x:wx,y:wy}=window.KWCameraWorld(e.offsetX,e.offsetY);"],["const p=pick(x1/Z+cam.x,y1/Z+cam.y);","const w=window.KWCameraWorld(x1,y1),p=pick(w.x,w.y);"],["const a=Math.min(x0,x1)/Z+cam.x,b=Math.max(x0,x1)/Z+cam.x,c=Math.min(y0,y1)/Z+cam.y,d=Math.max(y0,y1)/Z+cam.y;ns=E.filter(u=>u.k=='u'&&u.team==0&&u.x>a&&u.x<b&&u.y>c&&u.y<d);","const a=Math.min(x0,x1),b=Math.max(x0,x1),c=Math.min(y0,y1),d=Math.max(y0,y1);ns=E.filter(u=>{if(u.dead||u.k!='u'||u.team!==0)return false;const p=window.KWCameraScreen(u.x,u.y);return p.x>a&&p.x<b&&p.y>c&&p.y<d});"],["const p=pick(e.offsetX/Z+cam.x,e.offsetY/Z+cam.y);","const w=window.KWCameraWorld(e.offsetX,e.offsetY),p=pick(w.x,w.y);"],["return {x:(e.clientX-r.left)/Z+cam.x,y:(e.clientY-r.top)/Z+cam.y}","return window.KWCameraWorld(e.clientX-r.left,e.clientY-r.top)"],["const wx=sx/Z+cam.x,wy=sy/Z+cam.y;Z=cl(Z*f,mnZ(),2.2);cam.x=wx-sx/Z;cam.y=wy-sy/Z;clampC()","const p=window.KWCameraWorld(sx,sy);Z=cl(Z*f,mnZ(),2.2);const q=window.KWCameraWorld(sx,sy);cam.x+=p.x-q.x;cam.y+=p.y-q.y;clampC()"]]:
    if s.count(a)!=1:raise RuntimeError("Missing camera anchor: "+a)
    s=s.replace(a,b,1)
s=s.replace("g.setTransform(S*Z,0,0,S*Z,-cam.x*S*Z,-cam.y*S*Z)","window.KWCameraTransform(g)")
root=Path(__file__).parent
module="\n".join((root/n).read_text(encoding="utf-8") for n in ("terrain3d.js","environment3d.js","actors3d.js","atmosphere3d.js","camera3d.js","terrain3d_hook.js"))
if s.count("</body>")!=1:raise RuntimeError("Missing body")
s=s.replace("</body>","<script>/* KW_TERRAIN_130 */\n"+module+"\n</script></body>",1)
p.write_text(s,encoding="utf-8")
