import { resolveConfig, resolvePlugins } from "./config";
import { applyPlugins, getPlugins, resolveCLIOptions } from "./plugin";
import { CLIOption, HookHandlerContext, PluginApi, PluginCommand, PluginCommandLifecycle, ValueOf } from "./types";
import { getHookId } from "./utils";

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

/**
 *
 * The specified lifecycle of the specified command of the test plug-in
 *
 *  note: `NODE_ENV` must be `SIU_TEST`
 *
 * @param cmd plugin command
 * @param lifecycle plugin command lifecycle
 */
export function testPlugin(cmd: PluginCommand, lifecycle: PluginCommandLifecycle): Promise<HookHandlerContext> {
	if (process.env.NODE_ENV !== "SIU_TEST") return;

	const plugs = getPlugins();

	if (!plugs || !plugs.length) return;

	return plugs[0].callHookForTest(getHookId(cmd, lifecycle));
}
