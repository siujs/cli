import fs from "fs-extra";
import path from "path";
import sh from "shelljs";

import { downloadGit, getFirstCommitId, getGitRemoteUrl, getPreTag } from "../lib/git";

test(" getFirstCommitId ", async done => {
	const expectedId = "289e90072966ebc2c549a01aab426ffd8b0940b3";

	let id = await getFirstCommitId();
	expect(id).toBe(expectedId);

	id = await getFirstCommitId(true);
	expect(id).toBe(expectedId.substring(0, 7));

	done();
});

test("download Git", async done => {
	const dest = path.resolve(__dirname, "./tpls");
	await downloadGit("https://gitee.com/siujs/tpls", "master", dest);

	let exists = fs.pathExistsSync(path.resolve(dest, "siu.config.js"));
	expect(exists).toBe(true);

	exists = fs.pathExistsSync(path.resolve(dest, ".git"));
	expect(exists).toBe(false);

	sh.rm("-rf", dest);

	done();
}, 600000);

test(" getGitRemoteUrl ", async done => {
	const url = await getGitRemoteUrl(process.cwd());

	expect(url).toBe("https://github.com/siujs/cli");

	done();
});

test(" getPreTag ", async done => {
	const tag = await getPreTag();

	const { stdout } = sh.exec("git tag --list v* --sort -v:refname");

	const tags = stdout.split("\n");

	expect(!!tags).toBe(true);
	expect(tag).toBe(tags[0]);

	done();
});
