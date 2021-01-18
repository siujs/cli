/* eslint-disable @typescript-eslint/no-var-requires */
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import ms from "pretty-ms";
import { ModuleFormat, rollup } from "rollup";
import gzipPlugin from "rollup-plugin-gzip";
import { terser } from "rollup-plugin-terser";
import { brotliCompressSync, gzipSync } from "zlib";

import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import { camelize, createDebugger, PkgData } from "@siujs/utils";

import { SiuRollupConfig } from "../config/rollup/Config";
import { TOutputFormatKey } from "../config/rollup/Output";

const debug = createDebugger("siu:build.rollup");

const FormatMap = {
	"umd-min": "umd",
	umd: "umd",
	cjs: "cjs",
	es: "es"
} as Record<TOutputFormatKey, ModuleFormat>;

const TerserOptions = {
	// sourcemap option is removed. Now it is inferred from rollup options.
	// sourcemap: true,
	compress: {
		keep_infinity: true,
		pure_getters: true,
		passes: 10
	},
	output: {
		wrap_func_args: false
	},
	warnings: true,
	mangle: {}
};

const DEFAULT_BUILD_OPTIONS = {
	allowFormats: ["es", "cjs", "umd", "umd-min"] as TOutputFormatKey[],
	sizeCalc: true,
	gzipThreshold: 1024 * 1024 * 10
} as SiuRollupBuildOption;

/**
 *
 * calculate file size (unit: kb)
 *
 * @param {Buffer} fileContent file content buffer
 */
function toKB(fileContent: Buffer): string {
	return (fileContent.length / 1024).toFixed(2) + "kb";
}

export interface SiuRollupBuildOption {
	allowFormats?: TOutputFormatKey[];
	gzipThreshold?: number;
	sizeCalc?: boolean;
}

export interface SiuRollupBuilderMonitor {
	startTime: number;
	finishedTime: number;
	eachStartTime: number;
	eachFinishedTime: number;
}

export interface SiuRollupBuilderHooks {
	/**
	 *
	 * 自定义转换浏览器环境的配置
	 *
	 * @param config browser config or non-browser config
	 * @param format "browser" | "browser-min" | "module" | "main"
	 */
	onConfigTransform: (
		config: SiuRollupConfig,
		format: TOutputFormatKey,
		perf: SiuRollupBuilderMonitor
	) => void | Promise<void>;

	/**
	 * 构建开始
	 */
	onBuildStart?: (opts: SiuRollupBuildOption, perf: SiuRollupBuilderMonitor) => void | Promise<void>;

	/**
	 * 每个配置构建开始
	 */
	onEachBuildStart?: (config: SiuRollupConfig, perf: SiuRollupBuilderMonitor) => void | Promise<void>;

	/**
	 * 每个配置构建完成
	 */
	onEachBuildFinished?: (config: SiuRollupConfig, perf: SiuRollupBuilderMonitor) => void | Promise<void>;

	/**
	 * 构建完成时的调用
	 */
	onBuildFinished?: (perf: SiuRollupBuilderMonitor) => void | Promise<void>;

	/**
	 * 构建发生异常时候的处理
	 *
	 * @param ex - 异常信息
	 */
	onBuildError?: (ex: Error) => void | Promise<void>;

	/**
	 * 构建发生异常时候的处理
	 *
	 * @param ex - 异常信息
	 */
	onSizeCalced?: (sizeInfo: BuilderSizeInfo) => void | Promise<void>;
}

const DEFAULT_HOOKS = {
	onConfigTransform() {},
	onEachBuildStart(config: SiuRollupConfig) {
		const outputs = config.toOutput();

		let input = config.get("input");

		if (typeof input !== "string") {
			input = Object.values(input).join(",");
		}

		console.log(
			chalk.cyan(
				`bundles ${chalk.bold(input)} → ${outputs
					.map(output => chalk.bold(output.file || path.resolve(output.dir, <string>output.entryFileNames)))
					.join(",")}`
			)
		);
	},
	onEachBuildFinished(config: SiuRollupConfig, perf: SiuRollupBuilderMonitor) {
		const outputs = config.toOutput();
		console.log(
			chalk.green(
				`created ${outputs
					.map(output => chalk.bold(output.file || path.resolve(output.dir, <string>output.entryFileNames)))
					.join(",")} in ${chalk.bold(ms(Date.now() - perf.eachStartTime))}`
			)
		);
	},
	onSizeCalced(sizeInfo: BuilderSizeInfo) {
		console.log(
			`min:${chalk.green(sizeInfo.mini)} / gzip:${chalk.green(sizeInfo.gzip)} / brotli:${chalk.green(sizeInfo.brotli)}`
		);
	}
} as SiuRollupBuilderHooks;

export interface BuilderSizeInfo {
	mini: string;
	gzip: string;
	brotli: string;
}

export function genRollupCommonConfig(config: SiuRollupConfig) {
	config
		.plugin("nodeResolve")
		.use(nodeResolve, [{ preferBuiltins: false }])
		.end()
		.plugin("commonjs")
		.use(commonjs)
		.end()
		.plugin("replace")
		.use(replace, [{ "process.env.NODE_ENV": JSON.stringify("production") }])
		.end()
		.plugin("nodeExternals")
		.use(require("rollup-plugin-node-externals"))
		.end();

	config.treeshake({
		moduleSideEffects: false
	});

	return config;
}

export async function rollupBuild(config: SiuRollupConfig) {
	const bundle = await rollup(config.toInput());
	await Promise.all(config.toOutput().map(bundle.write));
}

export class SiuRollupBuilder {
	protected pkgData: PkgData;
	protected config: SiuRollupConfig;
	protected browserConfig: SiuRollupConfig;
	protected hooks: SiuRollupBuilderHooks;
	constructor(pkgData: PkgData, hooks?: SiuRollupBuilderHooks) {
		this.pkgData = pkgData;
		this.config = new SiuRollupConfig();
		this.browserConfig = new SiuRollupConfig();
		this.hooks = { ...DEFAULT_HOOKS, ...(hooks || /* istanbul ignore next */ {}) };
	}

	private initCommonConfig(config: SiuRollupConfig) {
		return genRollupCommonConfig(config).input(path.resolve(this.pkgData.path, "lib/index.ts"));
	}

	private initBrowserConfig(mini?: boolean) {
		const config = this.initCommonConfig(this.browserConfig);

		if (mini) {
			config
				.output("umd-min")
				.format(FormatMap["umd-min"])
				.exports("named")
				.name(this.pkgData.umdName)
				.file(path.resolve(this.pkgData.path, `dist/${this.pkgData.dirName}.min.js`))
				.plugin("gzip")
				.use(gzipPlugin)
				.end()
				.plugin("brotli")
				.use(gzipPlugin, [
					{
						customCompression: (content: string) => brotliCompressSync(Buffer.from(content)),
						fileName: ".br"
					}
				])
				.end()
				.plugin("mini")
				.use(terser, [TerserOptions]);

			Object.keys(this.pkgData.meta.dependencies || []).forEach(item => {
				config
					.output("umd-min")
					.globals.set(
						item,
						camelize(
							item.startsWith("@") && ~item.indexOf("/") ? item.replace(/^@[\w-]+(\.)?[\w-]+\//g, "") : item,
							true
						)
					);
			});
		} else {
			config
				.output("umd")
				.format(FormatMap.umd)
				.exports("named")
				.name(this.pkgData.umdName)
				.file(path.resolve(this.pkgData.path, `dist/${this.pkgData.dirName}.js`));

			Object.keys(this.pkgData.meta.dependencies || []).forEach(item => {
				config
					.output("umd")
					.globals.set(
						item,
						camelize(
							item.startsWith("@") && ~item.indexOf("/") ? item.replace(/^@[\w-]+(\.)?[\w-]+\//g, "") : item,
							true
						)
					);
			});
		}

		return config;
	}

	private initConfig(format: "cjs" | "es") {
		const config = this.initCommonConfig(this.config);

		config
			.output(format)
			.format(FormatMap[format])
			.exports("named")
			.file(path.resolve(this.pkgData.path, `dist/${this.pkgData.dirName}.${format === "es" ? "mjs" : "cjs"}`));

		Object.keys(this.pkgData.meta.dependencies || []).forEach(item => {
			config.external.add(item);
		});

		return config;
	}

	static async checkSize(filePath: string, gzipThreshold = 1024 * 1024 * 10) {
		const file = fs.readFileSync(filePath);

		const minSize = toKB(file);

		const gzippedFile = gzipSync(file);
		const gzippedSize = toKB(gzippedFile);

		if (gzippedFile.length >= gzipThreshold) {
			// 生成.gz文件
			await fs.writeFile(filePath + ".gz", gzippedFile);
		}

		const compressedFile = brotliCompressSync(file);
		const compressedSize = toKB(compressedFile);

		if (compressedFile.length >= gzipThreshold) {
			// 生成.gz文件
			await fs.writeFile(filePath + ".br", compressedFile);
		}

		return {
			mini: minSize,
			gzip: gzippedSize,
			brotli: compressedSize
		} as BuilderSizeInfo;
	}

	/**
	 *
	 * 执行构建流程
	 *
	 * @param opts 构建时的相关设置
	 */
	async build(opts?: SiuRollupBuildOption) {
		try {
			opts = {
				...DEFAULT_BUILD_OPTIONS,
				...(opts || {})
			};

			debug("build opts:", opts);

			const configs = [] as SiuRollupConfig[];

			const monitors = {
				startTime: Date.now()
			} as SiuRollupBuilderMonitor;

			await Promise.all(
				opts.allowFormats.map(format => {
					switch (format) {
						case "umd-min":
							configs[0] = this.browserConfig;
							return this.hooks.onConfigTransform(this.initBrowserConfig(true), format, monitors);
						case "umd":
							configs[0] = this.browserConfig;
							this.initBrowserConfig();
							return this.hooks.onConfigTransform(this.initBrowserConfig(), format, monitors);
						case "cjs":
						case "es":
							configs[1] = this.config;
						default:
							return this.hooks.onConfigTransform(this.initConfig(format), format, monitors);
					}
				})
			);

			const finalConfigs = configs.filter(Boolean);

			this.hooks.onBuildStart && (await this.hooks.onBuildStart(opts, monitors));

			for (let l = finalConfigs.length; l--; ) {
				monitors.eachStartTime = Date.now();
				this.hooks.onEachBuildStart && (await this.hooks.onEachBuildStart(finalConfigs[l], monitors));

				await rollupBuild(finalConfigs[l]);

				monitors.eachFinishedTime = Date.now();
				this.hooks.onEachBuildFinished && (await this.hooks.onEachBuildFinished(finalConfigs[l], monitors));
			}

			if (opts.sizeCalc && opts.allowFormats.includes("umd-min")) {
				const sizeInfo = await SiuRollupBuilder.checkSize(finalConfigs[0].output("umd-min").get("file"));
				this.hooks.onSizeCalced && (await this.hooks.onSizeCalced(sizeInfo));
			}

			monitors.finishedTime = Date.now();
			this.hooks.onBuildFinished && (await this.hooks.onBuildFinished(monitors));
		} catch (ex) {
			this.hooks.onBuildError ? await this.hooks.onBuildError(ex) : console.error(ex);
		}
	}
}
