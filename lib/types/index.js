/**
 * Computer-use plugin for DeepSeek Harness.
 *
 * Registers nine model-facing tools (see, click, rightclick, drag, type,
 * key, scroll, knowledge) and a bundled skill (computer-use-vision) that
 * provides the workflow, safety rules, and self-evolution protocol.
 *
 * Windows-only: the plugin refuses to activate on non-Windows platforms.
 * Enable via cordis.yml with the plugin name or by adding it to a preset.
 *
 * @module @deepseek-ai/dsh-computer-use
 */
import z from '@deepseek-ai/schemastery';
import { defaultRunCommand } from "./command.js";
import { WindowsDriver } from "./windows-driver.js";
import { registerSkill } from "./skill.js";
import { createSeeTool, createClickTool, createRightclickTool, createDragTool, createTypeTool, createKeyTool, createScrollTool, createKnowledgeTool, } from "./tools.js";
export const name = 'computer-use';
export const inject = ['tools', 'skills'];
export const Config = z.object({
    visionBaseUrl: z.string().default('https://dashscope.aliyuncs.com/compatible-mode/v1'),
    visionModel: z.string().default('qwen-vl-max'),
    visionApiKey: z.string().default(''),
    visionTimeoutMs: z.number().default(30_000),
    commandTimeoutMs: z.number().default(10_000),
});
/**
 * Activate the computer-use plugin: register tools and bundled skill.
 * Fails loud on non-Windows platforms.
 */
export function apply(ctx, config) {
    // --- Platform guard ---
    if (process.platform !== 'win32') {
        throw new Error('computer-use plugin requires Windows (process.platform is '
            + JSON.stringify(process.platform)
            + '). Disable this plugin in cordis.yml on non-Windows deployments.');
    }
    // --- Resolve config ---
    const resolved = {
        visionBaseUrl: config.visionBaseUrl ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        visionModel: config.visionModel ?? 'qwen-vl-max',
        visionApiKey: config.visionApiKey ?? process.env.VISION_API_KEY ?? process.env.DASHSCOPE_API_KEY ?? '',
        visionTimeoutMs: config.visionTimeoutMs ?? 30_000,
        commandTimeoutMs: config.commandTimeoutMs ?? 10_000,
    };
    // --- Build driver ---
    const driver = new WindowsDriver(defaultRunCommand, resolved);
    // --- Register tools (disposers tracked by Cordis lifecycle) ---
    ctx.tools.register(createSeeTool(driver));
    ctx.tools.register(createClickTool(driver));
    ctx.tools.register(createRightclickTool(driver));
    ctx.tools.register(createDragTool(driver));
    ctx.tools.register(createTypeTool(driver));
    ctx.tools.register(createKeyTool(driver));
    ctx.tools.register(createScrollTool(driver));
    ctx.tools.register(createKnowledgeTool(driver));
    // --- Register bundled skill ---
    const disposeSkill = registerSkill(ctx);
    // --- Cleanup on plugin disposal ---
    ctx.effect(() => () => {
        disposeSkill();
    });
}
//# sourceMappingURL=index.js.map