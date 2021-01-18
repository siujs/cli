import fs from "fs";

import { lintWithGHooks } from "../lib";

process.env.DEBUG = "siu:githooks";

describe(" client git hooks: prepare-commit-msg ", () => {
	beforeEach(() => {
		jest.resetModules();
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
