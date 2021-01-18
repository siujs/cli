/* eslint-disable @typescript-eslint/ban-types */

import rollup from "rollup";

import { ChainedMap } from "../ChainedMap";

export interface SiuRollupPlugin<T> extends ChainedMap<T, Function | any[]> {
	use<O extends any>(plugin: Function, args?: O[]): SiuRollupPlugin<T>;

	tap<O extends any>(f: (args: O[]) => O[]): SiuRollupPlugin<T>;

	toConfig(): rollup.Plugin;
}

export class SiuRollupPlugin<T> extends ChainedMap<T, Function | any[]> {
	private readonly name: string;

	constructor(parent: T, name: string) {
		super(parent);
		this.name = name;
	}

	use<O extends any>(plugin: Function, args: O[] = []): SiuRollupPlugin<T> {
		this.set("plugin", plugin).set("args", args);
		return this;
	}

	tap<O extends any>(f: (args: O[]) => O[]): SiuRollupPlugin<T> {
		this.set("args", f((this.get("args") as any[]) || []));
		return this;
	}

	toConfig(): rollup.Plugin | undefined {
		const Plugin = this.get("plugin") as Function;

		const args = this.get("args") as any[];

		if (Plugin) {
			const config = Plugin(...args) as rollup.Plugin;

			return config;
		}
	}
}
