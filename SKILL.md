---
name: computer-use-vision
description: >-
  让无多模态能力的 Agent 在 Windows 上"看屏幕 + 模拟鼠标键盘操作"。
# 源码出处: wimi321/windows-computer-use-skill (https://github.com/wimi321/windows-computer-use-skill)
# 原项目 name: computer-use-windows, version: 0.1.1, MIT License
# 本版本为 DSH 插件适配版，新增工具层 + 双模式支持
  通过 computer-see（截图+识图）→ computer-click / computer-type / computer-key（模拟操作）闭环。
  内置自进化应用技巧库（knowledge/）：操作前查应用技巧，快捷键优先，用后自动沉淀经验。
  适用于文件操作、UI 自动化、界面验证等场景。
---

# Computer Use Vision — Windows 识图 + 模拟操作（自进化）

> **两种使用模式：**
> - **插件模式**（推荐）：加载插件后使用 `computer-see` / `computer-click` 等专用工具。
> - **Skill 模式**（无需插件）：通过 `pwsh` 工具直接调用脚本（见底部「Skill 模式命令」）。
>
> **核心机制：用前查知识库 → 快捷键优先 → 用后自进化沉淀经验。**

## 目录结构

```
assets/
├── SKILL.md               # 本文件
├── knowledge/             # ★ 自进化应用技巧库
│   ├── INDEX.md           #   应用索引（操作前先查这里）
│   ├── REPORTS.md         #   自进化更新日志（强制报告留痕）
│   ├── _TEMPLATE.md       #   新增应用技巧的模板
│   └── apps/              #   每个应用一个文件（含快捷键表/结构树要点/坑位）
└── scripts/               # 底层脚本（由工具自动调用，无需手动执行）
    ├── see.ps1            #   截图 + 识图
    ├── capture.ps1        #   截图
    ├── vision.js          #   识图
    ├── input.ps1          #   模拟输入
    └── knowledge.ps1      #   查询应用技巧
```

## 核心工作流（每次操作必读）

### 第 0 步：查应用技巧（★ 强制）

**开始操作任何应用前，先用 `computer-knowledge` 查询：**

- `computer-knowledge action="search" query="<应用关键词>"` — 搜索相关技巧
- `computer-knowledge action="list"` — 列出所有已知应用
- `computer-knowledge action="app" query="<应用名>"` — 获取完整文档

> 有对应文件 → 按其中的快捷键/结构树要点/坑位执行，不要重复踩坑
> 没有 → 按 `knowledge/_TEMPLATE.md` 新建骨架（至少记：识别特征 + 已验证快捷键 + 坑位）

### 第 1 步：观察

- 调用 `computer-see` 截图并获取描述
- 能拿无障碍树时优先用树：元素索引比 vision 估坐标可靠

### 第 2 步：定位目标（★ 快捷键优先）

按以下顺序尝试，**不要一上来就猜坐标点**：

1. **查知识库快捷键**：`computer-knowledge` 里的快捷键表（如 `Ctrl+L` 聚焦地址栏）
2. **结构树索引点击**：无障碍树中的按钮/编辑框（有 bounds 的）
3. **通用快捷键**：`knowledge/apps/common-windows.md`（Ctrl+F 搜索、Tab 导航等）
4. **键盘导航探测**：Tab / 方向键 / Enter 逐项探测（配合 `computer-see` 验证）
5. **最后才用坐标**：`computer-see` 给坐标点按（误差 ±10px，需截图确认）

> 原则：**结构树找不到元素（或无 bounds）时，优先搜快捷键，而不是反复试坐标。**

### 第 3 步：操作

- `computer-click x=100 y=200` — 鼠标左键点击
- `computer-rightclick x=100 y=200` — 右键
- `computer-drag from_x=10 from_y=10 to_x=500 to_y=300 modifiers="Shift"` — 拖拽
- `computer-key keys="Ctrl+A"` — 键盘快捷键
- `computer-type text="C:\\path"` — 输入文字（通过剪贴板，中文友好）
- `computer-scroll x=800 y=400 delta=-600` — 滚动

> 中文输入：`computer-type` 通过剪贴板粘贴，先确认目标框已清空。

### 第 4 步：验证

- 再调 `computer-see` 确认结果；未确认前不执行下一步

### 第 5 步：自进化审查（强制）+ 强制报告（★ 必须）

**每次任务结束后（含中断/失败），强制对照触发条件审查知识库：**

- 有更新 → 先更新知识库，再输出报告
- 无更新 → 直接输出报告"无需更新"
- **禁止跳过报告；禁止默默改动知识库不告知用户**

触发条件（满足任意一条即更新）：

- 发现该应用**新的可用快捷键**（实测有效）
- 发现结构树/坐标找不到目标的**新解法**
- 踩到**新坑并解决**（记录现象 → 原因 → 解法）
- **验证了**之前"待验证"区的条目（把状态改为 ✅ 并注明日期）

更新规则：

1. 打开/创建 `knowledge/apps/<应用>.md`，按 `_TEMPLATE.md` 结构填写
2. 只记录**已验证**的事实，标注日期与验证方式
3. 更新 `knowledge/INDEX.md` 索引行
4. 有更新时，在 `knowledge/REPORTS.md` 追加日志

**强制报告格式**（任务结束时的最后输出）：

```markdown
## 自进化报告
- 任务：<本次做了什么>
- 检查范围：<本次使用/相关的 knowledge 文件>
- 触发项：新快捷键 / 新解法 / 新坑 / 验证待验证项 → 逐项 ✅/❌
- 结论：✅ 无需更新知识库
  （或 ✅ 已更新 knowledge/apps/xxx.md：<改动摘要>，已记入 REPORTS.md）
- 遗留待验证：<留给下次的项；没有则写"无">
```

## 坐标与 DPI

- **全屏截图像素 = 屏幕物理坐标**，`computer-see` 返回的坐标可直接用于 `computer-click`
- 窗口截图：输出 JSON 含 `rect`，目标坐标 = 截图像素坐标 + rect 原点
- vision 估坐标 ±10px 误差：小目标先放大确认，或优先快捷键/结构树

## 安全规则（强制）

1. 不操作：登录/认证对话框、密码管理器、系统安全/隐私设置、支付页面
2. 移动优先于删除；覆盖/替换前必须确认
3. 剪贴板保护：剪切后禁止用剪贴板型输入；粘贴前验证
4. 只做任务所需的最小操作序列
5. 不注入终端命令；不碰 Win 键组合
6. 用户中断或环境异常（锁定/弹窗）立即停止并报告

## 实战经验速查

- 键盘 Ctrl+X/Ctrl+V 注入可能不生效 → 优先工具栏按钮
- 中文输入 → `computer-type` 走剪贴板方案，先清空目标框
- 多窗口应用定位 → EnumWindows 按 pid 找最大可见窗口
- 现代资源管理器模拟点击选中/右键无效 → UIA `SelectionItemPattern.Select()` + 键盘
- 模态对话框在 UIA 顶层树里"消失" → EnumWindows 才是真相

---

## Skill 模式命令（无需插件，通过 pwsh 直接调用脚本）

> 以下命令在**未加载插件**时使用。脚本路径：`assets/scripts/`（相对于技能根目录）。
> 需要 Vision Key：设置环境变量 `VISION_API_KEY` 或使用 x-cli 密钥。

### 看屏幕

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:VISION_API_KEY=(x secret get DashScope --no-clipboard | Select-Object -Last 1); $env:VISION_MODEL='qwen-vl-max'; & powershell -NoProfile -ExecutionPolicy Bypass -File '<skill_root>/scripts/see.ps1' -Prompt '描述屏幕'"
```

### 鼠标操作

```powershell
# 左键点击
powershell -NoProfile -ExecutionPolicy Bypass -File '<skill_root>/scripts/input.ps1' click -X 100 -Y 200

# 右键
powershell -NoProfile -ExecutionPolicy Bypass -File '<skill_root>/scripts/input.ps1' rightclick -X 100 -Y 200

# 拖拽
powershell -NoProfile -ExecutionPolicy Bypass -File '<skill_root>/scripts/input.ps1' drag -FromX 10 -FromY 10 -ToX 500 -ToY 300 -Modifiers Shift

# 滚动
powershell -NoProfile -ExecutionPolicy Bypass -File '<skill_root>/scripts/input.ps1' scroll -X 800 -Y 400 -Delta -600
```

### 键盘操作

```powershell
# 快捷键
powershell -NoProfile -ExecutionPolicy Bypass -File '<skill_root>/scripts/input.ps1' key -Keys "Ctrl+A"

# 输入文字（剪贴板方案）
powershell -NoProfile -ExecutionPolicy Bypass -File '<skill_root>/scripts/input.ps1' type -Text "你好"
```

### 知识库查询

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File '<skill_root>/scripts/knowledge.ps1' -List
powershell -NoProfile -ExecutionPolicy Bypass -File '<skill_root>/scripts/knowledge.ps1' -Search "网易云"
powershell -NoProfile -ExecutionPolicy Bypass -File '<skill_root>/scripts/knowledge.ps1' -App netease-cloudmusic
```
