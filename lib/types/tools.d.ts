/**
 * Tool definitions for the computer-use capability.
 *
 * Each factory accepts a {@link WindowsDriver} and returns a tool built with
 * {@link defineTool}. Closures over the driver instance match the standard DSH
 * pattern (cf. tool-todo) where apply() owns the runtime wiring.
 *
 * @module @deepseek-ai/dsh-computer-use/tools
 */
import type { WindowsDriver } from './windows-driver.ts';
/**
 * One-step screen observation: screenshot → vision model description.
 * The model receives a natural-language description and, when requested,
 * estimated pixel coordinates relative to the screenshot.
 */
export declare function createSeeTool(driver: WindowsDriver): import("@deepseek-ai/dsh-tools").ToolDefinition;
export declare function createClickTool(driver: WindowsDriver): import("@deepseek-ai/dsh-tools").ToolDefinition;
export declare function createRightclickTool(driver: WindowsDriver): import("@deepseek-ai/dsh-tools").ToolDefinition;
export declare function createDragTool(driver: WindowsDriver): import("@deepseek-ai/dsh-tools").ToolDefinition;
export declare function createTypeTool(driver: WindowsDriver): import("@deepseek-ai/dsh-tools").ToolDefinition;
export declare function createKeyTool(driver: WindowsDriver): import("@deepseek-ai/dsh-tools").ToolDefinition;
export declare function createScrollTool(driver: WindowsDriver): import("@deepseek-ai/dsh-tools").ToolDefinition;
export declare function createKnowledgeTool(driver: WindowsDriver): import("@deepseek-ai/dsh-tools").ToolDefinition;
//# sourceMappingURL=tools.d.ts.map