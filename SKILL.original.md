---
name: computer-use-vision
description: 让无多模态能力的 Agent 在 Windows 上"看屏幕 + 模拟鼠标键盘操作"。通过截图（capture.ps1）→ 外部 vision 模型识图（vision.js）→ SendInput 模拟输入（input.ps1）闭环。内置自进化应用技巧库（knowledge/）：操作前查应用技巧，快捷键优先，用后自动沉淀经验。适用于文件操作、UI 自动化、界面验证等场景。
---

# Computer Use Vision — Windows 识图 + 模拟操作（自进化）

> 本文件夹自包含，不依赖其他项目文件夹。Windows 自带 PowerShell/.NET + Node.js 即可运行。
> **核心机制：用前查知识库 → 快捷键优先 → 用后自进化沉淀经验。**

## 目录结构

```
computer-use-vision/
├── SKILL.md               # 本文件，Agent 必读
├── README.md              # 人类阅读说明
├── LICENSE                # MIT 开源协议
├── .gitignore
├── knowledge/             # ★ 自进化应用技巧库
│   ├── INDEX.md           #   应用索引（操作前先查这里）
│   ├── REPORTS.md         #   自进化更新日志（强制报告留痕）
│   ├── _TEMPLATE.md       #   新增应用技巧的模板
│   └── apps/              #   每个应用一个文件（含快捷键表/结构树要点/坑位）
├── scripts/
│   ├── see.ps1            # 一步"看屏幕"：截图 + 识图
│   ├── capture.ps1        # 截图：全屏/主屏/窗口，输出坐标 JSON
│   ├── vision.js          # 识图：图片 → vision 模型 → 文字（零依赖）
│   ├── input.ps1          # 模拟输入：click/drag/key/type/scroll/cursor
│   ├── knowledge.ps1      # ★ 查询/列出应用技巧
│   └── .env.example       # 识图 Key 配置样例
└── examples/
    └── workflow.md        # 实战工作流案例
```

## 快速开始

### 1. 配置识图 Key（三选一）

1. 环境变量 `VISION_API_KEY`（兼容 `DASHSCOPE_API_KEY`）+ `VISION_MODEL`（默认 `qwen-vl-max`）+ `VISION_BASE_URL`（默认百炼兼容端点）
2. 本目录 `scripts/.env`
3. 本机 x-cli 自动回退：`x secret get DashScope --no-clipboard`（条目名可用 `VISION_KEY_NAME` 覆盖）

任何 OpenAI 兼容的 vision 服务都能用（阿里云百炼 / OpenAI / 中转等），改 BASE_URL 与模型名即可。

### 2. 验证识图链路

```powershell
node scripts/vision.js <任意图片> "这张图里有什么？"
```

## 核心工作流（每次操作必读）

### 第 0 步：查应用技巧（★ 新）

**开始操作任何应用前，先查知识库：**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/knowledge.ps1 -Search "<应用关键词>"
# 或直接读文件
# knowledge/apps/<应用>.md
```

- 有对应文件 → 按其中的快捷键/结构树要点/坑位执行，不要重复踩坑
- 没有 → 按 `knowledge/_TEMPLATE.md` 新建骨架（至少记：识别特征 + 已验证快捷键 + 坑位）

### 第 1 步：观察

- `see.ps1` 或 `capture.ps1` 截图 → `vision.js` 识图
- 能拿无障碍树时优先用树：元素索引比 vision 估坐标可靠

### 第 2 步：定位目标（★ 快捷键优先）

按以下顺序尝试，**不要一上来就猜坐标点**：

1. **查知识库快捷键**：该应用文件里的快捷键表（如 `Ctrl+L` 聚焦地址栏）
2. **结构树索引点击**：无障碍树中的按钮/编辑框（有 bounds 的）
3. **通用快捷键**：`knowledge/apps/common-windows.md`（Ctrl+F 搜索、Tab 导航等）
4. **键盘导航探测**：Tab / 方向键 / Enter 逐项探测（配合截图验证）
5. **最后才用坐标**：vision 给坐标点按（误差 ±10px，需截图确认）

> 原则：**结构树找不到元素（或无 bounds）时，优先搜快捷键，而不是反复试坐标。**

### 第 3 步：操作

- `input.ps1` 一次只做一步：click / drag / key / type / scroll
- 中文输入：`Set-Clipboard -Value "文本"` + `Ctrl+V`（先确认目标框已清空）
- 所有坐标均为屏幕物理坐标（脚本已 DPI 感知），vision 返回坐标可直接用于 `input.ps1`

### 第 4 步：验证

- 再截图识图确认结果；未确认前不执行下一步

### 第 5 步：自进化审查（强制）+ 强制报告（★ 必须）

**每次任务结束后（含中断/失败），强制对照触发条件审查知识库：**

- 有更新 → 先更新知识库，再输出报告
- 无更新 → 直接输出报告"无需更新"
- **禁止跳过报告；禁止默默改动知识库不告知用户**

触发条件（满足任意一条即更新）：

- 发现该应用**新的可用快捷键**（实测有效）
- 发现结构树/坐标找不到目标的**新解法**（如特定模式、特定按钮）
- 踩到**新坑并解决**（记录现象 → 原因 → 解法）
- **验证了**之前"待验证"区的条目（把状态改为 ✅ 并注明日期）

失败/中断任务的处理（先判断原因，有参考价值才写入）：

1. 可复现的坑、可复用的解法、验证了某个待验证项 → **有参考价值，写入知识库**
2. 一次性/环境性问题（网络中断、用户手动中止且无新信息、与本技能无关的故障）→ **不写入**，报告里注明"无参考价值，未写入"
3. 无论是否写入，都必须输出报告

更新规则：

1. 打开/创建 `knowledge/apps/<应用>.md`，按 `_TEMPLATE.md` 结构填写
2. 只记录**已验证**的事实，标注日期与验证方式；不确定的放"待验证"区
3. 更新 `knowledge/INDEX.md` 索引行
4. 有更新时，在 `knowledge/REPORTS.md` 追加日志（日期 + 应用 + 改动摘要）
5. **禁止**：编造快捷键/坐标/行为；把未验证信息当事实写；删除他人已验证条目（可补充修正）

**强制报告格式**（任务结束时的最后输出，结论二态必选其一）：

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

- 脚本全部 `SetProcessDPIAware`：**全屏截图像素 = 屏幕物理坐标**，vision 坐标可直接用于 `input.ps1`
- 窗口截图：`capture.ps1` 输出 JSON 含 `rect`，目标坐标 = PNG 内坐标 + rect 原点
- vision 估坐标 ±10px 误差：小目标先放大确认，或优先快捷键/结构树

## 常用命令

```powershell
# 知识库
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/knowledge.ps1 -List
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/knowledge.ps1 -Search "网易云"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/knowledge.ps1 -App netease-cloudmusic

# 看屏幕
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/see.ps1 -Prompt "描述屏幕，并给出目标元素坐标"

# 鼠标
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/input.ps1 click -X 100 -Y 200
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/input.ps1 rightclick -X 100 -Y 200
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/input.ps1 drag -FromX 10 -FromY 10 -ToX 500 -ToY 300 -Modifiers Shift
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/input.ps1 scroll -X 800 -Y 400 -Delta -600

# 键盘
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/input.ps1 key -Keys "Ctrl+A"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/input.ps1 type -Text "C:\path"
```

## 安全规则（强制）

1. 不操作：登录/认证对话框、密码管理器、系统安全/隐私设置、支付页面
2. 移动优先于删除；覆盖/替换前必须确认
3. 剪贴板保护：剪切后禁止用剪贴板型输入；粘贴前验证
4. 只做任务所需的最小操作序列
5. 不注入终端命令；不碰 Win 键组合
6. 用户中断或环境异常（锁定/弹窗）立即停止并报告

## 实战经验速查

- 键盘 Ctrl+X/Ctrl+V 注入可能不生效 → 优先工具栏按钮
- 中文输入 → 剪贴板方案或拼音，先清空目标框
- 多窗口应用定位 → EnumWindows 按 pid 找最大可见窗口，`Get-Process.MainWindowHandle` 不可靠（capture.ps1 已内置 `-WindowTitle` 查找）
- 现代资源管理器模拟点击选中/右键无效 → UIA `SelectionItemPattern.Select()` + 键盘（F2 / Ctrl+Shift+N）
- 模态对话框在 UIA 顶层树里"消失" → EnumWindows 才是真相
