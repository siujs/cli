import fs from "fs";
import path from "path";
import rm from "rimraf";

import { execGit } from "@siujs/utils";

import { GitClientHooks } from "../lib/hooks";

const cwd = process.cwd();

const tmpFile = path.resolve(cwd, "_tmp_.ts");
const tmpFile2 = path.resolve(cwd, "_tmp2_.ts");
const tmpFile3 = path.resolve(cwd, "_tmp3_.ts");
fs.writeFileSync(tmpFile, `export default;`);
fs.writeFileSync(tmpFile2, `export default {}`);
fs.writeFileSync(tmpFile3, `export default {a}`);

describe("test GitClientHooks.preCommit", () => {
	afterAll(() => {
		rm.sync(tmpFile);
		rm.sync(tmpFile2);
		rm.sync(tmpFile3);
	});

	const hook = new GitClientHooks(cwd);

	it("should return false when lint 'export default;'", async done => {
		execGit(["add", tmpFile]);

		const rslt = await hook.preCommit();

		execGit(["restore", "--staged", tmpFile]);

		expect(rslt).toBeFalsy();

		done();
	}, 100000);

	it("should return true when lint 'export default {}'", async done => {
		execGit(["add", tmpFile2]);

		const rslt = await hook.preCommit();

		execGit(["restore", "--staged", tmpFile2]);

		expect(rslt).toBeTruthy();

		done();
	}, 100000);

	it("should return true when lint 'export default {}' & 'export default {a}'", async done => {
		execGit(["add", tmpFile2, tmpFile3]);

		const rslt = await hook.preCommit();

		execGit(["restore", "--staged", tmpFile2, tmpFile3]);

		expect(rslt).toBeTruthy();

		done();
	}, 100000);
});
