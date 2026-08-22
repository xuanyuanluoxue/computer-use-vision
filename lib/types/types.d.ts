/**
 * Pure types for the computer-use capability.
 * @module @deepseek-ai/dsh-computer-use/types
 */
/** Deployment configuration for the computer-use plugin. */
export interface ComputerUseConfig {
    /** Vision API base URL (OpenAI-compatible). Default: Aliyun DashScope. */
    visionBaseUrl: string;
    /** Vision model identifier. Default: qwen-vl-max. */
    visionModel: string;
    /**
     * Vision API key. When empty, the plugin reads from environment
     * VISION_API_KEY / DASHSCOPE_API_KEY, then falls back to x-cli secret store.
     */
    visionApiKey: string;
    /** Timeout in ms for a single vision API call. Default: 30000. */
    visionTimeoutMs: number;
    /** Timeout in ms for a single input/screenshot command. Default: 10000. */
    commandTimeoutMs: number;
}
/** Result of running an external command. */
export interface CommandResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}
/** Coordinate pair on the physical screen (DPI-aware pixels). */
export interface ScreenPoint {
    x: number;
    y: number;
}
/** Screenshot capture metadata returned by capture.ps1. */
export interface CaptureMeta {
    file: string;
    rect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
/** Vision analysis result. */
export interface VisionResult {
    description: string;
    raw: string;
}
//# sourceMappingURL=types.d.ts.map