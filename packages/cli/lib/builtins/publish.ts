import { release } from "@siujs/builtin-publish";
import { HookHandlerContext, PluginApi, ValueOf } from "@siujs/core";

export interface PublishOptions {
	pkg?: string;
	ver?: string;
	repo?: string;
	dryRun?: boolean;
	"dry-run"?: boolean;
	skip?: string;
	workspace?: string;
}

export function asPublishFallback(api: ValueOf<PluginApi>) {
	api.process(async (ctx: HookHandlerContext) => {
		const { pkg, ver, repo, skip, workspace, ...rest } = ctx.opts<PublishOptions>();

		const skips = skip ? skip.split(",") : [];

		await release({
			workspace,
			pkg,
			version: ver,
			repo,
			dryRun: !!(rest.dryRun || rest["dry-run"]),
			skipLint: !skips.length || skips.includes("lint"),
			skipBuild: !!skips.length && skips.includes("build"),
			skipPublish: !!skips.length && skips.includes("publish"),
			skipCommit: !!skips.length && skips.includes("commit"),
			skipPush: !!skips.length && skips.includes("push")
		});
	});
}
