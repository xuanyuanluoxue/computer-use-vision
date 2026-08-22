/**
 * Bundled skill registration: reads SKILL.md from packaged assets and
 * registers it as a runtime skill via ctx.skills.register().
 *
 * @module @deepseek-ai/dsh-computer-use/skill
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-skill'  // declares ctx.skills

const THIS_DIR = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url))

function assetsDir(): string {
  const fromLib = join(THIS_DIR, '..', 'assets')
  if (existsSync(fromLib)) return fromLib
  return join(THIS_DIR, '..', 'assets')
}

/**
 * Register the computer-use-vision skill as a runtime skill.
 * The skill body is read from assets/SKILL.md at apply() time.
 * resourceBase points to the assets directory so knowledge/ paths resolve.
 * @returns the disposal function from ctx.skills.register().
 */
export function registerSkill(ctx: Context): () => void {
  const assets = assetsDir()
  const skillPath = join(assets, 'SKILL.md')
  if (!existsSync(skillPath)) {
    throw new Error(`computer-use: bundled SKILL.md not found at ${skillPath}`)
  }
  const content = readFileSync(skillPath, 'utf-8')

  return ctx.skills.register({
    name: 'computer-use-vision',
    description: '让无多模态能力的 Agent 在 Windows 上"看屏幕 + 模拟鼠标键盘操作"。通过截图→外部 vision 模型识图→SendInput 模拟输入闭环。内置自进化应用技巧库（knowledge/）：操作前查应用技巧，快捷键优先，用后自动沉淀经验。',
    source: 'runtime',
    content,
    resourceBase: { kind: 'directory', path: assets },
  })
}
