import { GlobalsOption, ModuleFormat, OptionsPaths, OutputOptions, PreRenderedAsset, PreRenderedChunk } from "rollup";

import { ChainedMap } from "../ChainedMap";
import { SiuRollupPlugin } from "./Plugin";

export interface SiuRollupOutput<T> {
	plugin(name: string): SiuRollupPlugin<SiuRollupOutput<T>>;
	hasPlugin(name: string): boolean;

	assetFileNames(name: string | ((chunkInfo: PreRenderedChunk) => string)): SiuRollupOutput<T>;
	banner(val: string | ((chunkInfo: PreRenderedAsset) => string)): SiuRollupOutput<T>;
	chunkFileNames(name: string | ((chunkInfo: PreRenderedChunk) => string)): SiuRollupOutput<T>;
	compact(val: boolean): SiuRollupOutput<T>;
	dir(val: string): SiuRollupOutput<T>;
	entryFileNames(name: string | ((chunkInfo: PreRenderedChunk) => string)): SiuRollupOutput<T>;
	esModule(val: boolean): SiuRollupOutput<T>;
	exports(val: "default" | "named" | "none" | "auto"): SiuRollupOutput<T>;
	file(val: string): SiuRollupOutput<T>;
	footer(val: string | (() => string | Promise<string>)): SiuRollupOutput<T>;
	format(fmt: ModuleFormat): SiuRollupOutput<T>;
	freeze(val: boolean): SiuRollupOutput<T>;
	globals: ChainedMap<SiuRollupOutput<T>, string>;
	name(val: string): SiuRollupOutput<T>;
	paths: ChainedMap<SiuRollupOutput<T>, string>;
	sourcemap(val: boolean | "inline" | "hidden"): SiuRollupOutput<T>;
	sourcemapExcludeSources(val: boolean): SiuRollupOutput<T>;
	sourcemapFile(val: string): SiuRollupOutput<T>;
	strict(val: boolean): SiuRollupOutput<T>;
}

export type TOutputFormatKey = "umd-min" | "umd" | "cjs" | "es";

const methods = [
	"assetFileNames",
	"banner",
	"chunkFileNames",
	"compact",
	"dir",
	"entryFileNames",
	"esModule",
	"exports",
	"file",
	"format",
	"freeze",
	"name",
	"sourcemap",
	"sourcemapExcludeSources",
	"sourcemapFile",
	"strict"
];

export class SiuRollupOutput<T> extends ChainedMap<T, any> {
	protected readonly key: TOutputFormatKey;

	globals: ChainedMap<SiuRollupOutput<T>, string>;
	paths: ChainedMap<SiuRollupOutput<T>, string>;
	plugins: ChainedMap<SiuRollupOutput<T>, SiuRollupPlugin<SiuRollupOutput<T>>>;

	constructor(parent: T, key: TOutputFormatKey) {
		super(parent);
		this.key = key;
		this.globals = new ChainedMap<SiuRollupOutput<T>, string>(this);
		this.paths = new ChainedMap<SiuRollupOutput<T>, string>(this);
		this.plugins = new ChainedMap<SiuRollupOutput<T>, SiuRollupPlugin<SiuRollupOutput<T>>>(this);
		this.extend(methods);
	}

	plugin(name: string): SiuRollupPlugin<SiuRollupOutput<T>> {
		if (!this.plugins.has(name)) {
			this.plugins.set(name, new SiuRollupPlugin(this, name));
		}
		return this.plugins.get(name);
	}

	hasPlugin(name: string): boolean {
		return this.plugins.has(name);
	}

	clear(): SiuRollupOutput<T> {
		this.globals.clear();
		this.paths.clear();
		this.plugins.clear();
		this.store.clear();
		return this;
	}

	toConfig(): OutputOptions {
		return this.clean({
			...methods.reduce((prev, cur) => {
				prev[cur] = this.get(cur);
				return prev;
			}, {} as Record<string, any>),
			plugins: this.plugins
				.values()
				.map(item => item.toConfig())
				.filter(Boolean),
			globals: this.globals.entries() as GlobalsOption,
			paths: this.paths.entries() as OptionsPaths
		});
	}
}
