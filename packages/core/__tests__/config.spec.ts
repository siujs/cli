import fs from "fs-extra";
import path from "path";
import sh from "shelljs";

import { analysisPlugins, resolveConfig, resolvePlugins, validPkgIsExclude } from "../lib/config";
import { DEFAULT_PLUGIN_ID } from "../lib/consts";
import { clearPlugins } from "../lib/plugin";

const oldCWD = process.cwd();

beforeAll(() => {
	process.chdir(__dirname);

	sh.mkdir(path.resolve(__dirname, "packages"));
	sh.mkdir(path.resolve(__dirname, "packages", "foo"));
	fs.writeJSONSync(path.resolve(__dirname, "packages/foo/package.json"), {
		name: "@xxx/foo"
	});
});

afterAll(() => {
	process.chdir(oldCWD);
	sh.rm("-rf", path.resolve(__dirname, "packages/foo"));
});

afterEach(() => {
	clearPlugins();
});

test(" resolveConfig ", async done => {
	const config = await resolveConfig();

	expect(config).toHaveProperty("pkgsOrder");
	expect(config.pkgsOrder).toBe("auto");

	expect(config).toHaveProperty("plugins");
	expect(config.plugins.length).toBe(2);
	expect(config.plugins[0]).toBe("./plugins/local-npm-package");
	expect(config.plugins[1]).toBe("./plugins/cli-opts");

	done();
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

describe(" config / analysisPlugins ", () => {
	beforeAll(() => {
		sh.mkdir(path.resolve(__dirname, "packages"));
		sh.mkdir(path.resolve(__dirname, "packages", "foo"));
		fs.writeJSONSync(path.resolve(__dirname, "packages/foo/package.json"), {
			name: "@xxx/foo"
		});
	});

	afterAll(() => {
		sh.rm("-rf", path.resolve(__dirname, "packages/foo"));
	});

	test(" analysisPlugins ", () => {
		let plugs = analysisPlugins(null as any);
		expect(plugs.length).toBe(0);

		plugs = analysisPlugins({} as any);
		expect(plugs.length).toBe(0);

		plugs = analysisPlugins({
			plugins: [
				"./plugins/local-npm-package",
				"foo",
				[
					"./plugins/analysisPlugins-with-custom",
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
		expect(plugs[0].id).toBe(path.resolve(__dirname, "plugins/local-npm-package"));
		expect(plugs[0].hasCommandHooks("deps")).toBe(true);

		expect(plugs[1].id).toBe("siujs-plugin-foo");
		expect(plugs[1].hasCommandHooks("build")).toBe(true);

		expect(plugs[2].id).toBe(path.resolve(__dirname, "plugins/analysisPlugins-with-custom"));
		expect(plugs[2].hasCommandHooks("create")).toBe(true);
	});
});
