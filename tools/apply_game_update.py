import sys, zipfile, pathlib, shutil
base, update, output = map(pathlib.Path, sys.argv[1:])
overlay = update / "files"
import subprocess
html = overlay / 'resources/app/game/voyna_za_kuban.html'
if html.exists():
    subprocess.run([sys.executable, str(pathlib.Path(__file__).with_name('net_fix_112.py')), str(html)], check=True)
    subprocess.run([sys.executable, str(pathlib.Path(__file__).with_name('net_fix_128.py')), str(html)], check=True)
    subprocess.run(['node', str(pathlib.Path(__file__).with_name('test_net_128.js'))], check=True)
    subprocess.run(['node', str(pathlib.Path(__file__).parent.parent / 'multiplayer/test_lockstep.js')], check=True)
    subprocess.run(['node', str(pathlib.Path(__file__).with_name('test_river_map.js'))], check=True)
    # Optional campaign graphics bundle, automatically included in all later releases.
    art = update / "campaign-art.zip"
    if art.exists():
        target = html.parent / "campaign-art"
        with zipfile.ZipFile(art) as z:
            required = {"campaign-art/remaster.js"} | {
                f"campaign-art/buildings/{race}_{ty}.webp"
                for race in ("kaz","nov","mon","bog") for ty in ("h","b","s","t","w","l")
            }
            if set(z.namelist()) != required or z.testzip():
                raise RuntimeError("Invalid campaign art bundle")
            for name in sorted(required):
                data = z.read(name)
                if name.endswith(".webp") and (len(data)<20 or data[:4]!=b"RIFF" or data[8:12]!=b"WEBP"):
                    raise RuntimeError("Invalid texture: "+name)
                dest=html.parent/name
                dest.parent.mkdir(parents=True,exist_ok=True)
                dest.write_bytes(data)
        subprocess.run(["node","--check",str(target/"remaster.js")],check=True)
        page=html.read_text(encoding="utf-8")
        tag='<script src="campaign-art/remaster.js"></script>'
        if tag not in page:
            if "</body>" not in page: raise RuntimeError("Missing HTML body")
            page=page.replace("</body>",tag+"\n</body>",1)
            html.write_text(page,encoding="utf-8")
    from install_unit_art import install_unit_art
    install_unit_art(html, update)
    subprocess.run([sys.executable, str(pathlib.Path(__file__).with_name('campaign_fix_1211.py')), str(html)], check=True)
    subprocess.run(['node', str(pathlib.Path(__file__).with_name('test_terrain3d.js'))], check=True)
    subprocess.run([sys.executable, str(pathlib.Path(__file__).with_name('install_terrain3d.py')), str(html)], check=True)
    from install_dialogue_art import install_dialogue_art
    install_dialogue_art(html, update)
    import re
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html.read_text(encoding='utf-8'), re.S|re.I)
    if not scripts:
        raise RuntimeError('No game scripts')
    check = output.with_suffix('.syntax.js')
    check.write_text('\n'.join(scripts), encoding='utf-8')
    subprocess.run(['node', '--check', str(check)], check=True)
    check.unlink()
with zipfile.ZipFile(base) as src:
    names = src.namelist()
    roots = [n[:-len("resources/app/game/voyna_za_kuban.html")] for n in names if n.endswith("resources/app/game/voyna_za_kuban.html")]
    if len(roots) != 1:
        raise RuntimeError("Cannot identify unique game installation")
    root = roots[0]
    changes = {root + p.relative_to(overlay).as_posix(): p for p in overlay.rglob("*") if p.is_file()}
    if not changes:
        raise RuntimeError("No game files to update")
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as dst:
        for info in src.infolist():
            if info.filename in changes:
                continue
            with src.open(info) as inp, dst.open(info, "w") as out:
                shutil.copyfileobj(inp, out)
        for name, path in changes.items():
            dst.write(path, name)
with zipfile.ZipFile(output) as result:
    if result.testzip():
        raise RuntimeError("Invalid output ZIP")
