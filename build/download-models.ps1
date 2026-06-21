$ErrorActionPreference = 'Stop'

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$targetDir = 'C:\Temp\teleprompter-models\bilingual'
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

$baseUrl = 'https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20/resolve/main'
$files = @(
  'encoder-epoch-99-avg-1.onnx',
  'decoder-epoch-99-avg-1.onnx',
  'joiner-epoch-99-avg-1.onnx',
  'tokens.txt'
)

foreach ($fileName in $files) {
  $target = Join-Path $targetDir $fileName
  if (Test-Path -LiteralPath $target) {
    continue
  }

  $temp = "$target.download"
  if (Test-Path -LiteralPath $temp) {
    Remove-Item -LiteralPath $temp -Force
  }

  Invoke-WebRequest -Uri "$baseUrl/$fileName?download=true" -OutFile $temp -UseBasicParsing
  Move-Item -LiteralPath $temp -Destination $target
}
