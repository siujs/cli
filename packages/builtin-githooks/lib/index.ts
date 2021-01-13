import { GitClientHooks } from "./hooks";
import { GitClientHooksHandlers } from "./types";

export * from "./types";

/**
 *
 * invoke default githooks handle
 *
 * @param hookName git hook name
 * @param cwd [optional] current workspace directory
 */
export async function lintWithGHooks(hookName: keyof GitClientHooksHandlers, cwd?: string): Promise<void>;
export async function lintWithGHooks(
	hookName: keyof GitClientHooksHandlers,
	extra?: { cwd?: string; handlers?: GitClientHooksHandlers }
): Promise<void>;
export async function lintWithGHooks(
	hookName: keyof GitClientHooksHandlers,
	extra: string | { cwd?: string; handlers?: GitClientHooksHandlers }
) {
	const newArg = typeof extra === "string" ? { cwd: extra || process.cwd() } : { cwd: process.cwd(), ...extra };
	const instance = new GitClientHooks(newArg.cwd, newArg.handlers);
	await instance[hookName]();
}
