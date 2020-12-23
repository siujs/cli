import { changeDeps } from "@siujs/builtin-deps";
import { HookHandlerContext, PluginApi, ValueOf } from "@siujs/core";

export function asDepsFallback(api: ValueOf<PluginApi>) {
	api.process(async (ctx: HookHandlerContext) => {
		await changeDeps(ctx.opts<string>("pkg"), ctx.opts<string>("dep"), ctx.opts<"rm" | "add">("action"));
	});
}
