import fs from "fs-extra";
import path from "path";
import rm from "rimraf";

import {
	downloadGit,
	execGit,
	getCommittedFiles,
	getFirstCommitId,
	getGitRemoteUrl,
	getGroupedCommits,
	getPreTag,
	getStagedFiles
} from "../lib/git";

describe(" getFirstCommitId test ", () => {
	const expectedFirstCommitId = "289e90072966ebc2c549a01aab426ffd8b0940b3";

	test(" should return full length commit hash ", async done => {
		const id = await getFirstCommitId();
		expect(id).toBe(expectedFirstCommitId);
		done();
	});

	test(" should return the correct 7-bit short hash", async done => {
		const id = await getFirstCommitId(true);
		expect(id).toBe(expectedFirstCommitId.substring(0, 7));
		done();
	});
});

test("should exist `siu.config.js` from https://gitee.com/siujs/tpls#master ", async done => {
	const dest = path.resolve(__dirname, "./tpls");
	await downloadGit("https://gitee.com/siujs/tpls", "master", dest);

	let exists = fs.pathExistsSync(path.resolve(dest, "siu.config.js"));
	expect(exists).toBe(true);

	exists = fs.pathExistsSync(path.resolve(dest, ".git"));
	expect(exists).toBe(false);

	rm.sync(dest);

	done();
}, 600000);

test(" should be `https://github.com/siujs/cli` ", async done => {
	const url = await getGitRemoteUrl(process.cwd());

	expect(url).toBe("https://github.com/siujs/cli");

	done();
});

test(" getPreTag ", async done => {
	const tag = await getPreTag();

	const lines = await execGit(["tag", "--list", "--sort", "-v:refname", "v*"], { all: true });

	const tags = lines.split("\n");

	expect(!!tags).toBe(true);
	expect(tag).toBe(tags[0]);

	done();
});

test(" getCommittedFiles ", async done => {
	const files = await getCommittedFiles(
		"199972e856978b9194db3fec9c3d94bb1445f7ab",
		"18889daf229505554ce55d4e9e4c4e4a92b9dce3"
	);

	expect(files.length).toBe(10);

	expect(files.some(file => file.endsWith("CHANGELOG.md"))).toBe(true);
	expect(files.filter(file => file.endsWith("package.json")).length).toBe(9);

	done();
});

test(" getGroupedCommits ", async done => {
	let commits = await getGroupedCommits(
		"199972e856978b9194db3fec9c3d94bb1445f7ab",
		"18889daf229505554ce55d4e9e4c4e4a92b9dce3"
	);
	expect(commits).toHaveProperty("release");
	expect(commits.release.length).toBe(1);

	commits = await getGroupedCommits("199972e856978b9194db3fec9c3d94bb1445f7ab");
	expect(commits).toHaveProperty("release");
	expect(commits).toHaveProperty("breaking");
	expect(commits).toHaveProperty("feat");
	expect(commits).toHaveProperty("fix");
	expect(commits).toHaveProperty("refactor");
	expect(commits).toHaveProperty("types");
	expect(commits).toHaveProperty("docs");
	done();
});

describe(" getStagedFiles ", () => {
	const testCWD = path.resolve(__dirname, "git.test");

	beforeAll(() => {
		fs.mkdirSync(testCWD, { recursive: true });
	});

	afterAll(() => {
		rm.sync(testCWD);
	});

	it("should get `packages/utils/__tests__/git.test/package.json`", async done => {
		await fs.writeJSON(path.resolve(testCWD, "package.json"), {
			name: "xxx"
		});

		await execGit(["add", path.resolve(testCWD, "package.json")], { cwd: testCWD });

		const files = await getStagedFiles(path.resolve(__dirname, "../../../"));

		await execGit(["restore", "--staged", path.resolve(testCWD, "package.json")], { cwd: testCWD });

		expect(files.length).toBe(1);
		expect(files[0]).toBe(path.resolve(testCWD, "package.json"));

		done();
	});
});
