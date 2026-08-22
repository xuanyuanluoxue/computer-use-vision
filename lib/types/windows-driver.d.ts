/**
 * Windows driver: wraps the packaged PowerShell/Node scripts into typed methods.
 *
 * Every public method delegates to a one-shot child process (see.ps1, capture.ps1,
 * input.ps1, knowledge.ps1, or node vision.js). The driver resolves script paths
 * relative to its own installation directory so the plugin is self-contained.
 *
 * @module @deepseek-ai/dsh-computer-use/windows-driver
 */
import type { RunCommand } from './command.ts';
import type { CaptureMeta, ComputerUseConfig, VisionResult } from './types.ts';
/**
 * Encapsulates all interactions with the desktop through the packaged scripts.
 */
export declare class WindowsDriver {
    private readonly run;
    private readonly config;
    constructor(run: RunCommand, config: ComputerUseConfig);
    /** Pass vision credentials as extra environment variables to a subprocess. */
    private visionEnv;
    /**
     * One-step "look at the screen": screenshot then describe via vision model.
     * Wraps see.ps1 → capture.ps1 → node vision.js.
     */
    see(prompt: string, windowTitle?: string): Promise<string>;
    /**
     * Screenshot only, returning metadata JSON (file path, optional rect).
     */
    capture(outFile: string, windowTitle?: string): Promise<CaptureMeta>;
    /**
     * Describe an existing image via the vision model.
     */
    vision(imagePath: string, prompt: string): Promise<VisionResult>;
    /** Simulate a mouse click at screen coordinates. */
    click(x: number, y: number): Promise<void>;
    /** Simulate a right-click at screen coordinates. */
    rightclick(x: number, y: number): Promise<void>;
    /** Simulate a mouse drag from one point to another. */
    drag(fromX: number, fromY: number, toX: number, toY: number, modifiers?: string): Promise<void>;
    /** Type text via clipboard paste (recommended for CJK). */
    type(text: string): Promise<void>;
    /** Send a keyboard shortcut or key combination. */
    key(keys: string): Promise<void>;
    /** Scroll the mouse wheel at screen coordinates. */
    scroll(x: number, y: number, delta: number): Promise<void>;
    /** Query the self-evolving knowledge base. action: list | search | app. */
    knowledge(action: string, query?: string): Promise<string>;
}
//# sourceMappingURL=windows-driver.d.ts.map