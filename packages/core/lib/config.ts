import esbuild from "esbuild";
import fs from "fs-extra";
import path from "path";

import { resolvePluginId } from "@siujs/utils";

import { DEFAULT_PLUGIN_ID } from "./consts";
import { definePlugin, getPlugins } from "./plugin";
import { PluginApi, PluginCommand, SiuConfig, SiuConfigExcludePkgs } from "./types";

let siuConfig: SiuConfig;

/**
 * resolve `siu.config.js` or `siu.config.ts`
 */
export async function resolveConfig() {
	if (siuConfig) return siuConfig;

	const cwd = process.cwd();

	let configFile = path.resolve(cwd, "siu.config.ts");

	let exists = await fs.pathExists(configFile);

	let isTS = false;

	if (exists) {
		isTS = true;
		await esbuild.build({
			entryPoints: [configFile],
			bundle: true,
			outfile: path.resolve(cwd, "siu.config.js"),
			format: "cjs"
		});
	}

	configFile = path.resolve(cwd, "siu.config.js");

	exists = await fs.pathExists(configFile);

	if (exists) {
		const content = require(configFile);
		siuConfig = (content.default || content) as SiuConfig;
		siuConfig.pkgsOrder = siuConfig.pkgsOrder || "priority";
	}

	if (isTS) {
		await fs.unlink(configFile);
	}

	return siuConfig;
}

export function validPkgIsExclude(config: SiuConfig) {
	return (pkg: string, plugId: string, cmd: PluginCommand) => {
		/* istanbul ignore if */
		if (!config) return false;

		const { excludePkgs, plugins } = config;

		/* istanbul ignore if */
		if (!plugins || !plugins.length) return false;

		function validFromExcludePkgs(excludePkgs: SiuConfigExcludePkgs) {
			if (Array.isArray(excludePkgs) && excludePkgs.includes(pkg)) return true;
			const opts = (excludePkgs as Record<PluginCommand, string[]>)[cmd];
			if (opts && opts.includes(pkg)) return true;
		}

		let flag = false;

		if (excludePkgs) {
			flag = !!validFromExcludePkgs(excludePkgs);
			if (flag) return true;
		}

		for (let l = plugins.length; l--; ) {
			const plug = plugins[l];
			if (Array.isArray(plug)) {
				if (plugId === plug[0] && plug[1] && plug[1].excludePkgs && validFromExcludePkgs(plug[1].excludePkgs)) {
					return true;
				}
			}
		}

		return false;
	};
}

/**
 * analysis plugins in `siu.config.js` or `siu.config.ts`
 *
 * @param config Config Data in `siu.config.js` or `siu.config.ts`
 */
export function analysisPlugins(config?: SiuConfig) {
	if (!config) return getPlugins();

	const { plugins = [] } = config;

	const nmPath = path.resolve(process.cwd(), "node_modules");

	if (plugins && plugins.length) {
		for (let i = 0, l = plugins.length; i < l; i++) {
			const plug = plugins[i];

			let id = Array.isArray(plug) ? plug[0] : plug;

			let factory: any;
			if (id.startsWith(".") || id.startsWith("/")) {
				id = path.resolve(process.cwd(), id);
				factory = require(id);
			} else {
				id = resolvePluginId(id);
				factory = require(path.resolve(nmPath, id));
			}

			factory = factory.default || factory;

			/* istanbul ignore else */
			if (factory) {
				factory(definePlugin(id, Array.isArray(plug) && plug.length > 1 && plug[1] ? plug[1].custom || {} : {}));
			} else {
				console.warn(`[@siujs/core] Warning: ${id} is empty!`);
			}
		}
	}

	return getPlugins();
}

/**
 * resolve plugins in `siu.config.js` or `siu.config.ts`
 *
 * @param fallback [option] when plugins is empty,we will use the fallback
 */
export async function resolvePlugins(config: SiuConfig, fallback?: (api: PluginApi) => void) {
	const plugs = analysisPlugins(config);

	if (!plugs || !plugs.length) {
		/* istanbul ignore if */
		if (!fallback || typeof fallback !== "function") return;
		fallback(definePlugin(DEFAULT_PLUGIN_ID));
	}

	return getPlugins();
}
