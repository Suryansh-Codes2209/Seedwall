# Seedwall daily wallpaper for Windows
# Downloads today's Seedwall at your main screen's size and sets it as the desktop wallpaper.
# Setup and the scheduled task: https://seedwall.suryansh.work/daily
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

Invoke-WebRequest -UseBasicParsing -Uri "https://seedwall.suryansh.work/api/daily?w=$w&h=$h&date=$date" -OutFile $file

# Fill the screen, then set it (20 = SPI_SETDESKWALLPAPER, 3 = save and tell other apps).
Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name WallpaperStyle -Value "10"
Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name TileWallpaper -Value "0"
if (-not [SeedwallNative]::SystemParametersInfo(20, 0, $file, 3)) { throw "Windows did not accept the wallpaper." }

# Keep only today's file.
Get-ChildItem -Path $dir -Filter "seedwall-*.png" | Where-Object { $_.FullName -ne $file } | Remove-Item -ErrorAction SilentlyContinue
