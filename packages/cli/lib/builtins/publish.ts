import { release } from "@siujs/builtin-publish";
import { HookHandlerContext, PluginApi, ValueOf } from "@siujs/core";

export function asPublishFallback(api: ValueOf<PluginApi>) {
	api.process(async (ctx: HookHandlerContext) => {
		await release();
	});
}
