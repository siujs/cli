import chalk from "chalk";
import { Loader, Message, Service, TransformOptions } from "esbuild";
import fs from "fs";
import path from "path";
import { Plugin, TransformResult } from "rollup";

import { createFilter } from "@rollup/pluginutils";
import { createDebugger } from "@siujs/utils";

const debug = createDebugger("siu:build.esbuild");

// lazy start the service
let _service: Service;

const ensureService = async () => {
	if (!_service) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		_service = await require("esbuild").startService();
	}
	return _service;
};

export const stopService = () => {
	_service && _service.stop();
	_service = undefined;
};

/* istanbul ignore next */
function printMessage(warning: Message, file: string) {
	console.error(chalk.yellow(warning.text));

	let message = `[esbuild]`;
	if (warning.location) {
		message += ` (${file}:${warning.location.line}:${warning.location.column})`;
	}
	message += ` ${warning.text}`;

	console.error(chalk.yellow(message));
}

const defaultLoaders = {
	".ts": "ts",
	".js": "js",
	".mjs": "js",
	".cjs": "js",
	".es": "js",
	".es6": "js",
	".jsx": "jsx",
	".tsx": "tsx",
	".css": "css",
	".less": "css",
	".styl": "css",
	".sass": "css",
	".json": "json",
	".txt": "text"
} as Record<string, Loader>;

// transform used in server plugins with a more friendly API
export async function transform(
	src: string,
	file: string,
	loader: Loader,
	options: TransformOptions,
	onwarn: (m: any, file: string, src: string) => void
): Promise<TransformResult> {
	const service = await ensureService();

	const opts = {
		loader,
		sourcefile: file,
		target: "es2020",
		sourcemap: true,
		...options
	};

	try {
		const result = await service.transform(src, opts);
		/* istanbul ignore if */
		if (result.warnings.length) {
			console.error(`[esbuild] warnings while transforming ${file}:`);
			result.warnings.forEach(warning => onwarn(warning, file, src));
		}

		return {
			code: result.code,
			map: result.map
		};
	} catch (e) {
		/* istanbul ignore next */
		debug("esbuild err", e);

		console.error(chalk.red(`[esbuild] error while transforming ${file}:`));
		console.error(e);

		return {
			code: "",
			map: ""
		};
	}
}

export interface SiuEsBuildPluginOptions extends Omit<TransformOptions, "loader"> {
	include?: string;
	exclude?: string;
	loaders?: Record<string, Loader>;
	closeImmediate?: boolean;
	onwarn?: (m: any, file: string, src: string) => void;
	importeeAlias?: Record<string, string> | ((id: string) => string);
}

export function asRollupPlugin() {
	return (options: SiuEsBuildPluginOptions = {}) => {
		const { include, exclude, loaders, onwarn = printMessage, importeeAlias, closeImmediate, ...esbuildOptions } =
			options || /* istanbul ignore next */ {};

		debug("esbuild options:", esbuildOptions);

		const aliasLoaders = {
			...defaultLoaders
		};

		if (loaders) {
			for (const key of Object.keys(loaders)) {
				const value = loaders[key];
				if (typeof value === "string") {
					aliasLoaders[key] = value;
				} else if (value === false) {
					delete aliasLoaders[key];
				}
			}
		}

		const extensions = Object.keys(aliasLoaders);
		const INCLUDE_REGEXP = new RegExp(`\\.(${extensions.map(ext => ext.slice(1)).join("|")})$`);
		const filter = createFilter(include || INCLUDE_REGEXP, exclude || /node_modules/);

		const resolveFile = (resolved: string, index = false) => {
			for (const ext of extensions) {
				const file = index ? path.join(resolved, `index${ext}`) : `${resolved}${ext}`;
				if (fs.existsSync(file)) return file;
			}
			return null;
		};

		const importeeAliasFn =
			typeof importeeAlias === "function"
				? importeeAlias
				: (id: string) => (importeeAlias ? (importeeAlias as Record<string, string>)[id] || id : id);

		return {
			name: "esbuild",
			async buildStart() {
				ensureService();
			},
			resolveId(importee, importer) {
				if (!importer) return;

				let resolved: string;
				if (importee[0] === "." || importee[0] === "/") {
					resolved = path.resolve(importer ? path.dirname(importer) : process.cwd(), importee);
				} else if (importeeAliasFn) {
					resolved = importeeAliasFn(importee);
				}

				if (!resolved) return;

				let file = resolveFile(resolved);
				if (file) return file;
				if (!file && fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
					file = resolveFile(resolved, true);
					if (file) return file;
				}
			},
			transform(code: string, id: string) {
				/* istanbul ignore if */
				if (!filter(id)) return null;

				const ext = path.extname(id);
				const loader = aliasLoaders[ext];

				/* istanbul ignore if */
				if (!loader || !_service) return null;

				debug("esbuild file id:", id, " loader: ", loader);

				return transform(code, id, loader, esbuildOptions, onwarn);
			},
			buildEnd() {
				closeImmediate !== false && stopService();
			}
		} as Plugin;
	};
}
