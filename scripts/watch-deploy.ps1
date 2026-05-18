param(
  [int]$IntervalSeconds = 2,
  [int]$DebounceSeconds = 5,
  [switch]$SkipInitialDeploy
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

$WatchEntries = @(
  "index.html",
  "admin",
  "assets",
  "cityscape",
  "data",
  "landscape",
  "life",
  "portrait",
  "src",
  "uploads"
)

function Get-TrackedFiles {
  foreach ($entry in $WatchEntries) {
    $path = Join-Path $Root $entry

    if (Test-Path -LiteralPath $path -PathType Leaf) {
      Get-Item -LiteralPath $path
      continue
    }

    if (Test-Path -LiteralPath $path -PathType Container) {
      Get-ChildItem -LiteralPath $path -Recurse -File -Force
    }
  }
}

function Get-Snapshot {
  $files = Get-TrackedFiles | Sort-Object FullName

  if (-not $files) {
    return ""
  }

  return ($files | ForEach-Object {
    "{0}|{1}|{2}" -f $_.FullName, $_.Length, $_.LastWriteTimeUtc.Ticks
  }) -join "`n"
}

function Invoke-PagesDeploy {
  $startedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Host ""
  Write-Host "[$startedAt] Local change detected. Building and deploying to Cloudflare Pages..."

  & node scripts/build-pages.js
  if ($LASTEXITCODE -ne 0) {
    throw "Build failed with exit code $LASTEXITCODE."
  }

  & npx.cmd --yes wrangler pages deploy dist --project-name=myphotography --branch=main --commit-dirty=true
  if ($LASTEXITCODE -ne 0) {
    throw "Cloudflare Pages deploy failed with exit code $LASTEXITCODE."
  }

  $finishedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Host "[$finishedAt] Deployed: https://myphotography.pages.dev"
}

function Wait-ForStableSnapshot {
  $previous = Get-Snapshot

  while ($true) {
    Start-Sleep -Seconds $DebounceSeconds
    $current = Get-Snapshot

    if ($current -eq $previous) {
      return $current
    }

    $previous = $current
  }
}

Write-Host "Watching local frontend files for automatic Cloudflare Pages deployment."
Write-Host "Project: $Root"
Write-Host "URL: https://myphotography.pages.dev"
Write-Host "Press Ctrl+C to stop."

$lastSnapshot = Get-Snapshot

if (-not $SkipInitialDeploy) {
  try {
    Invoke-PagesDeploy
    $lastSnapshot = Get-Snapshot
  } catch {
    Write-Host "Initial deploy failed: $($_.Exception.Message)"
  }
}

while ($true) {
  Start-Sleep -Seconds $IntervalSeconds
  $currentSnapshot = Get-Snapshot

  if ($currentSnapshot -eq $lastSnapshot) {
    continue
  }

  $stableSnapshot = Wait-ForStableSnapshot

  try {
    Invoke-PagesDeploy
    $lastSnapshot = Get-Snapshot
  } catch {
    Write-Host "Deploy failed: $($_.Exception.Message)"
    $lastSnapshot = $stableSnapshot
  }
}
