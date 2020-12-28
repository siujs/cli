import { release } from "@siujs/builtin-publish";
import { HookHandlerContext, PluginApi, ValueOf } from "@siujs/core";

export function asPublishFallback(api: ValueOf<PluginApi>) {
	api.process(async (ctx: HookHandlerContext) => {
		const pkg = ctx.opts<string>("pkg");
		const version = ctx.opts<string>("ver");
		const repo = ctx.opts<string>("repo");
		const dryRun = ctx.opts<boolean>("dryRun") || ctx.opts<boolean>("dry-run");

		const skip = ctx.opts<string>("skip");

		const skips = skip ? skip.split(",") : [];

		await release({
			pkg,
			version,
			repo,
			dryRun,
			skipPush: !!skips.length && skips.includes("push"),
			skipLint: !!skips.length && skips.includes("lint"),
			skipBuild: !!skips.length && skips.includes("build")
		});
	});
}
