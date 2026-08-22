# Windows 通用快捷键与注入注意

> 最后更新: 2026-08-05
> 验证方式: 实测 + 通用常识（常识项标注"通用"）

## 常用键位表

| 功能 | 快捷键 | 说明 |
|---|---|---|
| 复制/剪切/粘贴 | `Ctrl+C` / `Ctrl+X` / `Ctrl+V` | 通用；部分应用注入不可靠，见下 |
| 全选 | `Ctrl+A` | 通用；PostMessage 方式在 Electron（网易云）无效 |
| 撤销 | `Ctrl+Z` | 通用 |
| 查找/搜索 | `Ctrl+F` | 多数应用通用（网易云 PostMessage 实测有效） |
| 新建文件夹 | `Ctrl+Shift+N` | 资源管理器专用；其他应用含义不同（记事本=新建窗口） |
| 切换标签页 | `Ctrl+Tab` / `Ctrl+Shift+Tab` | 通用 |
| 关闭标签页/窗口 | `Ctrl+W` / `Alt+F4` | 通用；谨慎使用 |
| 地址栏 | `Ctrl+L` | 浏览器/资源管理器通用 |
| 后退/前进 | `Alt+Left` / `Alt+Right` | 资源管理器/浏览器通用（注入环境待实测） |
| 刷新 | `F5` | 通用 |
| 聚焦下一个元素 | `Tab` / `Shift+Tab` | 通用键盘导航 |
| 空格（激活/播放暂停） | `Space` | 部分播放器/按钮有效 |
| 回车 | `Enter` / `Return` | 通用确认 |

## 注入注意事项（实测）

- **Ctrl+X/Ctrl+V 在某些应用可能不生效**（2026-08-05 资源管理器实测：焦点在地址栏时无效）→ 优先用应用工具栏按钮；快捷键前先确认焦点
- **输入法问题**：SendInput 注入的 ASCII 按键可能被中文输入法截获 → 中文输入建议：剪贴板方案（`Set-Clipboard -Value "文本"` 后 `Ctrl+V`）、拼音，或 Electron 类应用用 PostMessage `WM_CHAR` 直发（绕过 IME，网易云已实测）
- **PostMessage 组合键部分失效**（Electron/网易云，2026-08-05 实测）：`Ctrl+F` 有效、`Ctrl+A` 无效 → 清空目标框用 `WM_CHAR` 退格(0x08)
- **`type` 已改 Unicode 直发**（2026-08-05 修复实测）：ASCII 字符经 `KEYEVENTF_UNICODE` 直发，绕过键盘布局/IME/CapsLock（大小写/数字/符号全对）；非 ASCII（中文）仍走剪贴板粘贴（`-NoClipboardType` 可禁用并报错）
- **`Ctrl+Shift+N` 应用差异**（2026-08-05 实测）：资源管理器=新建文件夹；记事本=新建窗口 → 焦点错位会误操作
- **剪贴板保护**：粘贴方案会占用/覆盖剪贴板；有剪切内容时不要用剪贴板型输入
- **Windows 键禁用**：不要用 Win 键组合（安全规则）
- 组合键语法：`input.ps1` 用 `+` 分隔（如 `Ctrl+Shift+Tab`、`Alt+Left`）

## 待验证 / 待补充

- [ ] 各应用对注入快捷键的兼容性差异表（已收集：资源管理器 Ctrl+X/V 不可靠、Electron PostMessage Ctrl+A 无效）
- [ ] `Alt+Left/Right` 在注入环境的可靠性（获取途径：实测）