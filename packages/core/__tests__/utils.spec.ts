import path from "path";
import sh from "shelljs";

import { adjustSiuConfigCWD } from "../lib";
import { lookupSiu, sortPkgs } from "../lib/utils";
import { createSiuConfigJs, createSiuPackageJSON } from "./common";

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

describe(" core / lookupSiu with siu.config.x ", () => {
	const oldCWD = process.cwd();
	let clean: () => void;
	const cwd = path.resolve(__dirname, "lookup");

	beforeEach(() => {
		sh.mkdir("-p", cwd);
		process.chdir(cwd);
		clean = createSiuConfigJs(__dirname);
	});

	afterEach(() => {
		process.chdir(oldCWD);
		sh.rm("-rf", cwd);
		clean && clean();
	});

	test(" in __dirname ", async done => {
		const targetCWD = await lookupSiu(cwd);

		expect(targetCWD).toBe(__dirname);

		done();
	});
});

describe(" core / lookupSiu with `siu` in package.json ", () => {
	const oldCWD = process.cwd();
	let clean: () => void;
	const cwd = path.resolve(__dirname, "lookup");

	beforeEach(() => {
		sh.mkdir(cwd);
		process.chdir(cwd);
		clean = createSiuPackageJSON(__dirname);
	});

	afterEach(() => {
		process.chdir(oldCWD);
		sh.rm("-rf", cwd);
		clean && clean();
	});

	test(" in __dirname ", async done => {
		const targetCWD = await lookupSiu(cwd);

		expect(targetCWD).toBe(__dirname);

		done();
	});
});
