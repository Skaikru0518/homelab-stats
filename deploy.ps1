param(
    [string]$Server   = "dante0518@100.105.98.51",
    [string]$Image    = "homelab-stats:latest",
    [string]$Tar      = "homelab-stats.tar",
    [string]$StackDir = "/srv/stacks/homelab-stats",
    [string]$Url      = "https://homelab.tail0a79e5.ts.net:10443"
)

$ErrorActionPreference = "Stop"

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Fail($msg) { Write-Host "!!  $msg" -ForegroundColor Red; exit 1 }

# --- build ---
Step "build"
docker build -t $Image .
if ($LASTEXITCODE -ne 0) { Fail "build failed" }

# --- mentes tarba ---
Step "save"
docker save -o $Tar $Image
if ($LASTEXITCODE -ne 0) { Fail "save failed" }
$size = [math]::Round((Get-Item $Tar).Length / 1MB, 1)
Write-Host "    $Tar = $size MB"

# --- feltoltes ---
Step "upload"
scp -C $Tar "${Server}:/tmp/$Tar"
if ($LASTEXITCODE -ne 0) { Remove-Item $Tar -EA SilentlyContinue; Fail "upload failed" }

# --- betoltes + ujrainditas + takaritas ---
Step "load + restart"
ssh $Server "docker load -i /tmp/$Tar && cd $StackDir && docker compose up -d --force-recreate && rm -f /tmp/$Tar &&
docker image prune -f && docker compose ps"
if ($LASTEXITCODE -ne 0) { Remove-Item $Tar -EA SilentlyContinue; Fail "deploy failed" }

Remove-Item $Tar -EA SilentlyContinue

# --- ellenorzes ---
Step "healthcheck"
Start-Sleep -Seconds 5
try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
    Write-Host "    HTTP $($r.StatusCode)"
} catch {
    Fail "az app nem valaszol: $Url"
}

Write-Host "==> kesz: $Url" -ForegroundColor Green