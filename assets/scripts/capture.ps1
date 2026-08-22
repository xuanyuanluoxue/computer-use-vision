# capture.ps1 — 截图（全屏 / 主屏 / 指定窗口），无外部依赖
# 输出一行 JSON: {"file":..., "rect":{"x","y","w","h"}, "screen":{"w","h"}, "dpiAware":true}
# 用途: 截图后交给 vision.js 识图；PNG 像素坐标 = 屏幕物理坐标（DPI 感知后）
#
# 用法:
#   powershell -NoProfile -ExecutionPolicy Bypass -File capture.ps1 -Out shot.png
#   powershell -NoProfile -ExecutionPolicy Bypass -File capture.ps1 -Out shot.png -WindowTitle "文件资源管理器" -DelayMs 1000

[CmdletBinding()]
param(
  [string]$Out = "screenshot.png",
  [string]$WindowTitle = "",          # 非空时截取匹配标题的窗口
  [switch]$Primary,                   # 仅主屏（默认行为）
  [switch]$All,                       # 全部虚拟屏幕
  [switch]$NoActivate,                # 截窗口前不尝试前置该窗口
  [int]$DelayMs = 0                   # 截图前等待（毫秒）
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class CUCapture
{
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }

    [DllImport("user32.dll")]
    public static extern bool SetProcessDPIAware();

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumProc cb, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder sb, int max);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);

    // 按标题查找可见顶层窗口（2026-08-05 修复：Get-Process.MainWindowTitle 在多窗口应用下不可靠）
    public static IntPtr FindWindowByTitle(string part, uint procId)
    {
        IntPtr found = IntPtr.Zero;
        EnumWindows((h, l) =>
        {
            if (found != IntPtr.Zero) return false;
            if (!IsWindowVisible(h)) return true;
            if (procId != 0)
            {
                uint pid; GetWindowThreadProcessId(h, out pid);
                if (pid != procId) return true;
            }
            var sb = new System.Text.StringBuilder(512);
            GetWindowText(h, sb, 512);
            if (sb.ToString().IndexOf(part, StringComparison.OrdinalIgnoreCase) >= 0)
            {
                found = h;
                return false;
            }
            return true;
        }, IntPtr.Zero);
        return found;
    }
}
"@

# DPI 感知: 让坐标/尺寸使用物理像素，与截图像素一一对应
[CUCapture]::SetProcessDPIAware() | Out-Null

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

if ($DelayMs -gt 0) { Start-Sleep -Milliseconds $DelayMs }

$rect = $null
$origin = @{ x = 0; y = 0 }

if ($WindowTitle) {
  $hWnd = [CUCapture]::FindWindowByTitle($WindowTitle, 0)
  if ($hWnd -eq [IntPtr]::Zero) { throw "未找到标题包含 '$WindowTitle' 的可见窗口" }
  if (-not $NoActivate) { [CUCapture]::SetForegroundWindow($hWnd) | Out-Null; Start-Sleep -Milliseconds 400 }
  $r = New-Object CUCapture+RECT
  if (-not [CUCapture]::GetWindowRect($hWnd, [ref]$r)) { throw "GetWindowRect 失败" }
  $origin.x = $r.Left; $origin.y = $r.Top
  $rect = @{ x = $r.Left; y = $r.Top; w = $r.Right - $r.Left; h = $r.Bottom - $r.Top }
} elseif ($All) {
  $vs = [System.Windows.Forms.SystemInformation]::VirtualScreen
  $origin.x = $vs.X; $origin.y = $vs.Y
  $rect = @{ x = $vs.X; y = $vs.Y; w = $vs.Width; h = $vs.Height }
} else {
  $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $rect = @{ x = $b.X; y = $b.Y; w = $b.Width; h = $b.Height }
}

if ($rect.w -le 0 -or $rect.h -le 0) { throw "无效的截图区域: $($rect | ConvertTo-Json -Compress)" }

$bmp = New-Object System.Drawing.Bitmap($rect.w, $rect.h)
try {
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  try {
    $g.CopyFromScreen($rect.x, $rect.y, 0, 0, $bmp.Size)
  } finally { $g.Dispose() }
  $outPath = [System.IO.Path]::GetFullPath($Out)
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally { $bmp.Dispose() }

[pscustomobject]@{
  file   = $outPath
  rect   = $rect
  screen = @{ w = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width; h = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height }
  dpiAware = $true
} | ConvertTo-Json -Compress
