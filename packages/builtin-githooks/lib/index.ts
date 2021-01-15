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
export async function lintWithGHooks(hookName: keyof GitClientHooksHandlers, cwd?: string): Promise<boolean>;
export async function lintWithGHooks(
	hookName: keyof GitClientHooksHandlers,
	extra?: { cwd?: string; commitEditMsg?: string; handlers?: GitClientHooksHandlers }
): Promise<boolean>;
export async function lintWithGHooks(
	hookName: keyof GitClientHooksHandlers,
	extra: string | { cwd?: string; commitEditMsg?: string; handlers?: GitClientHooksHandlers }
) {
	const newArg = typeof extra === "string" ? { cwd: extra || process.cwd() } : { cwd: process.cwd(), ...extra };

	process.env.SIU_GIT_PARAMS = newArg.commitEditMsg || ".git/COMMIT_EDITMSG";

	const instance = new GitClientHooks(newArg.cwd, newArg.handlers);

	let rslt: boolean;

	try {
		rslt = await instance[hookName]();
	} catch {
		rslt = false;
	}
	process.env.SIU_GIT_PARAMS = "";

	return rslt;
}
