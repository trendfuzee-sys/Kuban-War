# Kuban War — release protocol

The Windows launcher reads a manifest named `manifest.json` from the latest public GitHub Release. Each manifest describes the complete installation, not just the previous patch.

Example (illustrative, not a published release):
```json
{"version":"1.0.0","files":[{"path":"resources/app/game/voyna_za_kuban.html","asset":"game-html.bin","sha256":"<64 lowercase hex characters>","size":12345}]}
```

Each asset must be attached to the same release. The launcher compares local SHA-256 hashes, downloads changed files into a staging directory, verifies sizes and hashes, then installs with backup/rollback. The game must be closed during installation. Save data in AppData is outside the installation and must not be modified. Do not publish personal saves, credentials or assets without redistribution permission.

Release page: https://github.com/trendfuzee-sys/Kuban-War/releases

Status: repository initialized; game binaries and launcher executable are not published yet.
