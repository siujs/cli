import execa from "execa";
import fs from "fs";
import path from "path";
import rm from "rimraf";

import { createDebugger, execGit } from "@siujs/utils";

import { lintWithGHooks } from "../lib/index";

const debug = createDebugger("siu:githooks");

const cwd = process.cwd();

const tmpFile = path.resolve(cwd, "githooks.tmp.ts");
fs.writeFileSync(tmpFile, `export default;`);

describe(" git client hook: pre-commit ", () => {
	beforeEach(() => {
		jest.resetModules();
		rm.sync(".git/index.lock");
	});

	afterEach(() => {
		rm.sync(".git/index.lock");
		execa.sync("git", ["restore", "--staged", tmpFile]);
	});

	it("should return false when lint 'export default;'", async done => {
		debug("should return false when lint 'export default;'");
		await execGit(["add", tmpFile]);
		const rslt = await lintWithGHooks("preCommit", cwd);
		rm.sync(tmpFile);

		expect(rslt).toBeFalsy();
		done();
	}, 100000);
});
