# input.ps1 — 模拟鼠标与键盘输入（user32 SendInput，无外部依赖，支持中文输入）
# 坐标均为屏幕物理坐标（先跑 capture.ps1 拿到截图，截图像素 = 屏幕坐标）
#
# 用法:
#   powershell -NoProfile -ExecutionPolicy Bypass -File input.ps1 cursor
#   powershell -NoProfile -ExecutionPolicy Bypass -File input.ps1 click -X 100 -Y 200
#   powershell -NoProfile -ExecutionPolicy Bypass -File input.ps1 rightclick -X 100 -Y 200
#   powershell -NoProfile -ExecutionPolicy Bypass -File input.ps1 doubleclick -X 100 -Y 200
#   powershell -NoProfile -ExecutionPolicy Bypass -File input.ps1 move -X 100 -Y 200
#   powershell -NoProfile -ExecutionPolicy Bypass -File input.ps1 drag -FromX 10 -FromY 10 -ToX 500 -ToY 300 [-Modifiers Shift]
#   powershell -NoProfile -ExecutionPolicy Bypass -File input.ps1 key -Keys "Ctrl+A"     # + 分隔的组合键
#   powershell -NoProfile -ExecutionPolicy Bypass -File input.ps1 type -Text "C:\path"
#   powershell -NoProfile -ExecutionPolicy Bypass -File input.ps1 scroll -X 800 -Y 400 -Delta -600
#
# 注意:
#   - key 与 type 会把输入发到“当前焦点”窗口；组合键名称见下方 VK 表
#   - type 遇到非 ASCII（中文等）自动改用“剪贴板粘贴”方案，会占用剪贴板；
#     若不想动剪贴板请加 -NoClipboardType（此时遇到非 ASCII 会报错）

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateSet("click", "doubleclick", "rightclick", "move", "drag", "rightdrag", "key", "type", "scroll", "cursor")]
  [string]$Action,

  [int]$X,
  [int]$Y,
  [int]$FromX,
  [int]$FromY,
  [int]$ToX,
  [int]$ToY,
  [string]$Keys = "",
  [string]$Text = "",
  [string]$Modifiers = "",          # drag 时按住: Shift / Control / Alt，逗号分隔
  [int]$Delta = 120,                # scroll 增量（正=向上滚，负=向下滚）
  [int]$DurationMs = 500,           # drag 总时长
  [int]$Steps = 30,                 # drag 插值步数
  [int]$PauseMs = 120,              # 组合键按下间隔（毫秒）
  [switch]$NoClipboardType          # type 遇非 ASCII 时报错而不是用剪贴板
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class CUInput
{
    [StructLayout(LayoutKind.Sequential)]
    public struct POINT { public int X; public int Y; }

    [StructLayout(LayoutKind.Sequential)]
    public struct INPUT
    {
        public uint type;
        public InputUnion U;
    }

    [StructLayout(LayoutKind.Explicit)]
    public struct InputUnion
    {
        [FieldOffset(0)] public MOUSEINPUT mi;
        [FieldOffset(0)] public KEYBDINPUT ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct MOUSEINPUT
    {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct KEYBDINPUT
    {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")] public static extern bool GetCursorPos(out POINT lpPoint);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
    [DllImport("user32.dll")] public static extern short VkKeyScan(char ch);
    [DllImport("user32.dll")] public static extern IntPtr GetMessageExtraInfo();

    public const uint INPUT_MOUSE = 0;
    public const uint INPUT_KEYBOARD = 1;
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP = 0x0010;
    public const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
    public const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
    public const uint MOUSEEVENTF_WHEEL = 0x0800;
    public const uint KEYEVENTF_KEYUP = 0x0002;
    public const uint KEYEVENTF_UNICODE = 0x0004;

    public static void MouseEvent(uint flags)
    {
        INPUT inp = new INPUT();
        inp.type = INPUT_MOUSE;
        inp.U.mi.dwFlags = flags;
        inp.U.mi.dwExtraInfo = GetMessageExtraInfo();
        SendInput(1, new INPUT[] { inp }, Marshal.SizeOf(typeof(INPUT)));
    }

    public static void Wheel(int delta)
    {
        INPUT inp = new INPUT();
        inp.type = INPUT_MOUSE;
        inp.U.mi.dwFlags = MOUSEEVENTF_WHEEL;
        inp.U.mi.mouseData = (uint)delta;
        inp.U.mi.dwExtraInfo = GetMessageExtraInfo();
        SendInput(1, new INPUT[] { inp }, Marshal.SizeOf(typeof(INPUT)));
    }

    public static void Key(ushort vk, bool up)
    {
        INPUT inp = new INPUT();
        inp.type = INPUT_KEYBOARD;
        inp.U.ki.wVk = vk;
        if (up) inp.U.ki.dwFlags = KEYEVENTF_KEYUP;
        inp.U.ki.dwExtraInfo = GetMessageExtraInfo();
        SendInput(1, new INPUT[] { inp }, Marshal.SizeOf(typeof(INPUT)));
    }

    public static void KeyUnicode(ushort ch, bool up)
    {
        INPUT inp = new INPUT();
        inp.type = INPUT_KEYBOARD;
        inp.U.ki.wVk = 0;
        inp.U.ki.wScan = ch;
        inp.U.ki.dwFlags = KEYEVENTF_UNICODE | (up ? KEYEVENTF_KEYUP : 0u);
        inp.U.ki.dwExtraInfo = GetMessageExtraInfo();
        SendInput(1, new INPUT[] { inp }, Marshal.SizeOf(typeof(INPUT)));
    }
}
"@

# ---------- VK 表 ----------
$script:VK = @{
  "Enter" = 0x0D; "Return" = 0x0D; "Tab" = 0x09; "Esc" = 0x1B; "Escape" = 0x1B;
  "Space" = 0x20; "Backspace" = 0x08; "Delete" = 0x2E; "Del" = 0x2E; "Insert" = 0x2D;
  "Home" = 0x24; "End" = 0x23; "PageUp" = 0x21; "PageDown" = 0x22; "PgUp" = 0x21; "PgDn" = 0x22;
  "Up" = 0x26; "Down" = 0x28; "Left" = 0x25; "Right" = 0x27;
  "Ctrl" = 0x11; "Control" = 0x11; "Alt" = 0x12; "Shift" = 0x10;
  "CapsLock" = 0x14; "PrintScreen" = 0x2C; "Pause" = 0x13; "NumLock" = 0x90; "ScrollLock" = 0x91;
  "Plus" = 0xBB; "Minus" = 0xBD; "Period" = 0xBE; "Comma" = 0xBC; "Slash" = 0xBF;
  "Backslash" = 0xDC; "Semicolon" = 0xBA; "Quote" = 0xDE; "LBracket" = 0xDB; "RBracket" = 0xDD;
  "Grave" = 0xC0; "NumpadAdd" = 0x6B; "NumpadSubtract" = 0x6D; "NumpadMultiply" = 0x6A;
  "NumpadDivide" = 0x6F; "NumpadDecimal" = 0x6E; "NumpadEnter" = 0x0D;
}
for ($i = 1; $i -le 24; $i++) { $script:VK["F$i"] = 0x6F + $i }      # F1..F24
for ($i = 0; $i -le 9; $i++)  { $script:VK["Numpad$i"] = 0x60 + $i }  # Numpad0..9

function Resolve-Vk([string]$name) {
  if ($name.Length -eq 1 -and $name -match "[A-Za-z0-9]") {
    return [int][char]::ToUpperInvariant($name[0])
  }
  if ($script:VK.ContainsKey($name)) { return $script:VK[$name] }
  throw "未知按键名: $name"
}

function Send-KeyDown([int]$vk) { [CUInput]::Key($vk, $false) }
function Send-KeyUp([int]$vk)   { [CUInput]::Key($vk, $true) }

function Send-Chord([string]$chord) {
  # 例: "Ctrl+Shift+A" / "F5" / "Alt+Left"
  # PS 5.1 兼容（2026-08-05 修复）：数组化后用 .Length；反转用索引循环（Select-Object -Reverse 是 PS7 专属）
  $parts = @($chord -split "\+" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  if ($parts.Length -eq 0) { throw "空组合键" }
  $vks = @($parts | ForEach-Object { Resolve-Vk $_ })
  $mods = @($vks | Where-Object { $_ -in @(0x10, 0x11, 0x12) })
  $rest = @($vks | Where-Object { $_ -notin @(0x10, 0x11, 0x12) })
  foreach ($m in $mods) { Send-KeyDown $m; Start-Sleep -Milliseconds $PauseMs }
  foreach ($k in $rest) { Send-KeyDown $k; Start-Sleep -Milliseconds $PauseMs }
  for ($i = $rest.Length - 1; $i -ge 0; $i--) { Send-KeyUp $rest[$i]; Start-Sleep -Milliseconds $PauseMs }
  for ($i = $mods.Length - 1; $i -ge 0; $i--) { Send-KeyUp $mods[$i]; Start-Sleep -Milliseconds $PauseMs }
}

function Send-Type([string]$text) {
  if ($text -match "[^\x20-\x7E]") {
    if ($NoClipboardType) { throw "文本包含非 ASCII 字符，且已禁用剪贴板方案: $text" }
    Write-Warning "type: 文本含非 ASCII 字符，使用剪贴板粘贴方案（会占用剪贴板）"
    Set-Clipboard -Value $text
    Send-Chord "Ctrl+V"
    Start-Sleep -Milliseconds 300
    return
  }
  # Unicode 直发：绕过键盘布局/IME/CapsLock（2026-08-05 修复）
  foreach ($ch in $text.ToCharArray()) {
    [CUInput]::KeyUnicode([uint16]$ch, $false)
    [CUInput]::KeyUnicode([uint16]$ch, $true)
    Start-Sleep -Milliseconds 20
  }
}

function Move-Cursor([int]$x, [int]$y) {
  if (-not [CUInput]::SetCursorPos($x, $y)) { throw "SetCursorPos($x,$y) 失败" }
}

function Invoke-Drag([int]$fx, [int]$fy, [int]$tx, [int]$ty, [string]$button, [string]$mods) {
  $down = switch ($button) {
    "right"  { [CUInput]::MOUSEEVENTF_RIGHTDOWN }
    "middle" { [CUInput]::MOUSEEVENTF_MIDDLEDOWN }
    default  { [CUInput]::MOUSEEVENTF_LEFTDOWN }
  }
  $up = switch ($button) {
    "right"  { [CUInput]::MOUSEEVENTF_RIGHTUP }
    "middle" { [CUInput]::MOUSEEVENTF_MIDDLEUP }
    default  { [CUInput]::MOUSEEVENTF_LEFTUP }
  }
  $hold = @()
  foreach ($m in ($mods -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
    $hold += Resolve-Vk $m
  }
  Move-Cursor $fx $fy
  Start-Sleep -Milliseconds 150
  foreach ($m in $hold) { Send-KeyDown $m }
  Start-Sleep -Milliseconds 120
  [CUInput]::MouseEvent($down)
  Start-Sleep -Milliseconds 150
  $n = [Math]::Max(1, $Steps)
  for ($i = 1; $i -le $n; $i++) {
    $px = [int]($fx + ($tx - $fx) * $i / $n)
    $py = [int]($fy + ($ty - $fy) * $i / $n)
    Move-Cursor $px $py
    Start-Sleep -Milliseconds ([Math]::Max(5, [int]($DurationMs / $n)))
  }
  Start-Sleep -Milliseconds 150
  [CUInput]::MouseEvent($up)
  Start-Sleep -Milliseconds 100
  for ($i = $hold.Length - 1; $i -ge 0; $i--) { Send-KeyUp $hold[$i] }
}

# ---------- 分发 ----------
switch ($Action) {
  "cursor" {
    $p = New-Object CUInput+POINT
    [CUInput]::GetCursorPos([ref]$p) | Out-Null
    [pscustomobject]@{ x = $p.X; y = $p.Y } | ConvertTo-Json -Compress
    break
  }
  "move" {
    if (-not $PSBoundParameters.ContainsKey("X") -or -not $PSBoundParameters.ContainsKey("Y")) { throw "move 需要 -X 与 -Y" }
    Move-Cursor $X $Y
    [pscustomobject]@{ x = $X; y = $Y } | ConvertTo-Json -Compress
    break
  }
  "click" {
    if (-not $PSBoundParameters.ContainsKey("X") -or -not $PSBoundParameters.ContainsKey("Y")) { throw "click 需要 -X 与 -Y" }
    Move-Cursor $X $Y
    Start-Sleep -Milliseconds 80
    [CUInput]::MouseEvent([CUInput]::MOUSEEVENTF_LEFTDOWN)
    Start-Sleep -Milliseconds 60
    [CUInput]::MouseEvent([CUInput]::MOUSEEVENTF_LEFTUP)
    [pscustomobject]@{ x = $X; y = $Y; action = "click" } | ConvertTo-Json -Compress
    break
  }
  "doubleclick" {
    if (-not $PSBoundParameters.ContainsKey("X") -or -not $PSBoundParameters.ContainsKey("Y")) { throw "doubleclick 需要 -X 与 -Y" }
    Move-Cursor $X $Y
    Start-Sleep -Milliseconds 80
    foreach ($i in 1..2) {
      [CUInput]::MouseEvent([CUInput]::MOUSEEVENTF_LEFTDOWN)
      Start-Sleep -Milliseconds 60
      [CUInput]::MouseEvent([CUInput]::MOUSEEVENTF_LEFTUP)
      Start-Sleep -Milliseconds 80
    }
    [pscustomobject]@{ x = $X; y = $Y; action = "doubleclick" } | ConvertTo-Json -Compress
    break
  }
  "rightclick" {
    if (-not $PSBoundParameters.ContainsKey("X") -or -not $PSBoundParameters.ContainsKey("Y")) { throw "rightclick 需要 -X 与 -Y" }
    Move-Cursor $X $Y
    Start-Sleep -Milliseconds 80
    [CUInput]::MouseEvent([CUInput]::MOUSEEVENTF_RIGHTDOWN)
    Start-Sleep -Milliseconds 60
    [CUInput]::MouseEvent([CUInput]::MOUSEEVENTF_RIGHTUP)
    [pscustomobject]@{ x = $X; y = $Y; action = "rightclick" } | ConvertTo-Json -Compress
    break
  }
  "drag" {
    if (-not $PSBoundParameters.ContainsKey("FromX") -or -not $PSBoundParameters.ContainsKey("FromY") -or
        -not $PSBoundParameters.ContainsKey("ToX") -or -not $PSBoundParameters.ContainsKey("ToY")) {
      throw "drag 需要 -FromX -FromY -ToX -ToY"
    }
    Invoke-Drag $FromX $FromY $ToX $ToY "left" $Modifiers
    [pscustomobject]@{ from = @{ x = $FromX; y = $FromY }; to = @{ x = $ToX; y = $ToY }; action = "drag" } | ConvertTo-Json -Compress
    break
  }
  "rightdrag" {
    if (-not $PSBoundParameters.ContainsKey("FromX") -or -not $PSBoundParameters.ContainsKey("FromY") -or
        -not $PSBoundParameters.ContainsKey("ToX") -or -not $PSBoundParameters.ContainsKey("ToY")) {
      throw "rightdrag 需要 -FromX -FromY -ToX -ToY"
    }
    Invoke-Drag $FromX $FromY $ToX $ToY "right" $Modifiers
    [pscustomobject]@{ from = @{ x = $FromX; y = $FromY }; to = @{ x = $ToX; y = $ToY }; action = "rightdrag" } | ConvertTo-Json -Compress
    break
  }
  "key" {
    if (-not $Keys) { throw "key 需要 -Keys，例如 Ctrl+A" }
    Send-Chord $Keys
    [pscustomobject]@{ keys = $Keys; action = "key" } | ConvertTo-Json -Compress
    break
  }
  "type" {
    if (-not $Text) { throw "type 需要 -Text" }
    Send-Type $Text
    [pscustomobject]@{ action = "type" } | ConvertTo-Json -Compress
    break
  }
  "scroll" {
    if (-not $PSBoundParameters.ContainsKey("X") -or -not $PSBoundParameters.ContainsKey("Y")) { throw "scroll 需要 -X 与 -Y" }
    Move-Cursor $X $Y
    Start-Sleep -Milliseconds 100
    [CUInput]::Wheel($Delta)
    [pscustomobject]@{ x = $X; y = $Y; delta = $Delta; action = "scroll" } | ConvertTo-Json -Compress
    break
  }
}
