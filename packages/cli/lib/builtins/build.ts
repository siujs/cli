import path from "path";

import {
	esbuildRollupPlugin,
	SiuRollupBuilder,
	SiuRollupConfig,
	stopEsBuildService,
	TOutputFormatKey
} from "@siujs/builtin-build";
import { HookHandlerContext, PluginApi, ValueOf } from "@siujs/core";

export function asBuildFallback(api: ValueOf<PluginApi>) {
	api.process(async (ctx: HookHandlerContext) => {
		const pkgData = ctx.pkg();

		const builder = new SiuRollupBuilder(pkgData, {
			onConfigTransform: (config: SiuRollupConfig, format: TOutputFormatKey) => {
				config.plugin("esbuild").use(esbuildRollupPlugin());
				config.output(format).file(path.resolve(pkgData.path, `dist/index.${format === "es" ? "mjs" : "cjs"}`));
			}
		});

		const format = ctx.opts<string>("format");

		await builder.build(
			format && {
				allowFormats: format.split(",") as TOutputFormatKey[]
			}
		);
	});

	api.clean(() => {
		stopEsBuildService();
	});
}
