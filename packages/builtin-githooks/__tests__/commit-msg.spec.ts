import fs from "fs";
import rm from "rimraf";

import { GitClientHooks } from "../lib/hooks";

process.env.DEBUG = "siu:githooks";

describe(" client git hooks: commit-msg ", () => {
	const OLD_ENV = process.env;
	const hook = new GitClientHooks(process.cwd());
	beforeEach(() => {
		process.env = { ...OLD_ENV }; // make a copy
		rm.sync(".git/index.lock");
		jest.resetModules();
	});

	afterEach(() => {
		process.env = OLD_ENV; // restore old env
		rm.sync(".git/index.lock");
	});

	it("should return false when commit msg is not valid ", async done => {
		fs.writeFileSync(".git/COMMIT_EDITMSG", "add tmp js");
		const commitResult = await hook.commitMsg();
		expect(commitResult).toBe(false);
		done();
	});

	it("should return true when commit msg is not valid ", async done => {
		fs.writeFileSync(".git/COMMIT_EDITMSG", "feat: add tmp js");
		let commitResult = await hook.commitMsg();

		expect(commitResult).toBe(true);

		fs.writeFileSync(".git/COMMIT_EDITMSG", "feat(core): add tmp js");
		commitResult = await hook.commitMsg();

		expect(commitResult).toBe(true);

		fs.writeFileSync(".git/COMMIT_EDITMSG", "fix(core): add tmp js");
		commitResult = await hook.commitMsg();

		expect(commitResult).toBe(true);

		done();
	});
});
