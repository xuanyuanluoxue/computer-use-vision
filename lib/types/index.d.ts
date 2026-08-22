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
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export declare const name = "computer-use";
export declare const inject: string[];
export interface Config {
    /** Vision API base URL (OpenAI-compatible). Default: Aliyun DashScope endpoint. */
    visionBaseUrl?: string;
    /** Vision model identifier. Default: qwen-vl-max. */
    visionModel?: string;
    /** Vision API key. Falls back to env VISION_API_KEY / DASHSCOPE_API_KEY, then x-cli. */
    visionApiKey?: string;
    /** Timeout in ms for a single vision API call. Default: 30000. */
    visionTimeoutMs?: number;
    /** Timeout in ms for a single input/screenshot subprocess. Default: 10000. */
    commandTimeoutMs?: number;
}
export declare const Config: z<Config>;
/**
 * Activate the computer-use plugin: register tools and bundled skill.
 * Fails loud on non-Windows platforms.
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map