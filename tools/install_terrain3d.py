from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding="utf-8")
if 'KW_TERRAIN_130' in s:sys.exit(0)
a="if(TR)g.drawImage(TR,cam.x,cam.y,W/Z,H/Z,sx,sy,W,H);"
if s.count(a)!=1:raise RuntimeError("Missing terrain rendering anchor")
s=s.replace(a,"if(TR&&!window.KWDrawTerrain3D?.(g,TR,cam.x,cam.y,W/Z,H/Z,sx,sy,W,H))g.drawImage(TR,cam.x,cam.y,W/Z,H/Z,sx,sy,W,H);",1)
root=Path(__file__).parent
module="\n".join((root/n).read_text(encoding="utf-8") for n in ("terrain3d.js","terrain3d_hook.js"))
if s.count("</body>")!=1:raise RuntimeError("Missing body")
s=s.replace("</body>","<script>/* KW_TERRAIN_130 */\n"+module+"\n</script></body>",1)
p.write_text(s,encoding="utf-8")
