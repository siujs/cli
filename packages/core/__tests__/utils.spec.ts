import path from "path";
import sh from "shelljs";

import { adjustSiuConfigCWD } from "../lib";
import { lookupSiu, sortPkgs } from "../lib/utils";
import { createSiuConfigJs, createSiuConfigTs, createSiuPackageJSON } from "./common";

test(" sortPkgs ", async done => {
	let dirs = await sortPkgs("auto", "");
	expect(dirs.join(",")).toBe("builtin-build,builtin-deps,builtin-githooks,builtin-publish,cli,cli-init,core,utils");

	dirs = await sortPkgs("priority", "");
	expect(dirs.join(",")).toBe("utils,core,builtin-build,cli-init,builtin-deps,builtin-githooks,builtin-publish,cli");

	dirs = await sortPkgs(["core,cli,cli-init"], "");
	expect(dirs.join(",")).toBe("core,cli,cli-init");

	dirs = await sortPkgs("auto", "core,utils,builtin-build");
	expect(dirs.join(",")).toBe("builtin-build,core,utils");

	dirs = await sortPkgs("priority", "core,utils,builtin-build");
	expect(dirs.join(",")).toBe("utils,core,builtin-build");

	dirs = await sortPkgs(["core", "cli", "cli-init"], "core,utils,builtin-build");
	expect(dirs.join(",")).toBe("core");

	done();
});

test("adjustSiuConfigCWD", async done => {
	let hasErr = false;
	try {
		await adjustSiuConfigCWD();
	} catch {
		hasErr = true;
	}
	expect(hasErr).toBe(true);

	done();
});

describe("lookup with `siu.config.x` or `siu` in package.json", () => {
	const rootCWD = path.resolve(__dirname, "../../../");

	const currentCWD = path.resolve(__dirname, "__jest__.utils");

	const testCWD = path.resolve(currentCWD, "lookup");

	beforeEach(() => {
		sh.mkdir("-p", currentCWD, testCWD);
		process.chdir(testCWD);
	});

	afterEach(() => {
		process.chdir(rootCWD);
		sh.rm("-rf", currentCWD);
	});

	test(" lookup siu.config.ts ", async done => {
		const clean = await createSiuConfigTs(currentCWD);

		const targetCWD = await lookupSiu(testCWD);

		expect(targetCWD).toBe(currentCWD);

		clean();

		done();
	});

	test(" lookup siu.config.js ", async done => {
		const clean = await createSiuConfigJs(currentCWD);

		const targetCWD = await lookupSiu(testCWD);

		expect(targetCWD).toBe(currentCWD);

		clean();

		done();
	});

	test(" lookup 'siu' in package.json ", async done => {
		const clean = await createSiuPackageJSON(currentCWD);

		const targetCWD = await lookupSiu(testCWD);

		expect(targetCWD).toBe(currentCWD);

		clean();

		done();
	});
});
