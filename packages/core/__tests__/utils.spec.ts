

import { adjustSiuConfigCWD } from "../lib";
import { findUpSiuConfigCwd, sortPkgs } from "../lib/utils";

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

test("findUpSiuConfigCwd", async done => {
	const oldCWD = process.cwd();

	process.chdir(__dirname);

	const targetCWD = await findUpSiuConfigCwd(__dirname);

	process.chdir(oldCWD);

	expect(targetCWD).toBe(__dirname);

	done();
});

test(" sortPkgs ", async done => {
	let dirs = await sortPkgs("auto", "");
	expect(dirs.join(",")).toBe("builtin-build,builtin-deps,builtin-githooks,builtin-publish,cli,cli-init,core,utils");

	dirs = await sortPkgs("priority", "");
	expect(dirs.join(",")).toBe("utils,core,cli-init,builtin-build,builtin-deps,builtin-githooks,builtin-publish,cli");

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
