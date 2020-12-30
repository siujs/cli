import chalk from "chalk";

import { deepFreezeObject, getMetasOfPackages, getPkgData, getPkgDirName } from "@siujs/utils";

import { analysisPlugins, validPkgIsExclude } from "./config";
import { DEFAULT_PLUGIN_ID, GlobalKeyValues, lifecycles, PkgCaches, pluginCommands } from "./consts";
import {
	CLIOption,
	CLIOptionHandler,
	HookHandler,
	HookHandlerContext,
	HookHandlerFunc,
	ParamTypeOf,
	PluginApi,
	PluginCommand,
	PluginCommandLifecycle,
	PluginHookKey,
	SiuConfig,
	ValueOf
} from "./types";
import { getHookId, sortPkgs } from "./utils";

export class SiuPlugin {
	readonly id: string;
	readonly output: PluginApi;

	private readonly _cacheKeyPrefix: string;
	private readonly _hooks: Partial<Record<PluginHookKey, ParamTypeOf<HookHandlerFunc>[]>>;
	private readonly _ctx: HookHandlerContext;

	private _opts: Record<string, any> = {};

	private _cmd?: PluginCommand;

	private lifecycle: PluginCommandLifecycle = "start";

	private _currentPkg = "";

	CliOptions: Partial<Record<PluginCommand, CLIOption[]>> = {};

	constructor(id: string) {
		this.id = id;
		this._cacheKeyPrefix = `@${id}/`;
		this._hooks = {};
		this.output = this.initOutputApi();
		this._ctx = this.initHookCtx();
	}

	private initHookCtx() {
		return {
			opts: this.opts.bind(this),
			keys: this.keys.bind(this),
			scopedKeys: this.scopedKeys.bind(this),
			ex: this.ex.bind(this),
			pkg: this.pkg.bind(this)
		};
	}

	private initOutputApi() {
		const addHook = this.addHook.bind(this);
		const addCLIOptionHook = this.addCLIOptionHook.bind(this);

		const kv = pluginCommands.reduce((prev, cmd) => {
			prev[cmd] = lifecycles.reduce((kv, cur) => {
				kv[cur] =
					cur === "cli"
						? (fn: CLIOptionHandler) => addCLIOptionHook(cmd, fn)
						: (fn: HookHandler) => addHook(cmd, cur, fn);
				return kv;
			}, {} as ValueOf<PluginApi>);
			return prev;
		}, {} as PluginApi);

		deepFreezeObject(kv);

		return kv;
	}
	/**
	 *
	 * refresh options of plugin
	 *
	 * @param opts  new options
	 */
	refreshOpts(opts?: Record<string, any>) {
		if (opts) {
			this._opts = {
				...this._opts,
				...opts
			};
		}
		return this;
	}

	/**
	 *
	 * 获取当前插件在当前action的配置信息
	 *
	 * @param key 键名
	 */
	private opts<T>(key?: string) {
		return key
			? (this._opts[this._cmd]?.[key] as T)
			: {
					...this._opts[this._cmd]
			  };
	}

	/**
	 *
	 * 新增插件hook
	 *
	 * @param action 操作名称
	 * @param lifeCycle 操作执行周期
	 * @param hookHandler hook处理器
	 */
	private addHook(action: PluginCommand, lifeCycle: PluginCommandLifecycle, hookHandler: HookHandler) {
		const hookId = getHookId(action, lifeCycle);
		this._hooks[hookId] = this._hooks[hookId] || [];
		this._hooks[hookId].push(hookHandler);
	}

	/**
	 *
	 * 新增插件关于命令选项初始化的hook
	 *
	 * @param action 操作名称
	 * @param hookHandler hook处理器
	 */
	private addCLIOptionHook(action: PluginCommand, hookHandler: CLIOptionHandler) {
		const hookId = getHookId(action, "cli");
		this._hooks[hookId] = this._hooks[hookId] || [];
		this._hooks[hookId].push(hookHandler);
	}

	/**
	 *
	 * 判断是否具备对应的hook
	 *
	 * @private
	 * @param hookKey target hook key
	 */
	private hasHook(hookKey: PluginHookKey) {
		return this._hooks[hookKey] && !!this._hooks[hookKey].length;
	}

	hasCommandHooks(cmd: PluginCommand) {
		return Object.keys(this._hooks).reduce((prev, key) => prev || (key.startsWith(cmd) && !key.endsWith("cli")), false);
	}

	/**
	 *
	 * 1. 获取当前上下文的临时缓存中特定键对应的值
	 * 2. 设置新的临时缓存键值对
	 *
	 * @param key 键名
	 * @param value [可选] 值
	 */
	private keys<T>(key: string, value?: T) {
		const realKey = this._cacheKeyPrefix + key;
		return value ? (GlobalKeyValues[realKey] = value) : (GlobalKeyValues[realKey] as T);
	}

	/**
	 *
	 * 带作用域的key
	 *
	 * @param key 键名
	 * @param value [可选] 值
	 */
	private scopedKeys<T>(key: string, value?: T) {
		return this.keys(`@${this._cmd}${this._currentPkg ? `${this._currentPkg}/` : ""}/${key}`, value);
	}

	/**
	 *
	 * 记录异常信息
	 *
	 * @param value [可选] 异常的错误对象或者异常文本信息
	 */
	private ex(value?: Error | string) {
		return this.scopedKeys("SIU_PLUGIN_CATCH_ERR", value);
	}

	/**
	 *
	 * 获取/设置当前package的元数据信息
	 *
	 * @param meta [可选] 新的元数据信息
	 */
	private pkg(meta?: Record<string, any>) {
		if (meta) {
			if (!this._currentPkg) return;

			const data = PkgCaches[this._currentPkg];

			data.meta = {
				...data.meta,
				...meta
			};
			return;
		}

		return this._currentPkg
			? PkgCaches[this._currentPkg] || (PkgCaches[this._currentPkg] = getPkgData(this._currentPkg, process.cwd()))
			: null;
	}

	/**
	 *
	 * 执行插件的Handlers
	 *
	 * @param hookKey 插件Key
	 */
	private async callHook(hookKey: PluginHookKey) {
		const handlers = this._hooks[hookKey] as HookHandler[];

		if (!handlers || !handlers.length) return;

		await Promise.all(handlers.map(handler => handler(this._ctx)));
	}

	async process(cmd: PluginCommand, cmdOpts: Record<string, any>, pkgName?: string) {
		const hasStartHook = this.hasHook(getHookId(cmd, "start"));

		const hasProcessHook = this.hasHook(getHookId(cmd, "process"));

		if (!hasStartHook) {
			if (hasProcessHook) {
				this.lifecycle = "process";
			} else return;
		}

		this._cmd = cmd;

		this._opts[cmd] = {
			...(this._opts[cmd] || {}),
			...cmdOpts
		};

		this._currentPkg = pkgName;

		const logStr = `${pkgName ? `${pkgName}:` : ""}${this.id}:${cmd}`;

		try {
			console.log(chalk.yellow.bold(`<${logStr}>\n`));

			await this.callHook(getHookId(cmd, this.lifecycle));

			// `start` => `process`
			if (this.lifecycle === "start" && hasProcessHook) {
				await this.callHook(getHookId(cmd, (this.lifecycle = "process")));
			}

			// `process` => `complete`
			if (this.lifecycle === "process" && this.hasHook(getHookId(cmd, "complete"))) {
				await this.callHook(getHookId(cmd, (this.lifecycle = "complete")));
			}
		} catch (ex) {
			this.ex(ex);
			console.log(chalk.redBright("\n	<ERROR-MSG>\n"));
			console.log(ex);
			console.log(chalk.redBright("\n	</ERROR-MSG>\n"));

			await this.callHook(getHookId(cmd, (this.lifecycle = "error")));
		}

		console.log(chalk.yellow.bold(`\n</${logStr}>\n`));
	}

	private option(
		flags: string,
		description?: string,
		defaultValue?: any,
		fn?: ((arg1: any, arg2: any) => void) | RegExp
	) {
		this.CliOptions[this._cmd] = this.CliOptions[this._cmd] || [];

		if (this.id !== DEFAULT_PLUGIN_ID) {
			description = description + ` [support by ${this.id}]`;
		}

		let cur: CLIOption;

		this.CliOptions[this._cmd].push(
			(cur = {
				flags,
				description,
				fn,
				defaultValue
			})
		);

		const prompt = (prompt: ParamTypeOf<ReturnType<ParamTypeOf<CLIOptionHandler>>>) => {
			cur.prompt = prompt;
		};

		return prompt;
	}

	async processCLIOptions() {
		for (let l = pluginCommands.length; l--; ) {
			const cmd = pluginCommands[l];

			const hookKey = getHookId(cmd, "cli");

			const hasHook = this.hasHook(hookKey);

			if (!hasHook) continue;

			const handlers = this._hooks[hookKey] as CLIOptionHandler[];

			/* istanbul ignore if */
			if (!handlers || !handlers.length) continue;

			this._cmd = cmd;

			const options = this.option.bind(this);

			await Promise.all(handlers.map(handler => handler(options)));
		}
	}

	/**
	 * 清除当前插件的临时存储
	 */
	private cleanKeys() {
		Object.keys(GlobalKeyValues)
			.filter(key => key.startsWith(this._cacheKeyPrefix))
			.forEach(item => {
				delete GlobalKeyValues[item];
			});
	}

	/**
	 *
	 * 对外提供主动唤起清理动作的接口
	 *
	 * @param pkg [可选] package名称
	 */
	async clean(pkg?: string) {
		this._currentPkg = pkg;

		this.cleanKeys();

		await this.callHook(getHookId(this._cmd, "clean"));
	}
}

const PluginCaches = {} as Record<string, SiuPlugin>;

/**
 *
 * Define plugin
 *
 * @param id id of plugin
 * @param opts options of plugin
 */
export function definePlugin(id: string, opts?: Record<string, any>) {
	const plug = PluginCaches[id] || (PluginCaches[id] = new SiuPlugin(id));

	opts && plug.refreshOpts(opts);

	return plug.output;
}

/**
 * get all plugins
 */
export function getPlugins() {
	return Object.values(PluginCaches);
}

/**
 *
 * Clear all plugins
 *
 *  for watching `siu.config.(ts|js)` change action
 *
 */
export function clearPlugins() {
	Object.keys(PluginCaches).forEach(key => {
		delete PluginCaches[key];
	});
}

const noPkgEffectCmds = ["glint", "deps", "publish"];

export async function applyPlugins(
	args: {
		cmd: PluginCommand;
		opts: {
			pkg?: string;
			[key: string]: any;
		};
	},
	config: SiuConfig,
	fallback?: (api: ValueOf<PluginApi>) => void
) {
	let plugs = getPlugins();

	if (!plugs || !plugs.length) {
		plugs = analysisPlugins(config);
	}

	/* istanbul ignore if */
	if (!plugs || !plugs.length) return;

	const hasHooks = plugs.reduce((prev, plug) => prev || plug.hasCommandHooks(args.cmd), false);

	if (!hasHooks) {
		if (!fallback || typeof fallback !== "function") return;

		fallback(definePlugin(DEFAULT_PLUGIN_ID)[args.cmd]);
	}

	if (noPkgEffectCmds.includes(args.cmd)) {
		for (let i = 0; i < plugs.length; i++) {
			await plugs[i].process(args.cmd, args.opts);
		}
		await Promise.all(plugs.map(plug => plug.clean()));
	} else {
		const { pkg, ...rest } = args.opts;

		let dirs: string[];

		const pkgMetas = await getMetasOfPackages();

		if (args.cmd === "create" && pkg) {
			dirs = [];
			pkg.split(",").forEach(pkg => {
				dirs.push(getPkgDirName(pkg));
				pkgMetas[dirs[dirs.length - 1]] = { name: pkg };
			});
		} else {
			dirs = await sortPkgs(config?.pkgsOrder ?? "priority", pkg);
		}

		const isPkgExclude = validPkgIsExclude(config);

		const kv = dirs.reduce((prev, cur) => {
			const plugList = plugs.filter(plug => !isPkgExclude(cur, plug.id, args.cmd));
			if (plugList && plugList.length) {
				prev[cur] = plugList;
			}
			return prev;
		}, {} as Record<string, SiuPlugin[]>);

		const pkgs = Object.keys(kv);

		for (let i = 0; i < pkgs.length; i++) {
			const plugs = kv[pkgs[i]];
			for (let j = 0; j < plugs.length; j++) {
				await plugs[j].process(args.cmd, rest, pkgMetas[pkgs[i]].name);
			}
		}

		await Promise.all(pkgs.map(pkg => kv[pkg].map(plug => plug.clean(pkg))).flat());
	}
}

export async function resolveCLIOptions(plugs: SiuPlugin[]) {
	const kv = {} as Partial<Record<PluginCommand, CLIOption[]>>;

	/* istanbul ignore if */
	if (!plugs || !plugs.length) return kv;

	for (let l = plugs.length; l--; ) {
		const plug = plugs[l];

		await plug.processCLIOptions();

		const opts = plug.CliOptions;

		Object.keys(opts).forEach((cmd: PluginCommand) => {
			(kv[cmd] = kv[cmd] || []).push(...opts[cmd]);
		});
	}

	return kv;
}
