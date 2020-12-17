import { HookHandlerContext, PluginApi, ValueOf } from "@siujs/core";

export function asCreationFallback(api: ValueOf<PluginApi>) {
	api.process(async (ctx: HookHandlerContext) => {});
}
