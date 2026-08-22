/**
 * Command execution abstraction for spawning external processes.
 *
 * The default implementation uses Node child_process directly.
 * When integrated into DSH, replace with the sandboxed shell/subprocess
 * capability for proper guard/permission enforcement.
 *
 * @module @deepseek-ai/dsh-computer-use/command
 */
import type { CommandResult } from './types.ts';
/** Function signature for executing an external command. */
export type RunCommand = (command: string, args: string[], options?: {
    timeoutMs?: number;
    env?: Record<string, string>;
}) => Promise<CommandResult>;
/**
 * Default RunCommand implementation using Node child_process.execFile.
 * Spawns a new process per call with a timeout; no persistent shell state.
 * @param command - executable path or name (e.g. "powershell", "node").
 * @param args - argument list.
 * @param options - optional timeout and extra environment variables.
 * @returns exit code, stdout, and stderr.
 */
export declare function defaultRunCommand(command: string, args: string[], options?: {
    timeoutMs?: number;
    env?: Record<string, string>;
}): Promise<CommandResult>;
//# sourceMappingURL=command.d.ts.map