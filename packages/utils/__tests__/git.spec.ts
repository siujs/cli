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

describe(" getCommittedFiles ", () => {
	it("should exists 'CHANGELOG.md'", async done => {
		const files = await getCommittedFiles(
			"199972e856978b9194db3fec9c3d94bb1445f7ab",
			"18889daf229505554ce55d4e9e4c4e4a92b9dce3"
		);

		expect(files.some(file => file.endsWith("CHANGELOG.md"))).toBe(true);
		expect(files.filter(file => file.endsWith("package.json")).length).toBe(9);

		done();
	});

	it("should exists 'CHANGELOG.md', when endHash is HEAD", async done => {
		const files = await getCommittedFiles("199972e856978b9194db3fec9c3d94bb1445f7ab");

		expect(files.some(file => file.endsWith("CHANGELOG.md"))).toBe(true);
		expect(files.some(file => file.endsWith("package.json"))).toBe(true);

		done();
	}, 60000);
});

describe("getGroupedCommits", () => {
	it("should return have 1 release", async done => {
		const commits = await getGroupedCommits(
			"199972e856978b9194db3fec9c3d94bb1445f7ab",
			"18889daf229505554ce55d4e9e4c4e4a92b9dce3"
		);
		expect(commits).toHaveProperty("release");
		expect(commits.release.length).toBe(1);

		done();
	});

	it("should have 'release'、'breaking'、'feat'、'fix'、'refactor'...", async done => {
		const commits = await getGroupedCommits("199972e856978b9194db3fec9c3d94bb1445f7ab");
		expect(commits).toHaveProperty("release");
		expect(commits).toHaveProperty("breaking");
		expect(commits).toHaveProperty("feat");
		expect(commits).toHaveProperty("fix");
		expect(commits).toHaveProperty("refactor");
		expect(commits).toHaveProperty("types");
		expect(commits).toHaveProperty("docs");

		done();
	});

	it("should have committed files ", async done => {
		const commits = await getGroupedCommits("199972e856978b9194db3fec9c3d94bb1445f7ab", "HEAD", true);
		expect(commits.release.length >= 1).toBeTruthy();
		expect(commits.release[0]).toHaveProperty("files");
		expect(commits.release[0].files.some(p => p.endsWith("package.json"))).toBeTruthy();
		done();
	}, 60000);
});

describe(" getStagedFiles ", () => {
	const testCWD = path.resolve(__dirname, "git.test");

	beforeAll(() => {
		fs.mkdirSync(testCWD, { recursive: true });
		rm.sync(".git/index.lock");
	});

	afterAll(() => {
		rm.sync(testCWD);
	});

	it("should get `packages/utils/__tests__/git.test/package.json`", async done => {
		const filePath = path.resolve(testCWD, "package.json");

		await fs.writeJSON(filePath, {
			name: "xxx"
		});

		await execGit(["add", filePath], { cwd: testCWD });

		const files = await getStagedFiles(path.resolve(__dirname, "../../../"));

		await execGit(["restore", "--staged", filePath], { cwd: testCWD });

		expect(files.some(file => file === filePath)).toBeTruthy();

		done();
	});
});
