import { resolveConfig, resolvePlugins } from "./config";
import { applyPlugins, resolveCLIOptions } from "./plugin";
import { CLIOption, PluginApi, PluginCommand, ValueOf } from "./types";

export * from "./types";

export { adjustSiuConfigCWD } from "./utils";

export async function loadPlugins(fallback?: (api: PluginApi) => void) {
	const config = await resolveConfig();
	const plugs = await resolvePlugins(config, fallback);
	return {
		applyPlugins: (cmd: PluginCommand, opts: Record<string, any>, fallback?: (api: ValueOf<PluginApi>) => void) =>
			applyPlugins(
				{
					cmd,
					opts
				},
				config,
				fallback
			),
		resolveCLIOptions: (): Promise<Partial<Record<PluginCommand, CLIOption[]>>> => resolveCLIOptions(plugs)
	};
}
