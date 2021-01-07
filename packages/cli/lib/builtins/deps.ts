import { changeDeps } from "@siujs/builtin-deps";
import { HookHandlerContext, PluginApi, ValueOf } from "@siujs/core";

export function asDepsFallback(api: ValueOf<PluginApi>) {
	api.process(async (ctx: HookHandlerContext) => {
		const { pkg, deps, action, workspace } = ctx.opts<{
			pkg?: string;
			deps?: string;
			action: "rm" | "add";
			workspace?: string;
		}>();

		await changeDeps(pkg, deps, action, workspace);
	});
}
