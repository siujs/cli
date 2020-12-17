import { GitClientHooksHandlers, lintWithGHooks } from "@siujs/builtin-githooks";
import { HookHandlerContext, PluginApi, ValueOf } from "@siujs/core";

export function asGLintFallback(api: ValueOf<PluginApi>) {
	api.process(async (ctx: HookHandlerContext) => {
		await lintWithGHooks(ctx.opts<keyof GitClientHooksHandlers>("hookName"));
	});
}
