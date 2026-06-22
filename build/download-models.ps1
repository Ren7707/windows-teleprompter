$ErrorActionPreference = 'Stop'

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$targetDir = 'C:\Temp\teleprompter-models\bilingual'
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

$baseUrls = @(
  'https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20/resolve/main',
  'https://hf-mirror.com/csukuangfj/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20/resolve/main'
)

$files = @(
  'encoder-epoch-99-avg-1.onnx',
  'decoder-epoch-99-avg-1.onnx',
  'joiner-epoch-99-avg-1.onnx',
  'tokens.txt'
)

function Download-ModelFile {
  param(
    [string]$FileName,
    [string]$Target
  )

  $temp = "$Target.download"
  if (Test-Path -LiteralPath $temp) {
    Remove-Item -LiteralPath $temp -Force
  }

  foreach ($baseUrl in $baseUrls) {
    $url = "$baseUrl/$FileName?download=true"

    for ($attempt = 1; $attempt -le 3; $attempt += 1) {
      try {
        Write-Host "Downloading $FileName from $baseUrl (attempt $attempt/3)..."
        Invoke-WebRequest -Uri $url -OutFile $temp -UseBasicParsing -TimeoutSec 120
        if ((Test-Path -LiteralPath $temp) -and ((Get-Item -LiteralPath $temp).Length -gt 0)) {
          Move-Item -LiteralPath $temp -Destination $Target -Force
          return
        }
      } catch {
        if (Test-Path -LiteralPath $temp) {
          Remove-Item -LiteralPath $temp -Force
        }
        if ($attempt -eq 3) {
          Write-Warning "Failed from ${baseUrl}: $($_.Exception.Message)"
        } else {
          Start-Sleep -Seconds 2
        }
      }
    }
  }

  throw "Failed to download $FileName. Please check network access to Hugging Face or hf-mirror.com."
}

foreach ($fileName in $files) {
  $target = Join-Path $targetDir $fileName
  if (Test-Path -LiteralPath $target) {
    continue
  }

  Download-ModelFile -FileName $fileName -Target $target
}
