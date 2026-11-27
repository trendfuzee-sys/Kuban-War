import sys, zipfile, pathlib, shutil
base, update, output = map(pathlib.Path, sys.argv[1:])
overlay = update / "files"
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
