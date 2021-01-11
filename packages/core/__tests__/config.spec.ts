import path from "path";
import sh from "shelljs";

import { analysisPlugins, resolveConfig, resolvePlugins, validPkgIsExclude } from "../lib/config";
import { DEFAULT_PLUGIN_ID } from "../lib/consts";
import { clearPlugins } from "../lib/plugin";
import { createFooNode_Modules, createSiuConfigJs, createSiuConfigTs, createSiuPackageJSON } from "./common";

afterEach(() => {
	clearPlugins();
});

test(" resolve plugins ", async done => {
	const plugs = await resolvePlugins(
		{
			plugins: []
		},
		api => {
			api.create.start(() => {});
			api.build.start(() => {});
			api.deps.start(() => {});
			api.glint.start(() => {});
		}
	);

	expect(plugs.length).toBe(1);
	expect(plugs[0].id).toBe(DEFAULT_PLUGIN_ID);
	expect(plugs[0].hasCommandHooks("create")).toBe(true);
	expect(plugs[0].hasCommandHooks("build")).toBe(true);
	expect(plugs[0].hasCommandHooks("deps")).toBe(true);
	expect(plugs[0].hasCommandHooks("glint")).toBe(true);

	done();
});

test(" validPkgIsExclude ", async done => {
	const fn = validPkgIsExclude({
		excludePkgs: ["pkg1", "pkg2"],
		plugins: [
			["siujs-plugin-foo", { excludePkgs: ["pkg"] }],
			[
				"siujs-plugin-foo2",
				{
					excludePkgs: {
						create: ["pkg3"]
					}
				}
			]
		]
	});

	expect(fn("pkg1", "siujs-plugin-foo", "create")).toBe(true);
	expect(fn("pkg2", "siujs-plugin-foo", "create")).toBe(true);

	expect(fn("pkg", "siujs-plugin-foo", "create")).toBe(true);
	expect(fn("pkg", "siujs-plugin-foo", "build")).toBe(true);

	expect(fn("pkg3", "siujs-plugin-foo2", "create")).toBe(true);
	expect(fn("pkg3", "siujs-plugin-foo2", "build")).toBe(false);

	done();
});

describe("use `resolveConfig`", () => {
	const rootCWD = path.resolve(__dirname, "../../../");

	const currentCWD = path.resolve(__dirname, "__jest__.config");

	beforeAll(() => {
		sh.mkdir("-p", currentCWD);
		process.chdir(currentCWD);
	});

	afterAll(() => {
		process.chdir(rootCWD);
		sh.rm("-rf", currentCWD);
	});

	test(`should be ok with analysising 'siu.config.ts'`, async done => {
		const clean = await createSiuConfigTs(currentCWD);
		const config = await resolveConfig(currentCWD);
		clean();

		expect(config).toHaveProperty("pkgsOrder");
		expect(config.pkgsOrder).toBe("auto");
		expect(config).toHaveProperty("plugins");
		expect(config.plugins.length).toBe(2);
		expect(config.plugins[0]).toBe("../plugins/local-npm-package");
		expect(config.plugins[1]).toBe("../plugins/cli-opts");

		done();
	});
	test(`should be ok with analysising 'siu.config.js'`, async done => {
		const clean = await createSiuConfigJs(currentCWD);
		const config = await resolveConfig(currentCWD);
		clean();

		expect(config).toHaveProperty("pkgsOrder");
		expect(config.pkgsOrder).toBe("auto");
		expect(config).toHaveProperty("plugins");
		expect(config.plugins.length).toBe(2);
		expect(config.plugins[0]).toBe("../plugins/local-npm-package");
		expect(config.plugins[1]).toBe("../plugins/cli-opts");

		done();
	});

	test(`should be ok with analysising 'siu' in 'package.json'`, async done => {
		const clean = await createSiuPackageJSON(currentCWD);
		const config = await resolveConfig(currentCWD);
		clean();

		expect(config).toHaveProperty("pkgsOrder");
		expect(config.pkgsOrder).toBe("auto");
		expect(config).toHaveProperty("plugins");
		expect(config.plugins.length).toBe(2);
		expect(config.plugins[0]).toBe("../plugins/local-npm-package");
		expect(config.plugins[1]).toBe("../plugins/cli-opts");

		done();
	});

	test(" analysisPlugins ", async done => {
		const clean = await createFooNode_Modules(currentCWD);

		let plugs = analysisPlugins(null as any);
		expect(plugs.length).toBe(0);

		plugs = analysisPlugins({} as any);
		expect(plugs.length).toBe(0);

		plugs = analysisPlugins({
			plugins: [
				"../plugins/local-npm-package",
				"foo",
				[
					"../plugins/analysisPlugins-with-custom",
					{
						custom: {
							build: {
								bar: "1"
							}
						}
					}
				]
			]
		});

		expect(plugs.length).toBe(3);
		expect(plugs[0].id).toBe(path.resolve(currentCWD, "../plugins/local-npm-package"));
		expect(plugs[0].hasCommandHooks("deps")).toBe(true);

		expect(plugs[1].id).toBe("siujs-plugin-foo");
		expect(plugs[1].hasCommandHooks("build")).toBe(true);

		expect(plugs[2].id).toBe(path.resolve(currentCWD, "../plugins/analysisPlugins-with-custom"));
		expect(plugs[2].hasCommandHooks("create")).toBe(true);

		clean();
		done();
	});
});
