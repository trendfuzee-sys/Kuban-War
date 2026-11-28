"""Extract only media from the pinned original release; never execute its binary."""
import hashlib, pathlib, sys, subprocess
source=pathlib.Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(source).hexdigest()=="70ea0d09690118a1d329c72e924408b3a33a0f5f010f4d041bda1112393421a3", "Original launcher hash mismatch"
out=pathlib.Path(__file__).parent
png=source[6576416:6576416+608783]
assert png.startswith(b'\x89PNG\r\n\x1a\n')
(out/'background-original.png').write_bytes(png)
(out/'music-original.mp3').write_bytes(source[7185216:])
subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(out/'background-original.png'),'-frames:v','1',str(out/'background.png')],check=True)
subprocess.run(['ffmpeg','-nostdin','-v','fatal','-y','-i',str(out/'music-original.mp3'),'-t','293','-map_metadata','-1','-vn','-ac','2','-ar','22050','-c:a','pcm_s16le',str(out/'music.wav')],check=True)
