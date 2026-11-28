@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
"%CSC%" /nologo /target:winexe /codepage:65001 /out:KubanLauncher.exe /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.Net.Http.dll /r:System.Web.Extensions.dll /optimize+ /resource:background.png,Classic.Background /resource:music.wav,Classic.Music KubanLauncher.cs
exit /b %errorlevel%
