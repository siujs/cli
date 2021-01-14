jest.mock("execa", () => {
	return jest.fn((bin, args, options) => {
		console.log(bin, args, options);
		return {
			stdout: "stdout"
		};
	});
});

import exec from "execa";
import path from "path";

import { changeDeps } from "../lib/index";
import { getPkgMeta, isLocalPackage, normalizeDepStr, transformDepStr } from "../lib/utils";

describe(" test 'transformDepStr' ", () => {
	it("should get `latest` with dep:'foo'", () => {
		const deps = transformDepStr("foo");
		expect(deps.name).toBe("foo");
		expect(deps.version).toBe("latest");
	});

	it("should get `latest` with dep:'foo:D'", () => {
		const deps = transformDepStr("foo:D");
		expect(deps.name).toBe("foo");
		expect(deps.version).toBe("latest");
	});

	it("should get `1.1.1` with dep:'foo@1.1.1'", () => {
		const deps = transformDepStr("foo@1.1.1");
		expect(deps.name).toBe("foo");
		expect(deps.version).toBe("1.1.1");
	});

	it("should get `1.1.1` with dep:'foo@1.1.1:D'", () => {
		const deps = transformDepStr("foo@1.1.1:D");
		expect(deps.name).toBe("foo");
		expect(deps.version).toBe("1.1.1");
	});

	it("should get empty with unvalid dep string", () => {
		let deps = transformDepStr("@1.1.1");
		expect(!!deps).toBeFalsy();

		deps = transformDepStr("@");
		expect(!!deps).toBeFalsy();

		deps = transformDepStr(":D");
		expect(!!deps).toBeFalsy();
	});
});

describe(" test 'normalizeDepStr' ", () => {
	it("should return valid dep map data without scoped package", () => {
		const map = normalizeDepStr("foo,foo2:D,foo3@1.0.0,foo4@1.0.0:D,@noscoped");

		expect(map).toHaveProperty("deps");
		expect(map.deps.length).toBe(2);
		expect(map.deps[0].name).toBe("foo");
		expect(map.deps[0].version).toBe("latest");
		expect(map.deps[1].name).toBe("foo3");
		expect(map.deps[1].version).toBe("1.0.0");

		expect(map).toHaveProperty("devDeps");
		expect(map.devDeps.length).toBe(2);

		expect(map.devDeps[0].name).toBe("foo2");
		expect(map.devDeps[0].version).toBe("latest");
		expect(map.devDeps[1].name).toBe("foo4");
		expect(map.devDeps[1].version).toBe("1.0.0");
	});

	it("should return @foo/xxx when dep string has item which startsWith '@foo/'", () => {
		const map = normalizeDepStr("@foo/bar,@foo/bar2:D,@foo/bar3@1.0.0,@foo/bar4@1.0.0:D,@noscoped");

		expect(map).toHaveProperty("deps");
		expect(map.deps.length).toBe(2);
		expect(map.deps[0].name).toBe("@foo/bar");
		expect(map.deps[0].version).toBe("latest");
		expect(map.deps[1].name).toBe("@foo/bar3");
		expect(map.deps[1].version).toBe("1.0.0");

		expect(map).toHaveProperty("devDeps");
		expect(map.devDeps.length).toBe(2);

		expect(map.devDeps[0].name).toBe("@foo/bar2");
		expect(map.devDeps[0].version).toBe("latest");
		expect(map.devDeps[1].name).toBe("@foo/bar4");
		expect(map.devDeps[1].version).toBe("1.0.0");
	});
});

describe(" test 'isLocalPackage' ", () => {
	const depsVersion = require(path.resolve(process.cwd(), "packages", "builtin-deps", "package.json")).version;

	it("should be equals 'depsVersion' when called is `@siujs/builtin-deps`", async done => {
		const version = await isLocalPackage("@siujs/builtin-deps");
		expect(version).toBe(depsVersion);
		done();
	});

	it("should return empty string when called is `@siujs/builtin-deps2`", async done => {
		const version = await isLocalPackage("@siujs/builtin-deps2");
		expect(version).toBe("");
		done();
	});
});

describe(" test 'getPkgMeta' ", () => {
	it("should return package data of 'builtin-deps'", async done => {
		const meta = await getPkgMeta("builtin-deps");

		expect(meta).toHaveProperty("name");
		expect(meta.name).toBe("@siujs/builtin-deps");
		expect(meta).toHaveProperty("main");
		expect(meta).toHaveProperty("module");
		expect(meta.main).toBe("dist/index.js");
		expect(meta.module).toBe("dist/index.mjs");

		done();
	});
});

describe(" test 'changeDeps' ", () => {
	it("should be called 1 time of 'exec' when use action=rm", async done => {
		await changeDeps("builtin-deps", "debug", "rm");
		expect(exec).toHaveBeenCalled();
		expect(exec).toHaveBeenCalledTimes(1);
		done();
	});

	it("should not be called of 'exec' when use action=add and valid dep string ", async done => {
		await changeDeps("builtin-deps", "@xx", "add");
		expect(exec).not.toHaveBeenCalled();
		done();
	});

	it("should be called 1 times of 'exec' when use action=add and dep string without ':D' ", async done => {
		await changeDeps("builtin-deps", "debug");
		expect(exec).toHaveBeenCalled();
		expect(exec).toHaveBeenCalledTimes(1);
		done();
	});

	it("should be called 2 times of 'exec' when use action=add and dep string with ':D' ", async done => {
		await changeDeps("builtin-deps", "@siujs/utils,foo:D");
		expect(exec).toHaveBeenCalled();
		expect(exec).toHaveBeenCalledTimes(2);
		done();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.unmock("execa");
	});
});
