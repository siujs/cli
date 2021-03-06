import execa from "execa";
import fs from "fs";
import { resolve } from "path";
import rm from "rimraf";

import { execGit } from "@siujs/utils";
import { createDebugger } from "@siujs/utils/lib";

import { GitClientHooks } from "../lib/hooks";

const debug = createDebugger("siu:githooks");

describe(" client git hooks: post-commit ", () => {
	const tmpFile = resolve(__dirname, "post-commit.tmp.js");

	beforeAll(() => {
		fs.writeFileSync(tmpFile, "");
		execa.sync("git", ["config", "--add", "user.name", "buns"]);
		execa.sync("git", ["config", "--add", "user.email", "kuafujs@126.com"]);
	});

	beforeEach(() => {
		jest.resetModules();
		rm.sync(".git/index.lock");
		rm.sync(".git/COMMIT_EDITMSG");
	});

	afterAll(() => {
		rm.sync(tmpFile);
		execa.sync("git", ["reset", "--mixed", "HEAD^"]);
		rm.sync(".git/COMMIT_EDITMSG");
	});

	it("should get valid commit info  ", async done => {
		debug("should get valid commit info");

		await execGit(["add", tmpFile]);
		await execGit(["commit", "-m", "feat: add tmp.js"]);

		const hook = new GitClientHooks(process.cwd(), {
			postCommit(committedInfo) {
				expect(!!committedInfo.files).toBeTruthy();
				expect(!!committedInfo.files.length).toBeTruthy();
				expect(committedInfo.files.some(p => p === tmpFile)).toBeTruthy();

				done();

				return true;
			}
		});

		await hook.postCommit();
	});
});
