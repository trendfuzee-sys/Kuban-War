"""Upload generated assets to an existing draft release using authenticated gh CLI."""
import argparse,pathlib,subprocess
p=argparse.ArgumentParser();p.add_argument("tag");p.add_argument("folder",type=pathlib.Path);a=p.parse_args()
repo="trendfuzee-sys/Kuban-War"
files=sorted(a.folder.glob("*.bin"))+[a.folder/"manifest.json"]
if not files[-1].is_file(): raise SystemExit("Missing manifest")
for i in range(0,len(files),20):
    subprocess.run(["gh","release","upload",a.tag,"--repo",repo,"--clobber",*[str(f) for f in files[i:i+20]]],check=True)
print("Uploaded. Review draft and publish manually.")
