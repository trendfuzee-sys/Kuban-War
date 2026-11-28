"""Build a range-addressable file pack and SHA256 manifest from release ZIP."""
import hashlib, json, pathlib, shutil, sys, zipfile
archive, version, output = sys.argv[1:]
out=pathlib.Path(output);out.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(archive) as z, (out/'files.pack').open('wb') as pack:
    candidates=[n for n in z.namelist() if n.endswith('resources/app/game/voyna_za_kuban.html')]
    if len(candidates)!=1: raise ValueError('Cannot identify game root')
    root=candidates[0][:-len('resources/app/game/voyna_za_kuban.html')]
    files=[];seen=set()
    for entry in sorted(z.infolist(),key=lambda e:e.filename):
        if entry.is_dir() or not entry.filename.startswith(root): continue
        name=entry.filename[len(root):]
        if not name or any(x in ('','.','..') for x in name.split('/')) or '\\' in name or ':' in name: raise ValueError(name)
        if name.lower().endswith('.exe') and 'launcher' in name.lower(): continue
        if name.casefold() in seen: raise ValueError('Duplicate '+name)
        seen.add(name.casefold());offset=pack.tell();h=hashlib.sha256()
        with z.open(entry) as src:
            while chunk:=src.read(1024*1024): h.update(chunk);pack.write(chunk)
        files.append(dict(path=name,asset='files.pack',offset=offset,size=entry.file_size,sha256=h.hexdigest()))
    exe=next((e['path'] for e in files if '/' not in e['path'] and e['path'].lower().endswith('.exe')),None)
    if not exe: raise ValueError('Missing game executable')
    if pack.tell()>=2*1024**3: raise ValueError('Pack exceeds release asset limit')
    (out/'manifest.json').write_text(json.dumps(dict(version=version.lstrip('v'),exe=exe,files=files),ensure_ascii=False),encoding='utf-8')
    print('Manifest:',len(files),'files,',pack.tell(),'bytes, executable:',exe)
