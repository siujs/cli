import fs from "fs";
import rm from "rimraf";

import { lintWithGHooks } from "../lib";

process.env.DEBUG = "siu:githooks";

describe(" client git hooks: prepare-commit-msg ", () => {
	beforeEach(() => {
		jest.resetModules();
		rm.sync(".git/COMMIT_EDITMSG2");
	});

	afterEach(() => {
		rm.sync(".git/COMMIT_EDITMSG2");
	});

	it("should return appended message ", async done => {
		fs.writeFileSync(".git/COMMIT_EDITMSG2", "add tmp js");

		await lintWithGHooks("prepareCommitMsg", {
			commitEditMsg: ".git/COMMIT_EDITMSG2",
			handlers: {
				prepareCommitMsg(msg: string) {
					return msg + " Test";
				}
			}
		});

		expect(fs.readFileSync(".git/COMMIT_EDITMSG2").toString()).toBe("add tmp js Test");

		done();
	});
});
