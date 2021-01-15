import { GitClientHooksHandlers, lintWithGHooks } from "@siujs/builtin-githooks";
import { HookHandlerContext, PluginApi, ValueOf } from "@siujs/core";

export function asGLintFallback(api: ValueOf<PluginApi>) {
	api.process(async (ctx: HookHandlerContext) => {
		const rslt = await lintWithGHooks(ctx.opts<keyof GitClientHooksHandlers>("hookName"), {
			cwd: process.cwd(),
			commitEditMsg: ctx.opts<string>("commitEditMsg")
		});

		if (!rslt) process.exit(1);
	});
}
