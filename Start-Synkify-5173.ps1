$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BundledNode = "C:\Users\horac\Documents\Codex\2026-05-02\synkify\.tools\node-v22.15.0-win-x64\node.exe"
$Node = if (Test-Path -LiteralPath $BundledNode) { $BundledNode } else { "node" }
$Vite = Join-Path $ProjectDir "node_modules\vite\bin\vite.js"

Write-Host ""
Write-Host "Starting Synkify local preview from:" -ForegroundColor Cyan
Write-Host $ProjectDir
Write-Host ""

if (!(Test-Path -LiteralPath $Vite)) {
  Write-Host "Missing node_modules. Run npm install in this folder first." -ForegroundColor Red
  Write-Host ""
  Read-Host "Press Enter to close"
  exit 1
}

$listeners = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
foreach ($listener in $listeners) {
  try {
    Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
    Write-Host "Stopped old process on port 5173: $($listener.OwningProcess)" -ForegroundColor Yellow
  } catch {}
}

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
  } |
  Select-Object -First 1 -ExpandProperty IPAddress)

Write-Host ""
Write-Host "Local preview:" -ForegroundColor Green
Write-Host "  http://127.0.0.1:5173"
if ($lanIp) {
  Write-Host ""
  Write-Host "Phone preview on same Wi-Fi/LAN:" -ForegroundColor Green
  Write-Host "  http://$lanIp`:5173"
}
Write-Host ""
Write-Host "Keep this window open while previewing. Close it to stop the server."
Write-Host ""

Set-Location -LiteralPath $ProjectDir
& $Node $Vite --host 0.0.0.0 --port 5173 --strictPort
