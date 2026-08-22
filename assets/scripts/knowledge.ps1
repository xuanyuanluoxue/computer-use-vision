# knowledge.ps1 — 查询自进化应用技巧库
#
# 用法:
#   powershell -NoProfile -ExecutionPolicy Bypass -File knowledge.ps1 -List
#   powershell -NoProfile -ExecutionPolicy Bypass -File knowledge.ps1 -Search "网易云"
#   powershell -NoProfile -ExecutionPolicy Bypass -File knowledge.ps1 -Search "快捷键"
#   powershell -NoProfile -ExecutionPolicy Bypass -File knowledge.ps1 -App netease-cloudmusic
#
# 返回码: 0 = 找到结果; 1 = 无结果/参数错误

[CmdletBinding()]
param(
  [string]$Search = "",   # 关键词搜索（文件名 + 内容）
  [string]$App = "",      # 显示指定应用文件（可用文件名或中文名模糊匹配）
  [switch]$List           # 列出所有应用
)

$ErrorActionPreference = "Stop"
$appsDir = Join-Path $PSScriptRoot "..\knowledge\apps"
$indexFile = Join-Path $PSScriptRoot "..\knowledge\INDEX.md"

if (-not (Test-Path $appsDir)) { Write-Error "知识库目录不存在: $appsDir"; exit 1 }

$files = Get-ChildItem -LiteralPath $appsDir -Filter *.md | Sort-Object Name

if ($List) {
  Write-Host "== 应用技巧列表 =="
  if (Test-Path $indexFile) { Get-Content -LiteralPath $indexFile }
  Write-Host ""
  Write-Host "== 文件 =="
  foreach ($f in $files) { Write-Host ("  - " + $f.BaseName) }
  exit 0
}

if ($App) {
  $hit = $files | Where-Object { $_.BaseName -like "*$App*" -or $_.Name -like "*$App*" } | Select-Object -First 1
  if (-not $hit) {
    # 内容里找中文名
    $hit = $files | Where-Object { (Select-String -LiteralPath $_.FullName -Pattern $App -Quiet) } | Select-Object -First 1
  }
  if (-not $hit) { Write-Host "未找到应用: $App"; exit 1 }
  Write-Host "== $($hit.Name) =="
  Get-Content -LiteralPath $hit.FullName
  exit 0
}

if ($Search) {
  $hits = foreach ($f in $files) {
    $m = Select-String -LiteralPath $f.FullName -Pattern $Search -Encoding UTF8 | Select-Object -First 1
    if ($m) { [pscustomobject]@{ File = $f.Name; Line = $m.LineNumber; Text = $m.Line.Trim() } }
  }
  if (-not $hits) { Write-Host "未找到包含 '$Search' 的技巧"; exit 1 }
  Write-Host "== 匹配 '$Search' =="
  $hits | Format-Table -AutoSize | Out-String -Width 200 | Write-Host
  exit 0
}

Write-Host "用法: knowledge.ps1 -List | -Search <词> | -App <应用名>"
exit 1

