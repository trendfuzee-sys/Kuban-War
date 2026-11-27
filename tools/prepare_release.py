"""Create a complete manifest and release assets from a Windows game folder or ZIP.
Usage: python tools/prepare_release.py GAME.zip 1.0.0 output
Then: gh release create v1.0.0 --repo trendfuzee-sys/Kuban-War --draft --title "PC Enhanced 1.0.0" --notes "Initial release"
Upload the generated assets using publish_release.py, then publish the draft.
"""
import argparse, hashlib, json, pathlib, re, shutil, zipfile
p=argparse.ArgumentParser()
p.add_argument("source",type=pathlib.Path); p.add_argument("version"); p.add_argument("output",type=pathlib.Path)
a=p.parse_args()
if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+",a.version): raise SystemExit("Invalid version")
if a.output.exists(): raise SystemExit("Output must not exist")
a.output.mkdir(parents=True)
exe="Война за Кубань.exe"; records=[]; seen=set()
def add(name, stream):
    path=pathlib.PurePosixPath(name)
    if path.is_absolute() or any(x in (".","..") or ":" in x or "\\" in x or x.endswith((".", " ")) for x in path.parts): raise ValueError(name)
    if name.casefold() in seen: raise ValueError("Duplicate "+name)
    seen.add(name.casefold())
    temp=a.output/"temp"; h=hashlib.sha256(); size=0
    with temp.open("wb") as f:
        while True:
            b=stream.read(1024*1024)
            if not b: break
            h.update(b); size+=len(b); f.write(b)
    digest=h.hexdigest(); asset=digest+".bin"; target=a.output/asset
    if target.exists(): temp.unlink()
    else: temp.rename(target)
    records.append(dict(path=name,asset=asset,sha256=digest,size=size))
if a.source.is_dir():
    for f in sorted(a.source.rglob("*")):
        if f.is_symlink(): raise ValueError("Symlink")
        if f.is_file():
            with f.open("rb") as s: add(f.relative_to(a.source).as_posix(),s)
else:
    with zipfile.ZipFile(a.source) as z:
        names=[i for i in z.infolist() if not i.is_dir()]
        prefix="win-unpacked/" if all(i.filename.startswith("win-unpacked/") for i in names) else ""
        for i in names:
            with z.open(i) as s: add(i.filename[len(prefix):],s)
if exe not in {e["path"] for e in records}: raise SystemExit("Game EXE missing")
if len(list(a.output.glob("*.bin")))>999: raise SystemExit("Too many release assets")
(a.output/"manifest.json").write_text(json.dumps(dict(version=a.version,exe=exe,files=records),ensure_ascii=False,indent=2),encoding="utf-8")
print(len(records),"files,",sum(e["size"] for e in records),"bytes")
