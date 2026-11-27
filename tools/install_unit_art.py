"""Validate and install the optional graphics-only unit atlas bundle."""
from pathlib import Path
import json, math, re, subprocess, zipfile

EXPECTED = {f'{r}/{typ}' for r, count in {'kaz':3,'nov':2,'mon':4,'bog':3}.items() for typ in ['worker','hero','spy','siege','legend','militia']+[f'unit_{i}' for i in range(1,count+1)]}
EXPECTED |= {f'boss/relic_{i}' for i in range(9)} | {'boss/admiral'}
EXPECTED |= {f'animal/{a}' for a in ('boar','wolf','bear','deer','hare','fox')}
EXPECTED |= {f'special/{a}' for a in ('arab','roommate','civilian','militia','guard','passage_guard','barrier_guard','risen','fog_undead','undead_pirate','risen_archer')} | {f'special/haunted_{i}' for i in range(4)}
EXPECTED |= {f'vehicle/{a}' for a in ('flagship','escort','wagon')}
SOURCE = {'unit-art/source/bake_units.py','unit-art/source/units.template.js'}

def install_unit_art(html,update,test_script=None):
    html,update=Path(html),Path(update)
    art=update/'unit-art.zip'
    if not art.exists():return False
    with zipfile.ZipFile(art) as z:
        names=z.namelist()
        if len(names)!=len(set(names)) or sum(i.file_size for i in z.infolist())>16*1024*1024 or z.testzip():
            raise RuntimeError('Invalid unit art archive')
        manifest=json.loads(z.read('unit-art/sprites.json'))
        if set(manifest)!=EXPECTED:raise RuntimeError('Unit sprite IDs do not match expected roster')
        required={'unit-art/units.js','unit-art/sprites.json'}
        for id,m in manifest.items():
            filename=id.replace('/','_')+'.webp'
            if m.get('file')!=filename or m.get('size') not in (96,128) or m.get('cols')!=6 or m.get('rows')!=4:raise RuntimeError('Invalid atlas layout: '+id)
            if not all(isinstance(m.get(k),(float,int)) and math.isfinite(m[k]) for k in ('ax','ay','scale')) or not 0<m['scale']<=3 or not -m['size']<=m['ax']<=2*m['size'] or not -m['size']<=m['ay']<=2*m['size']:raise RuntimeError('Invalid atlas anchor: '+id)
            name='unit-art/sprites/'+filename;required.add(name);data=z.read(name)
            if len(data)<30 or len(data)>1024*1024 or data[:4]!=b'RIFF' or data[8:16]!=b'WEBPVP8X':raise RuntimeError('Invalid WebP: '+id)
            w=1+int.from_bytes(data[24:27],'little');h=1+int.from_bytes(data[27:30],'little')
            if (w,h)!=(6*m['size'],4*m['size']):raise RuntimeError('Invalid atlas dimensions: '+id)
        if set(names)!=required|SOURCE:raise RuntimeError('Unexpected unit art archive entries')
        js=z.read('unit-art/units.js').decode('utf-8');embedded=re.search(r'^const meta=(.+);$',js,re.M)
        if not embedded or json.loads(embedded.group(1))!=manifest:raise RuntimeError('Runtime manifest mismatch')
        for name in sorted(required):
            dest=html.parent/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(name))
    subprocess.run(['node','--check',str(html.parent/'unit-art/units.js')],check=True)
    if test_script is None:test_script=Path(__file__).with_name('test_unit_art.js')
    subprocess.run(['node',str(test_script),str(html.parent/'unit-art')],check=True)
    page=html.read_text(encoding='utf-8')
    tag='<script src="unit-art/units.js"></script>'
    hook="if(e.kind==='cache'&&window.KWUnitArt?.paintCache(g,e)){}else "
    anchor="if(e.kind==='cache'){g.fillStyle='#725334';"
    if hook not in page:
        if page.count(anchor)!=1:raise RuntimeError('Unexpected wagon rendering anchor')
        page=page.replace(anchor,hook+anchor,1)
    if tag not in page:
        if page.count('</body>')!=1:raise RuntimeError('Unexpected HTML body')
        page=page.replace('</body>',tag+'\n</body>',1)
    html.write_text(page,encoding='utf-8')
    print('Unit art installed:',len(manifest),'atlases,',len(manifest)*24,'frames')
    return True
