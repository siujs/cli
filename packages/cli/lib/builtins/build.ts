import path from "path";

import { asRollupPlugin, Config, SiuRollupBuilder, stopService, TOutputFormatKey } from "@siujs/builtin-build";
import { HookHandlerContext, HookHandlerNext, PluginApi, ValueOf } from "@siujs/core";

export function asBuildFallback(api: ValueOf<PluginApi>) {
	api.process(async (ctx: HookHandlerContext, next: HookHandlerNext) => {
		const pkgData = ctx.pkg();

		const builder = new SiuRollupBuilder(pkgData, {
			onConfigTransform: (config: Config, format: TOutputFormatKey) => {
				config.plugin("esbuild").use(asRollupPlugin());
				config.output(format).file(path.resolve(pkgData.path, `dist/index.${format === "es" ? "mjs" : "cjs"}`));
			}
		});

		const format = ctx.opts<string>("format");

		await builder.build({
			[`allowFormats`]: format && (format.split(",") as TOutputFormatKey[])
		});

		await next();
	});

	api.complete(() => {
		stopService();
	});
}
