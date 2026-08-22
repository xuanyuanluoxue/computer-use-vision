/**
 * Windows driver: wraps the packaged PowerShell/Node scripts into typed methods.
 *
 * Every public method delegates to a one-shot child process (see.ps1, capture.ps1,
 * input.ps1, knowledge.ps1, or node vision.js). The driver resolves script paths
 * relative to its own installation directory so the plugin is self-contained.
 *
 * @module @deepseek-ai/dsh-computer-use/windows-driver
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
const THIS_DIR = typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));
/**
 * Resolve the assets directory. When running from built lib/, assets live
 * at the package root; when running from src (tsx), they are one level up.
 */
function assetsDir() {
    // assets/ sits next to lib/ and src/ at the package root
    const fromLib = join(THIS_DIR, '..', 'assets');
    if (existsSync(fromLib))
        return fromLib;
    const fromSrc = join(THIS_DIR, '..', 'assets');
    return fromSrc;
}
function scriptPath(name) {
    return join(assetsDir(), 'scripts', name);
}
function powershellArgs(script, params) {
    return ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, ...params];
}
/**
 * Encapsulates all interactions with the desktop through the packaged scripts.
 */
export class WindowsDriver {
    run;
    config;
    constructor(run, config) {
        this.run = run;
        this.config = config;
    }
    /** Pass vision credentials as extra environment variables to a subprocess. */
    visionEnv() {
        const env = {};
        if (this.config.visionApiKey)
            env.VISION_API_KEY = this.config.visionApiKey;
        if (this.config.visionModel)
            env.VISION_MODEL = this.config.visionModel;
        if (this.config.visionBaseUrl)
            env.VISION_BASE_URL = this.config.visionBaseUrl;
        return env;
    }
    // ---- Screenshot + Vision ----
    /**
     * One-step "look at the screen": screenshot then describe via vision model.
     * Wraps see.ps1 → capture.ps1 → node vision.js.
     */
    async see(prompt, windowTitle) {
        const args = ['-Prompt', prompt];
        if (windowTitle)
            args.push('-WindowTitle', windowTitle);
        const r = await this.run('powershell', powershellArgs(scriptPath('see.ps1'), args), {
            timeoutMs: this.config.visionTimeoutMs + this.config.commandTimeoutMs,
            env: this.visionEnv(),
        });
        if (r.exitCode !== 0)
            throw new Error(`see.ps1 failed: ${r.stderr || r.stdout}`);
        return r.stdout.trim();
    }
    /**
     * Screenshot only, returning metadata JSON (file path, optional rect).
     */
    async capture(outFile, windowTitle) {
        const args = ['-Out', outFile];
        if (windowTitle)
            args.push('-WindowTitle', windowTitle);
        const r = await this.run('powershell', powershellArgs(scriptPath('capture.ps1'), args), {
            timeoutMs: this.config.commandTimeoutMs,
        });
        if (r.exitCode !== 0)
            throw new Error(`capture.ps1 failed: ${r.stderr || r.stdout}`);
        return JSON.parse(r.stdout.trim());
    }
    /**
     * Describe an existing image via the vision model.
     */
    async vision(imagePath, prompt) {
        const r = await this.run('node', [scriptPath('vision.js'), imagePath, prompt], {
            timeoutMs: this.config.visionTimeoutMs,
            env: this.visionEnv(),
        });
        if (r.exitCode !== 0)
            throw new Error(`vision.js failed: ${r.stderr || r.stdout}`);
        return { description: r.stdout.trim(), raw: r.stdout };
    }
    // ---- Input simulation ----
    /** Simulate a mouse click at screen coordinates. */
    async click(x, y) {
        const r = await this.run('powershell', powershellArgs(scriptPath('input.ps1'), ['click', '-X', String(x), '-Y', String(y)]), { timeoutMs: this.config.commandTimeoutMs });
        if (r.exitCode !== 0)
            throw new Error(`click failed: ${r.stderr || r.stdout}`);
    }
    /** Simulate a right-click at screen coordinates. */
    async rightclick(x, y) {
        const r = await this.run('powershell', powershellArgs(scriptPath('input.ps1'), ['rightclick', '-X', String(x), '-Y', String(y)]), { timeoutMs: this.config.commandTimeoutMs });
        if (r.exitCode !== 0)
            throw new Error(`rightclick failed: ${r.stderr || r.stdout}`);
    }
    /** Simulate a mouse drag from one point to another. */
    async drag(fromX, fromY, toX, toY, modifiers) {
        const args = ['drag', '-FromX', String(fromX), '-FromY', String(fromY), '-ToX', String(toX), '-ToY', String(toY)];
        if (modifiers)
            args.push('-Modifiers', modifiers);
        const r = await this.run('powershell', powershellArgs(scriptPath('input.ps1'), args), {
            timeoutMs: this.config.commandTimeoutMs,
        });
        if (r.exitCode !== 0)
            throw new Error(`drag failed: ${r.stderr || r.stdout}`);
    }
    /** Type text via clipboard paste (recommended for CJK). */
    async type(text) {
        const r = await this.run('powershell', powershellArgs(scriptPath('input.ps1'), ['type', '-Text', text]), { timeoutMs: this.config.commandTimeoutMs });
        if (r.exitCode !== 0)
            throw new Error(`type failed: ${r.stderr || r.stdout}`);
    }
    /** Send a keyboard shortcut or key combination. */
    async key(keys) {
        const r = await this.run('powershell', powershellArgs(scriptPath('input.ps1'), ['key', '-Keys', keys]), { timeoutMs: this.config.commandTimeoutMs });
        if (r.exitCode !== 0)
            throw new Error(`key failed: ${r.stderr || r.stdout}`);
    }
    /** Scroll the mouse wheel at screen coordinates. */
    async scroll(x, y, delta) {
        const r = await this.run('powershell', powershellArgs(scriptPath('input.ps1'), ['scroll', '-X', String(x), '-Y', String(y), '-Delta', String(delta)]), { timeoutMs: this.config.commandTimeoutMs });
        if (r.exitCode !== 0)
            throw new Error(`scroll failed: ${r.stderr || r.stdout}`);
    }
    // ---- Knowledge base ----
    /** Query the self-evolving knowledge base. action: list | search | app. */
    async knowledge(action, query) {
        const args = [];
        if (action === 'list')
            args.push('-List');
        else if (action === 'search' && query)
            args.push('-Search', query);
        else if (action === 'app' && query)
            args.push('-App', query);
        else
            throw new Error(`unknown knowledge action: ${action}`);
        const r = await this.run('powershell', powershellArgs(scriptPath('knowledge.ps1'), args), { timeoutMs: this.config.commandTimeoutMs });
        if (r.exitCode !== 0)
            throw new Error(`knowledge.ps1 failed: ${r.stderr || r.stdout}`);
        return r.stdout.trim();
    }
}
//# sourceMappingURL=windows-driver.js.map