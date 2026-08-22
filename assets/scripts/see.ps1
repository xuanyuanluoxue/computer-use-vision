# see.ps1 — 一步"看屏幕"：截图 → vision.js 识图 → 输出文字描述
#
# 用法:
#   powershell -NoProfile -ExecutionPolicy Bypass -File see.ps1 -Prompt "描述当前屏幕，并给出任务栏图标的坐标"
#   powershell -NoProfile -ExecutionPolicy Bypass -File see.ps1 -WindowTitle "文件资源管理器" -Prompt "这个窗口里有什么文件？"
#
# 提示: 需要坐标时，直接在 -Prompt 里要求模型"给出 X,Y 坐标（相对图片像素）"，
# 截图是物理像素，坐标可直接用于 input.ps1。

[CmdletBinding()]
param(
  [string]$Prompt = "请详细描述这张图片的内容。",
  [string]$Out = "see.png",
  [string]$WindowTitle = "",
  [int]$DelayMs = 0
)

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "未找到 node，请先安装 Node.js"
}

$shot = Join-Path $scriptDir $Out
$capArgs = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $scriptDir "capture.ps1"), "-Out", $shot)
if ($WindowTitle) { $capArgs += @("-WindowTitle", $WindowTitle) }
if ($DelayMs -gt 0) { $capArgs += @("-DelayMs", $DelayMs) }

$meta = & powershell.exe @capArgs
if ($LASTEXITCODE -ne 0) { throw "截图失败: $meta" }
Write-Host "[see] 截图: $($meta | ConvertFrom-Json | Select-Object -ExpandProperty file)"

& node (Join-Path $scriptDir "vision.js") $shot $Prompt
if ($LASTEXITCODE -ne 0) { throw "识图失败" }
