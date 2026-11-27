import sys, zipfile, pathlib, shutil
base, update, output = map(pathlib.Path, sys.argv[1:])
overlay = update / "files"
import subprocess
html = overlay / 'resources/app/game/voyna_za_kuban.html'
if html.exists():
    subprocess.run([sys.executable, str(pathlib.Path(__file__).with_name('net_fix_112.py')), str(html)], check=True)
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
