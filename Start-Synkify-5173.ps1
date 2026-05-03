$ErrorActionPreference = "Stop"

$ProjectArg = if ($args.Length -gt 0) { Resolve-Path -LiteralPath $args[0] | Select-Object -ExpandProperty Path } else { $null }
$ProjectDir = if ($ProjectArg) { $ProjectArg } else { Split-Path -Parent $MyInvocation.MyCommand.Path }

function Find-ViteCli {
  param([string]$Root)

  $candidate = Join-Path $Root "node_modules\vite\bin\vite.js"
  if (Test-Path -LiteralPath $candidate) {
    return $candidate
  }

  Get-ChildItem -Path $Root -Filter vite.js -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match "\\node_modules\\vite\\bin\\vite\.js$" } |
    Select-Object -First 1 |
    ForEach-Object { $_.FullName }
}

function Find-NodeExe {
  param([string]$Root)

  $paths = @()

  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCmd) {
    $paths += $nodeCmd.Source
  }

  $searchRoots = @($Root)
  $parent = Split-Path -Parent $Root
  while ($parent -and $searchRoots.Count -lt 6) {
    $searchRoots += $parent
    $parent = Split-Path -Parent $parent
  }

  foreach ($base in $searchRoots) {
    $toolDirs = Get-ChildItem -Path $base -Directory -Filter ".tools" -Recurse -ErrorAction SilentlyContinue
    foreach ($dir in $toolDirs) {
      $exe = Join-Path $dir.FullName "node.exe"
      if (Test-Path -LiteralPath $exe) {
        $paths += $exe
      }
    }
  }

  foreach ($path in $paths | Select-Object -Unique) {
    if (Test-Path -LiteralPath $path) {
      return $path
    }
  }

  return $null
}

$Node = Find-NodeExe -Root $ProjectDir
if (-not $Node) {
  $Node = "node"
}
$Vite = Find-ViteCli -Root $ProjectDir

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
