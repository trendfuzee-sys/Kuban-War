"""Validate portrait bundle and install only approved game assets."""
import json, re, zipfile
from pathlib import Path
KEYS=set("danil krovchinski subidey bogdan eston concepts/ataman concepts/commander concepts/outlaw concepts/dean concepts/aristocrat neighbor farmer cossack sentry fugitive worker envoy merchant rider elder student nerd arab roommate prisoner survivor".split())
def install_dialogue_art(html,update):
    html=Path(html); archive=Path(update)/"dialogue-art.zip"
    if not archive.exists():
        print("Dialogue art not supplied; keeping existing portraits")
        return False
    with zipfile.ZipFile(archive) as z:
        names=z.namelist()
        if len(names)!=len(set(names)) or sum(i.file_size for i in z.infolist())>16*1024*1024 or z.testzip():
            raise RuntimeError("Invalid dialogue portrait archive")
        m=json.loads(z.read("dialogue-art/manifest.json"))
        if set(m)!=KEYS: raise RuntimeError("Unexpected portrait roster")
        required={"dialogue-art/manifest.json"}; count=0
        for key,v in m.items():
            if v.get("placeholder_only"):
                if v.get("fallback") not in m or not m[v["fallback"]].get("portraits"): raise RuntimeError("Invalid portrait fallback")
                continue
            if "neutral" not in v.get("portraits",{}): raise RuntimeError("Missing neutral portrait")
            for emotion,path in v["portraits"].items():
                if not re.fullmatch(r"[a-z]+",emotion) or path!=f"dialogue-art/portraits/{key}/{emotion}.webp": raise RuntimeError("Invalid portrait path")
                data=z.read(path)
                if len(data)<20 or len(data)>1024*1024 or data[:4]!=b"RIFF" or data[8:12]!=b"WEBP": raise RuntimeError("Invalid portrait image")
                required.add(path);count+=1
        if count!=72 or set(names)!=required: raise RuntimeError("Unexpected portrait count or files")
        for path in sorted(required):
            dest=html.parent/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(path))
        manifest=html.parent/"dialogue-art/manifest.js"
        manifest.write_text("window.KWDialoguePortraits="+json.dumps(m,ensure_ascii=False).replace("<","\\u003c")+";\n",encoding="utf-8")
    page=html.read_text(encoding="utf-8")
    tag='<script src="dialogue-art/manifest.js"></script>'
    if tag not in page:
        if page.count("</body>")!=1: raise RuntimeError("Unexpected HTML body")
        html.write_text(page.replace("</body>",tag+"\n</body>",1),encoding="utf-8")
    print("Dialogue art installed:",count,"portraits")
    return True
