import inquirer from "inquirer";
import path from "path";
import sh from "shelljs";

import { HookHandlerContext, loadPlugins, testPlugin } from "../lib";
import { applyPlugins, clearPlugins } from "../lib/plugin";
import { createFooPackage, createSiuConfigJs } from "./common";

const rootCWD = path.resolve(__dirname, "../../../");

const targetCWD = path.resolve(__dirname, "__jest__.plugin");

beforeAll(() => {
	sh.mkdir("-p", targetCWD, path.resolve(targetCWD, "packages"));
	process.chdir(targetCWD);
});

afterAll(() => {
	process.chdir(rootCWD);
	sh.rm("-rf", targetCWD);
});

afterEach(() => {
	clearPlugins();
});

describe(" resolve cli options ", () => {
	let backup: any;

	beforeAll(() => {
		backup = inquirer.prompt;
		inquirer.prompt = ((questions: any) => Promise.resolve({ skip: ["lint", "build"] })) as any;
	});

	afterAll(() => {
		inquirer.prompt = backup;
	});

	test(" should have `create` options and prompts ", async done => {
		const clean = await createSiuConfigJs(targetCWD);

		const { applyPlugins, resolveCLIOptions } = await loadPlugins();

		await applyPlugins("deps", {});

		const options = await resolveCLIOptions();

		clean();

		expect(options).toHaveProperty("create");
		expect(options.create.length).toBe(2);
		expect(options.create[0].description).toBe(`Foo [support by ${path.resolve(targetCWD, "../plugins/cli-opts")}]`);
		expect(options.create[0].defaultValue).toBe("1");
		expect(options.create[1].description).toBe(
			`Will skip steps: lint | build | publish | commit | push , support comma join [support by ${path.resolve(
				targetCWD,
				"../plugins/cli-opts"
			)}]`
		);
		expect(options.create[1].flags).toBe("-s, --skip <skip>");

		const opts = options.create[1].prompt.questions as any;

		expect(opts).toHaveProperty("type");
		expect(opts.type).toBe("checkbox");
		expect(opts.name).toBe("skip");
		expect(opts.message).toBe("Select skip steps:");
		expect(opts.choices.length).toBe(5);

		const prompt = options.create[1].prompt;

		const output = (await inquirer.prompt(prompt.questions, prompt.initialAnswers)) as Record<string, any>;

		const skipValue = prompt.answerTransform ? prompt.answerTransform(output.skip) : output.skip;

		expect(skipValue).toBe("lint,build");

		done();
	});
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
					"../plugins/opts",
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
			plugins: ["../plugins/keys"]
		}
	);

	const ctx = await testPlugin("create", "start");

	expect(ctx.scopedKeys("foo")).toBe("2");

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
			plugins: ["../plugins/next-start2process"]
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
			plugins: ["../plugins/next-process2complete"]
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
			plugins: ["../plugins/next-err"]
		}
	);
	done();
});

test(" apply plugins => get `pkg` ", async done => {
	createFooPackage(targetCWD);

	await applyPlugins(
		{
			cmd: "create",
			opts: {
				pkg: "foo"
			}
		},
		{
			plugins: ["../plugins/pkg"]
		},
		api => {
			api.start((ctx: HookHandlerContext) => {
				ctx.scopedKeys("_lifecycle", "create.start");
			});
		}
	);

	let ctx = await testPlugin("create", "start", "foo");
	expect(ctx.scopedKeys("_lifecycle")).toBe("create.start");

	ctx = await testPlugin("build", "start", "foo");
	expect(ctx.scopedKeys("foo")).toBe("1");

	done();
});

test(" apply plugins => refresh `pkg` ", async done => {
	createFooPackage(targetCWD);
	await applyPlugins(
		{
			cmd: "build",
			opts: {
				pkg: "foo"
			}
		},
		{
			plugins: ["../plugins/pkg-refresh"]
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
			plugins: ["../plugins/deps"]
		}
	);
	done();
});
