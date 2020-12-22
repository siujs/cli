import path from "path";

import { resolvePlugins } from "../lib/config";
import { applyPlugins, clearPlugins, resolveCLIOptions } from "../lib/plugin";

beforeEach(() => {
	process.chdir(path.resolve(__dirname));
});

afterEach(() => {
	clearPlugins();
});

test(" resolve cli options", async done => {
	const plugs = await resolvePlugins({
		plugins: ["./plugins/cli-opts"]
	});

	const options = await resolveCLIOptions(plugs);

	expect(options).toHaveProperty("create");
	expect(options.create.length).toBe(1);
	expect(options.create[0].description).toBe(`Foo [support by ${path.resolve(process.cwd(), "./plugins/cli-opts")}]`);
	expect(options.create[0].defaultValue).toBe("1");

	done();
});

test(" apply plugins => `opts`", async done => {
	let hasErr = false;
	try {
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
		hasErr = false;
	} catch (ex) {
		expect(ex.message).toBe("opts.foo!=='2'");
		hasErr = true;
	}

	expect(hasErr).toBe(true);

	done();
});

test(" apply plugins => `keys`", async done => {
	let hasErr = false;
	try {
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
		hasErr = false;
	} catch (ex) {
		hasErr = true;
	}

	expect(hasErr).toBe(false);

	done();
});

test(" apply plugins => `next start=>process`", async done => {
	let hasErr = false;
	try {
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
		hasErr = false;
	} catch (ex) {
		expect(ex.message).toBe("next start=>process");
		hasErr = true;
	}

	expect(hasErr).toBe(true);

	done();
});

test(" apply plugins => `next process=>complete`", async done => {
	let hasErr = false;
	try {
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
		hasErr = false;
	} catch (ex) {
		expect(ex.message).toBe("next process=>complete");
		hasErr = true;
	}

	expect(hasErr).toBe(true);

	done();
});

test(" apply plugins => `next(ex)`", async done => {
	let hasErr = false;
	try {
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
		hasErr = false;
	} catch (ex) {
		expect(ex.message).toBe("next-err");
		hasErr = true;
	}

	expect(hasErr).toBe(true);

	done();
});

test(" apply plugins => get `pkg` ", async done => {
	let hasErr = false;
	try {
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
		hasErr = false;
	} catch (ex) {
		hasErr = true;
	}

	expect(hasErr).toBe(false);

	done();
});

test(" apply plugins => refresh `pkg` ", async done => {
	let hasErr = false;
	try {
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
		hasErr = false;
	} catch (ex) {
		hasErr = true;
	}

	expect(hasErr).toBe(false);

	done();
});

test(" apply plugins : deps ", async done => {
	let hasErr = false;
	try {
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
		hasErr = false;
	} catch (ex) {
		expect(ex.message).toBe("deps called");
		hasErr = true;
	}

	expect(hasErr).toBe(true);

	done();
});
