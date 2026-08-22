/**
 * Command execution abstraction for spawning external processes.
 *
 * The default implementation uses Node child_process directly.
 * When integrated into DSH, replace with the sandboxed shell/subprocess
 * capability for proper guard/permission enforcement.
 *
 * @module @deepseek-ai/dsh-computer-use/command
 */
import { execFile } from 'node:child_process';
/**
 * Default RunCommand implementation using Node child_process.execFile.
 * Spawns a new process per call with a timeout; no persistent shell state.
 * @param command - executable path or name (e.g. "powershell", "node").
 * @param args - argument list.
 * @param options - optional timeout and extra environment variables.
 * @returns exit code, stdout, and stderr.
 */
export function defaultRunCommand(command, args, options) {
    return new Promise((resolve) => {
        execFile(command, args, {
            timeout: options?.timeoutMs ?? 30_000,
            windowsHide: true,
            env: { ...process.env, ...options?.env },
            encoding: 'utf-8',
        }, (error, stdout, stderr) => {
            resolve({
                exitCode: error ? (error.code ?? 1) : 0,
                stdout: stdout ?? '',
                stderr: stderr ?? '',
            });
        });
    });
}
//# sourceMappingURL=command.js.map