$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$url = "http://127.0.0.1:5173"

Set-Location $root

if (-not (Test-Path "node_modules")) {
  npm install
}

function Test-DevServer {
  try {
    $response = Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (-not (Test-DevServer)) {
  New-Item -ItemType Directory -Force ".tmp" | Out-Null
  $dev = Start-Process -WindowStyle Hidden -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $root -PassThru
  Set-Content -Path ".tmp/dev-server.pid" -Value $dev.Id

  $ready = $false
  for ($i = 0; $i -lt 30; $i += 1) {
    Start-Sleep -Seconds 1
    if (Test-DevServer) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    throw "Vite dev server did not start at $url"
  }
}

Start-Process -FilePath "npm.cmd" -ArgumentList "run", "electron" -WorkingDirectory $root
