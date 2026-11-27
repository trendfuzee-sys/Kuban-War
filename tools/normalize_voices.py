"""Normalize speech assets in the final game overlay, not music or weapon SFX."""
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path, PurePosixPath

TARGET = "loudnorm=I=-19:TP=-2:LRA=7"
def digest(data):
    return hashlib.sha256(data).hexdigest()

def is_voice(rel):
    p = PurePosixPath(rel)
    parts = p.parts
    if len(parts) < 4 or parts[0] != "snd" or p.suffix.lower() not in {".mp3", ".wav", ".ogg"}:
        return False
    if parts[1] == "undead":
        return True
    return parts[1] in {"kaz", "nov", "mon", "bog"} and (
        parts[2] in {"hero", "worker", "arab", "roommate"} or parts[2].startswith("unit_")
    ) and bool(re.match(r"^(select|order|annoy|death|ability\d*|attack|spawn|ready|move|ack|voice|talk)(?:[_.-]|$)", p.name, re.I))

def normalize_voices(src, root, game):
    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg is required for voice loudness normalization")
    prefix = root + "resources/app/game/"
    marker = "voice-normalization.json"
    old = {}
    if prefix+marker in src.namelist():
        try:
            old = json.loads(src.read(prefix+marker))
        except (ValueError, UnicodeError):
            pass
    previous = old.get("files", {}) if old.get("target") == TARGET else {}
    names = {name[len(prefix):] for name in src.namelist() if name.startswith(prefix) and is_voice(name[len(prefix):])}
    names.update(p.relative_to(game).as_posix() for p in (game/"snd").rglob("*") if p.is_file() and is_voice(p.relative_to(game).as_posix()))
    if not names:
        raise RuntimeError("No character voice files found")
    manifest = {}
    changed = 0
    with tempfile.TemporaryDirectory() as temp:
        for rel in sorted(names):
            if ".." in PurePosixPath(rel).parts:
                raise RuntimeError("Unsafe voice path")
            dest = game/rel
            raw = dest.read_bytes() if dest.is_file() else src.read(prefix+rel)
            h = digest(raw)
            if previous.get(rel) == h:
                manifest[rel] = h
                continue
            suffix = dest.suffix.lower()
            inp = Path(temp)/("input"+suffix)
            out = Path(temp)/("output"+suffix)
            inp.write_bytes(raw)
            codec = {".wav": ["-c:a","pcm_s16le"], ".mp3": ["-c:a","libmp3lame","-q:a","2"], ".ogg": ["-c:a","libvorbis","-q:a","5"]}[suffix]
            subprocess.run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y","-i",str(inp),"-map","0:a:0","-af",TARGET,"-ar","48000",*codec,str(out)],check=True)
            result=out.read_bytes()
            if not result:
                raise RuntimeError("Empty normalized voice: "+rel)
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(result)
            manifest[rel]=digest(result)
            changed+=1
    (game/marker).write_text(json.dumps({"target":TARGET,"files":manifest},sort_keys=True),encoding="utf-8")
    print(f"Voice normalization: {changed} processed, {len(manifest)} total; target -19 LUFS, -2 dBTP")
