import { TreeshakingOptions } from "rollup";

import { esbuildRollupPlugin, SiuEsBuildPluginOptions } from "../lib";
import { SiuRollupConfig } from "../lib/config/rollup/Config";

it("should get `config.input` from config.input when use config.input('config.input')", () => {
	const config = new SiuRollupConfig();

	config.input("config.input");

	expect(config.get("input")).toBe("config.input");

	expect(config.toConfig().input).toBe("config.input");

	expect(config.toString()).toBe(
		JSON.stringify(
			{
				input: "config.input"
			},
			null,
			2
		)
	);
});

test(" config treeshake ", () => {
	const config = new SiuRollupConfig();

	config.treeshake({
		moduleSideEffects: true
	});

	expect(config.get("treeshake")).toHaveProperty("moduleSideEffects");
	expect(config.get("treeshake").moduleSideEffects).toBeTruthy();

	expect(config.toConfig().treeshake).toHaveProperty("moduleSideEffects");
	expect((<TreeshakingOptions>config.toConfig().treeshake).moduleSideEffects).toBeTruthy();

	config.treeshake(false);
	expect(config.get("treeshake")).toBeFalsy();
	expect(config.toConfig().treeshake).toBeFalsy();
});

test(" config external ", () => {
	const config = new SiuRollupConfig();

	config.external.add("foo");
	config.external.add("bar");

	expect(config.external.has("foo")).toBeTruthy();
	expect(config.external.has("bar")).toBeTruthy();

	let cleanConfig = config.toConfig();

	expect(Array.isArray(cleanConfig.external)).toBeTruthy();
	expect((<(string | RegExp)[]>cleanConfig.external).join(",")).toBe("foo,bar");

	config.external.prepend("test");
	expect(config.external.has("test")).toBeTruthy();
	cleanConfig = config.toConfig();
	expect((<(string | RegExp)[]>cleanConfig.external).join(",")).toBe("test,foo,bar");

	config.external.delete("bar");
	expect(config.external.has("bar")).toBeFalsy();
	cleanConfig = config.toConfig();
	expect((<(string | RegExp)[]>cleanConfig.external).join(",")).toBe("test,foo");

	config.external.merge("bar");
	expect(config.external.has("bar")).toBeTruthy();
	cleanConfig = config.toConfig();
	expect((<(string | RegExp)[]>cleanConfig.external).join(",")).toBe("test,foo,bar");

	config.external.clear();
	expect(config.external.has("foo")).toBeFalsy();
	expect(config.external.has("bar")).toBeFalsy();
	expect(config.external.has("test")).toBeFalsy();
	expect(config.external.values().length).toBe(0);
});

test(" config plugins ", () => {
	const config = new SiuRollupConfig();

	config.plugin("esbuild").use<SiuEsBuildPluginOptions>(esbuildRollupPlugin(), [
		{
			closeImmediate: true
		}
	]);

	expect(config.hasPlugin("esbuild")).toBeTruthy();

	const plugConfig = config.plugin("esbuild").toConfig();

	expect(plugConfig.name).toBe("esbuild");

	let args = config.plugin("esbuild").get("args") as any[];

	expect(Array.isArray(args)).toBeTruthy();
	expect(args[0]).toHaveProperty("closeImmediate");
	expect(args[0].closeImmediate).toBeTruthy();

	config.plugin("esbuild").tap((args: SiuEsBuildPluginOptions[]) => {
		args[0].closeImmediate = false;
		return args;
	});

	args = config.plugin("esbuild").get("args") as any[];

	expect(Array.isArray(args)).toBeTruthy();
	expect(args[0]).toHaveProperty("closeImmediate");
	expect(args[0].closeImmediate).toBeFalsy();
});

test(" config output ", () => {
	const config = new SiuRollupConfig();

	const output = config.output("cjs").file("output file").format("cjs").globals.set("vue", "Vue").end();

	let gKeys = output.globals.keys();
	expect(gKeys.length).toBe(1);
	expect(gKeys[0]).toBe("vue");

	output.globals.delete("vue");
	gKeys = output.globals.keys();
	expect(gKeys.length).toBe(0);

	output.globals.set("vue", "Vue");

	output.plugin("esbuild").use(esbuildRollupPlugin());

	let cfg = output.toConfig();

	expect(cfg.file).toBe("output file");
	expect(cfg.format).toBe("cjs");
	expect(cfg.globals).toHaveProperty("vue");
	expect((cfg.globals as any).vue).toBe("Vue");
	expect(cfg.plugins.length).toBe(1);
	expect(cfg.plugins[0].name).toBe("esbuild");

	output.clear();

	cfg = output.toConfig();

	expect(Object.keys(cfg).length).toBe(0);
});

test(" config toInput ", () => {
	const config = new SiuRollupConfig();

	config
		.input("config input")
		.external.add("foo")
		.end()
		.external.add("bar")
		.end()
		.treeshake({
			moduleSideEffects: true
		})
		.plugin("esbuild")
		.use(esbuildRollupPlugin());

	const inputs = config.toInput();

	expect(inputs.input).toBe("config input");
	expect(Array.isArray(inputs.external)).toBeTruthy();
	expect((inputs.external as any)[0]).toBe("foo");
	expect((inputs.external as any)[1]).toBe("bar");

	expect(inputs.treeshake).toHaveProperty("moduleSideEffects");
	expect((<TreeshakingOptions>inputs.treeshake).moduleSideEffects).toBeTruthy();

	expect(inputs.plugins.length).toBe(1);
	expect(inputs.plugins[0].name).toBe("esbuild");
});

test(" config toOutput ", () => {
	const config = new SiuRollupConfig();

	config.output("cjs").format("cjs").file("output file").plugin("esbuild").use(esbuildRollupPlugin());

	config.output("es").format("es").file("output file es").plugin("esbuild").use(esbuildRollupPlugin());

	const outputs = config.toOutput();

	expect(outputs.length).toBe(2);
	expect(outputs[0].format).toBe("cjs");
	expect(outputs[1].format).toBe("es");

	expect(outputs[0].file).toBe("output file");
	expect(outputs[1].file).toBe("output file es");

	expect(outputs[0].plugins.length).toBe(1);
	expect(outputs[1].plugins.length).toBe(1);

	expect(outputs[0].plugins[0].name).toBe("esbuild");
	expect(outputs[1].plugins[0].name).toBe("esbuild");
});

test(" config clone ", () => {
	const config = new SiuRollupConfig();

	config
		.input("input file")
		.external.add("foo")
		.end()
		.plugin("esbuild")
		.use(esbuildRollupPlugin())
		.end()
		.output("cjs")
		.file("output file")
		.format("cjs")
		.paths.set("jquery", "https://xxxx/jquery.min.js")
		.end()
		.globals.set("foo", "Foo")
		.end()
		.plugin("esbuild")
		.use(esbuildRollupPlugin())
		.end();

	const config2 = config.clone();

	expect(config === config2).toBeFalsy();

	expect(config.get("input")).toBe(config2.get("input"));
	expect(config.output("cjs").get("file")).toBe(config2.output("cjs").get("file"));
	expect(config.output("cjs").get("format")).toBe(config2.output("cjs").get("format"));

	expect(config2.external.values().length).toBe(1);
	expect(config2.external.values()[0]).toBe("foo");
	expect(config2.hasPlugin("esbuild")).toBeTruthy();
	expect(config2.output("cjs").hasPlugin("esbuild")).toBeTruthy();
	expect(config2.output("cjs").get("file")).toBe("output file");
	expect(config2.output("cjs").get("format")).toBe("cjs");
	expect(config2.output("cjs").paths.has("jquery")).toBeTruthy();
	expect(config2.output("cjs").paths.get("jquery")).toBe("https://xxxx/jquery.min.js");
});
