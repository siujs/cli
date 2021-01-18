import { InputOptions, ModuleSideEffectsOption, OutputOptions, RollupOptions } from "rollup";

import { ChainedMap } from "../ChainedMap";
import { ChainedSet } from "../ChainedSet";
import { SiuRollupOutput, TOutputFormatKey } from "./Output";
import { SiuRollupPlugin } from "./Plugin";

export interface SiuRollupConfig {
	input(value: string | Record<string, string>): SiuRollupConfig;
	external: ChainedSet<SiuRollupConfig, string | RegExp>;
	plugin(name: string): SiuRollupPlugin<SiuRollupConfig>;
	output(key: TOutputFormatKey): SiuRollupOutput<SiuRollupConfig>;
	treeshake(
		value:
			| boolean
			| {
					annotations?: boolean;
					moduleSideEffects?: ModuleSideEffectsOption;
					propertyReadSideEffects?: boolean;
					tryCatchDeoptimization?: boolean;
					unknownGlobalSideEffects?: boolean;
			  }
	): SiuRollupConfig;
}

export class SiuRollupConfig extends ChainedMap<void, any> {
	external: ChainedSet<SiuRollupConfig, string | RegExp>;
	plugins: ChainedMap<SiuRollupConfig, SiuRollupPlugin<SiuRollupConfig>>;
	outputs: ChainedMap<SiuRollupConfig, SiuRollupOutput<SiuRollupConfig>>;
	constructor() {
		super();
		this.external = new ChainedSet<SiuRollupConfig, string>(this);

		this.plugins = new ChainedMap<SiuRollupConfig, SiuRollupPlugin<SiuRollupConfig>>(this);

		this.outputs = new ChainedMap<SiuRollupConfig, SiuRollupOutput<SiuRollupConfig>>(this);

		this.extend(["input", "treeshake"]);
	}

	output(key: TOutputFormatKey): SiuRollupOutput<SiuRollupConfig> {
		if (!this.outputs.has(key)) {
			this.outputs.set(key, new SiuRollupOutput(this, key));
		}
		return this.outputs.get(key);
	}

	plugin(name: string): SiuRollupPlugin<SiuRollupConfig> {
		if (!this.plugins.has(name)) {
			this.plugins.set(name, new SiuRollupPlugin(this, name));
		}
		return this.plugins.get(name);
	}

	hasPlugin(name: string): boolean {
		return this.plugins.has(name);
	}

	toInput(): InputOptions {
		const input = this.get("input") as string;
		const external = this.external.values();

		return this.clean({
			input,
			external,
			treeshake: this.get("treeshake"),
			plugins: this.plugins
				.values()
				.map(item => item.toConfig())
				.filter(Boolean)
		}) as InputOptions;
	}

	toOutput(): OutputOptions[] {
		return this.outputs
			.values()
			.map(it => it.toConfig())
			.filter(p => Object.keys(p).length);
	}

	toConfig(): RollupOptions {
		const inputOptions = this.toInput();

		const outOptions = this.toOutput();

		return this.clean({
			...inputOptions,
			output: outOptions
		});
	}

	toString(): string {
		return JSON.stringify(this.toConfig(), null, 2);
	}

	clone(): SiuRollupConfig {
		const config = new SiuRollupConfig();

		Object.entries(this.entries()).forEach(([key, value]) => {
			config.set(key, value);
		});

		this.external.values().forEach(val => config.external.add(val));

		Object.entries(this.plugins.entries()).forEach(([key, value]) => {
			config
				.plugin(key)
				// eslint-disable-next-line @typescript-eslint/ban-types
				.use(value.get("plugin") as Function, value.get("args") as any[]);
		});

		Object.entries(this.outputs.entries()).forEach(([key, value]) => {
			const output = config.output(key as TOutputFormatKey);

			Object.entries(value.entries()).forEach(([key2, value2]) => {
				output.set(key2, value2);
			});

			Object.entries(value.globals.entries()).forEach(([key2, value2]) => {
				output.globals.set(key2, value2);
			});

			Object.entries(value.paths.entries()).forEach(([key2, value2]) => {
				output.paths.set(key2, value2);
			});

			Object.entries(value.plugins.entries()).forEach(([key, value]) => {
				output
					.plugin(key)
					// eslint-disable-next-line @typescript-eslint/ban-types
					.use(value.get("plugin") as Function, value.get("args") as any[]);
			});
		});

		return config;
	}
}

export * from "./Output";
export * from "./Plugin";
