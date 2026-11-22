/**
 * The snippets shown on /daily. They live here so the page and the downloadable
 * public/daily/seedwall-daily.ps1 stay identical (a test checks that).
 */
const BASE = "https://seedwall.suryansh.work";

export const SCRIPT_PATH = "/daily/seedwall-daily.ps1";

export const IOS_URL = `${BASE}/api/daily?d=iphone`;
export const IPAD_URL = `${BASE}/api/daily?d=ipad`;
export const ANDROID_URL = `${BASE}/api/daily?d=android`;

export const WINDOWS_SCRIPT = `# Seedwall daily wallpaper for Windows
# Downloads today's Seedwall at your main screen's size and sets it as the desktop wallpaper.
# Setup and the scheduled task: ${BASE}/daily
$ErrorActionPreference = "Stop"

if (-not ("SeedwallNative" -as [type])) {
  Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class SeedwallNative {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern int GetSystemMetrics(int index);
  [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool SystemParametersInfo(int action, int param, string value, int flags);
}
"@
}

# Real pixels, not the scaled size Windows reports to apps that aren't DPI aware.
[SeedwallNative]::SetProcessDPIAware() | Out-Null
$w = [SeedwallNative]::GetSystemMetrics(0)
$h = [SeedwallNative]::GetSystemMetrics(1)

# Your local date, so the wallpaper changes at your midnight.
$date = Get-Date -Format "yyyy-MM-dd"
$dir = Join-Path $env:LOCALAPPDATA "Seedwall"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$file = Join-Path $dir "seedwall-$date.png"

Invoke-WebRequest -UseBasicParsing -Uri "${BASE}/api/daily?w=$w&h=$h&date=$date" -OutFile $file

# Fill the screen, then set it (20 = SPI_SETDESKWALLPAPER, 3 = save and tell other apps).
Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name WallpaperStyle -Value "10"
Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name TileWallpaper -Value "0"
if (-not [SeedwallNative]::SystemParametersInfo(20, 0, $file, 3)) { throw "Windows did not accept the wallpaper." }

# Keep only today's file.
Get-ChildItem -Path $dir -Filter "seedwall-*.png" | Where-Object { $_.FullName -ne $file } | Remove-Item -ErrorAction SilentlyContinue
`;

export const WINDOWS_INSTALL = `mkdir "%LOCALAPPDATA%\\Seedwall"
curl.exe -L -o "%LOCALAPPDATA%\\Seedwall\\seedwall-daily.ps1" ${BASE}${SCRIPT_PATH}
powershell -NoProfile -ExecutionPolicy Bypass -File "%LOCALAPPDATA%\\Seedwall\\seedwall-daily.ps1"`;

const RUN = `powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File \\"%LOCALAPPDATA%\\Seedwall\\seedwall-daily.ps1\\"`;

export const WINDOWS_SCHEDULE = `schtasks /Create /SC DAILY /ST 00:05 /TN "Seedwall daily" /TR "${RUN}" /F`;

/** A scheduled task is skipped if the PC was off at 00:05, so also run it at sign-in (no admin needed). */
export const WINDOWS_STARTUP = `echo powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%LOCALAPPDATA%\\Seedwall\\seedwall-daily.ps1" > "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\seedwall-daily.cmd"`;

export const WINDOWS_REMOVE = `schtasks /Delete /TN "Seedwall daily" /F
del "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\seedwall-daily.cmd"
rmdir /S /Q "%LOCALAPPDATA%\\Seedwall"`;

export const LINUX_GNOME = `5 0 * * * d=$(date +\\%F); f=$HOME/.cache/seedwall-$d.png; curl -fsSo "$f" "${BASE}/api/daily?w=2560&h=1440&date=$d" && export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus && gsettings set org.gnome.desktop.background picture-uri "file://$f" && gsettings set org.gnome.desktop.background picture-uri-dark "file://$f" && find $HOME/.cache -maxdepth 1 -name 'seedwall-*.png' ! -name "seedwall-$d.png" -delete`;

export const LINUX_FEH = `5 0 * * * curl -fsSo $HOME/.cache/seedwall.png "${BASE}/api/daily?w=2560&h=1440&date=$(date +\\%F)" && DISPLAY=:0 feh --bg-fill $HOME/.cache/seedwall.png`;
