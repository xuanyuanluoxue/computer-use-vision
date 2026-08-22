# Computer Use Vision — DSH 插件

> Windows 桌面「识图 + 模拟操作」能力，作为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件运行。

让纯文本模型（DeepSeek、MiMo 等无多模态能力的 LLM）也能：

1. **看屏幕**：截图 → 调外部 vision 模型（默认阿里云百炼 qwen-vl-max）→ 得到文字描述和坐标
2. **操作电脑**：SendInput 模拟鼠标点击/拖拽、键盘快捷键/文字输入
3. **越用越聪明**：内置自进化应用技巧库（`knowledge/`），每次使用后沉淀新快捷键、新坑位、新解法

## 架构

本插件遵循 DSH 的 **skill + tool 混合形态**：

```
┌──────────────────────────────────────────────┐
│  Skill 层（怎么想）                            │
│  computer-use-vision (SKILL.md)               │
│  工作流 · 优先级 · 安全规则 · 自进化协议        │
│  resourceBase → assets/ (knowledge/, scripts/) │
└──────────────┬───────────────────────────────┘
               │ 模型加载后调用
┌──────────────▼───────────────────────────────┐
│  Tool 层（怎么做）                             │
│  computer-see / click / type / key / scroll    │
│  defineTool → ctx.tools.register              │
│  内部封装 PowerShell/Node 脚本                 │
└──────────────┬───────────────────────────────┘
               │ child_process / DSH shell
┌──────────────▼───────────────────────────────┐
│  Windows 原生层                               │
│  capture.ps1 → vision.js → input.ps1          │
│  SendInput (NET) · OpenAI-compatible API       │
└──────────────────────────────────────────────┘
```

## 工具参考

| 工具名 | 作用 | 典型参数 |
|---|---|---|
| `computer-see` | 截图 + vision 模型描述 | `prompt`, `window_title?` |
| `computer-click` | 鼠标左键点击 | `x`, `y` |
| `computer-rightclick` | 鼠标右键点击 | `x`, `y` |
| `computer-drag` | 鼠标拖拽 | `from_x/y`, `to_x/y`, `modifiers?` |
| `computer-type` | 文字输入（剪贴板） | `text` |
| `computer-key` | 键盘快捷键 | `keys`（如 `"Ctrl+A"`） |
| `computer-scroll` | 滚轮滚动 | `x`, `y`, `delta` |
| `computer-knowledge` | 查询技巧库 | `action`（list/search/app）, `query?` |

所有坐标均为**屏幕物理像素**（DPI 感知），`computer-see` 返回的坐标可直接用于 `computer-click`。

## 配置

在 `cordis.yml` 中启用并配置：

```yaml
plugins:
  - name: computer-use
    config:
      visionBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1"  # OpenAI 兼容端点
      visionModel: "qwen-vl-max"        # 任意 OpenAI 兼容 vision 模型
      visionApiKey: ""                   # 留空则读 VISION_API_KEY 环境变量
      visionTimeoutMs: 30000
      commandTimeoutMs: 10000
```

**Key 读取优先级**：`config.visionApiKey` > 环境变量 `VISION_API_KEY` > `DASHSCOPE_API_KEY`

支持任何 OpenAI 兼容的 vision 服务（阿里云百炼 / OpenAI / 中转等），改 `visionBaseUrl` 与 `visionModel` 即可。

## 安装到 DSH

### 方式一：--patch 加载（开发/测试）

```bash
# 在 DSH 仓库目录下，通过 junction link 开发
mklink /J packages\shell\computer-use D:\code\ai\computer-use-vision
pnpm install
npx tsc -b packages/shell/computer-use/tsconfig.json

# 通过 --patch 加载
pnpm dsh web --patch ./packages/shell/computer-use/cordis.patch.yml
```

### 方式二：dsh plugin add（正式安装）

```bash
# 打包后安装到 profile
dsh plugin add D:\code\ai\computer-use-vision --profile default
```

### 方式三：纯 Skill 模式（无需插件）

只把 `SKILL.md` 放进 `.agents/skills/computer-use-vision/`，通过 `skill` 工具加载。
模型用 `pwsh` 工具直接调用 `assets/scripts/` 下的脚本（见 SKILL.md 底部「Skill 模式命令」）。

```powershell
# 配置 Vision Key
$env:VISION_API_KEY = "sk-xxx"

# 直接调用脚本
powershell -NoProfile -ExecutionPolicy Bypass -File assets/scripts/see.ps1 -Prompt "描述屏幕"
powershell -NoProfile -ExecutionPolicy Bypass -File assets/scripts/input.ps1 click -X 960 -Y 540
```

## 自进化知识库

`assets/knowledge/` 目录是自进化应用技巧库。每个应用一个 Markdown 文件，包含：

- **识别特征**：如何判断当前是该应用
- **已验证快捷键**：实测有效的快捷操作
- **坑位记录**：已知问题和解法
- **待验证区**：存疑的条目

模型每次操作结束后必须输出**自进化报告**，有更新时写入 `knowledge/apps/<应用>.md` 并追加 `REPORTS.md` 日志。

## 安全规则

1. **不操作**：登录/认证对话框、密码管理器、系统安全/隐私设置、支付页面
2. **移动优先于删除**：覆盖/替换前必须确认
3. **剪贴板保护**：剪切后禁止用剪贴板型输入；粘贴前验证
4. **最小操作序列**：只做任务所需的最小操作
5. **不注入终端命令**：不碰 Win 键组合
6. **立即停止**：用户中断或环境异常（锁定/弹窗）立即报告

## 依赖

- **Windows**：PowerShell 5.1+ / .NET（SendInput）— 已内置于 Windows
- **Node.js**：≥ 18（vision.js 零第三方依赖）
- **外部服务**：OpenAI 兼容的 vision API（默认阿里云百炼 qwen-vl-max）

## 开发

```bash
# 在 DSH 仓库内开发（通过 junction link）
cd <dsh-repo>
pnpm install
npx tsc -b packages/shell/computer-use/tsconfig.json

# 或直接在本目录（需要 DSH workspace 依赖可用）
pnpm run build      # tsc -b
```

构建输出在 `lib/types/`（ESM JS + .d.ts 声明），无需额外 bundler。

## 项目结构

```
computer-use-vision/
├── README.md                # 本文件
├── package.json             # @deepseek-ai/dsh-computer-use（含 dsh.bundle）
├── cordis.patch.yml         # DSH bundle 插件行声明
├── tsconfig.json            # 继承 DSH tsconfig.base.json
├── SKILL.md                 # 双模式技能指令（插件工具 + pwsh 回退）
├── SKILL.original.md        # 原始技能文档（保留参考）
├── src/                     # 插件 TypeScript 源码
│   ├── index.ts             # 入口（name/inject/Config/apply）
│   ├── types.ts             # 纯类型
│   ├── command.ts           # 命令执行抽象（RunCommand 接口）
│   ├── windows-driver.ts    # Windows 驱动（封装脚本调用）
│   ├── tools.ts             # 8 个 defineTool 定义
│   ├── skill.ts             # ctx.skills.register 技能注册
│   └── invariant.ts         # 包清单注册
├── lib/types/               # 构建输出（tsc -b，ESM JS + .d.ts）
├── assets/
│   ├── SKILL.md             # 技能指令（canonical，被 skill.ts 读取）
│   ├── scripts/             # PowerShell/Node 脚本
│   │   ├── see.ps1, capture.ps1, input.ps1
│   │   ├── vision.js（+ package.json 强制 CJS）
│   │   └── knowledge.ps1
│   └── knowledge/           # 自进化技巧库
│       ├── INDEX.md, REPORTS.md, _TEMPLATE.md
│       └── apps/            # 各应用技巧文件
└── examples/
    └── workflow.md
```

## 许可

MIT —— 详见 [LICENSE](LICENSE)。