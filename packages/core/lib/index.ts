import { resolveConfig, resolvePlugins } from "./config";
import { applyPlugins, getPlugins, resolveCLIOptions } from "./plugin";
import { CLIOption, HookHandlerContext, PluginApi, PluginCommand, PluginCommandLifecycle, ValueOf } from "./types";

export * from "./types";

export { fixedCWD } from "./utils";

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
 * The specific lifecycle of the specific command of the test plug-in
 *
 *  note: `NODE_ENV` must be `SIU_TEST`
 *
 * @param cmd plugin command
 * @param lifecycle plugin command lifecycle
 * @param extra [optional] extra data
 * @property {Record<string,any>} extra.opts [optional] current plugin options
 * @property {string} extra.pkgName [optional] specific package name
 */
export function testPlugin(
	cmd: PluginCommand,
	lifecycle: PluginCommandLifecycle,
	extra:
		| string
		| {
				opts?: Record<string, any>;
				pkg?: string;
		  } = {}
): Promise<HookHandlerContext> {
	/* istanbul ignore if */
	if (process.env.NODE_ENV !== "SIU_TEST") return;

	const plugs = getPlugins();

	/* istanbul ignore if */
	if (!plugs || !plugs.length) return;

	let pkg = "";

	if (typeof extra === "string") {
		pkg = extra;
	} else {
		pkg = extra && extra.pkg;
		extra &&
			extra.opts &&
			plugs[0].refreshOpts({
				[cmd]: extra.opts
			});
	}

	return plugs[0].callHookForTest(cmd, lifecycle, pkg);
}

/**
 *
 * Define plugin
 *
 * @param factory factory of define plugin
 */
/* istanbul ignore next */
export function definePlugin(factory: (api: PluginApi) => void) {
	return factory;
}
