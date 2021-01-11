import path from "path";
import sh from "shelljs";

import { loadPlugins, testPlugin } from "../lib";
import { resolvePlugins } from "../lib/config";
import { applyPlugins, clearPlugins } from "../lib/plugin";
import { createFooPackage, createSiuConfigJs } from "./common";

const oldCWD = process.cwd();

let clean: (rmAll?: boolean) => void;
beforeAll(() => {
	process.chdir(__dirname);
	clean = createFooPackage();
});

afterAll(() => {
	process.chdir(oldCWD);
	clean && clean(true);
});

afterEach(() => {
	clearPlugins();
});

describe(" siu-config / loadPlugins", () => {
	let clean: (rmAll?: boolean) => void;

	beforeEach(() => {
		sh.rm("-rf", [path.resolve(__dirname, "siu.config.ts"), path.resolve(__dirname, "siu.config.js")]);
		clean = createSiuConfigJs();
	});

	afterEach(() => {
		clean && clean();
	});

	test(" should have cli options ", async done => {
		const { applyPlugins, resolveCLIOptions } = await loadPlugins();

		await applyPlugins("deps", {});

		const options = await resolveCLIOptions();

		expect(options).toHaveProperty("create");
		expect(options.create.length).toBe(1);
		expect(options.create[0].description).toBe(`Foo [support by ${path.resolve(process.cwd(), "./plugins/cli-opts")}]`);
		expect(options.create[0].defaultValue).toBe("1");

		done();
	});
});

test(" test plugin", async done => {
	process.env.NODE_ENV = "SIU_TEST";

	await resolvePlugins({
		plugins: ["./plugins/keys"]
	});

	const ctx = await testPlugin("create", "start");

	expect(ctx.scopedKeys("foo")).toBe("2");

	done();
});

test(" apply plugins => `opts`", async done => {
	await applyPlugins(
		{
			cmd: "create",
			opts: {
				pkg: "core"
			}
		},
		{
			plugins: [
				[
					"./plugins/opts",
					{
						custom: {
							create: {
								foo: "1"
							}
						}
					}
				]
			]
		}
	);

	await testPlugin("build", "process", {
		opts: {
			foo: "1",
			bar: "2"
		}
	});

	done();
});

test(" apply plugins => `keys`", async done => {
	await applyPlugins(
		{
			cmd: "create",
			opts: {
				pkg: "core2"
			}
		},
		{
			plugins: ["./plugins/keys"]
		}
	);

	done();
});

test(" apply plugins => `next start=>process`", async done => {
	await applyPlugins(
		{
			cmd: "create",
			opts: {
				pkg: "core"
			}
		},
		{
			plugins: ["./plugins/next-start2process"]
		}
	);
	done();
});

test(" apply plugins => `next process=>complete`", async done => {
	await applyPlugins(
		{
			cmd: "create",
			opts: {
				pkg: "core"
			}
		},
		{
			plugins: ["./plugins/next-process2complete"]
		}
	);
	done();
});

test(" apply plugins => `next(ex)`", async done => {
	await applyPlugins(
		{
			cmd: "create",
			opts: {
				pkg: "core"
			}
		},
		{
			plugins: ["./plugins/next-err"]
		}
	);
	done();
});

test(" apply plugins => get `pkg` ", async done => {
	await applyPlugins(
		{
			cmd: "build",
			opts: {
				pkg: "foo"
			}
		},
		{
			plugins: ["./plugins/pkg"]
		}
	);
	done();
});

test(" apply plugins => refresh `pkg` ", async done => {
	await applyPlugins(
		{
			cmd: "build",
			opts: {
				pkg: "foo"
			}
		},
		{
			plugins: ["./plugins/pkg-refresh"]
		}
	);
	done();
});

test(" apply plugins : deps ", async done => {
	await applyPlugins(
		{
			cmd: "deps",
			opts: {
				pkg: "foo"
			}
		},
		{
			plugins: ["./plugins/deps"]
		}
	);
	done();
});
