jest.mock("execa", () => {
	return jest.fn((bin: string, args: string[], options) => {
		console.log(bin, args, options);

		const exec = jest.requireActual("execa");

		args = args || [];

		const isGetGroupedCommittedFiles = args.some((p: string) => p.endsWith("--no-pager"));

		const isGetPreTag = args.some((p: string) => p === "-v:refname");

		const isGetFirstCommitId = args.some((p: string) => p === "--reverse");

		if (isGetGroupedCommittedFiles || isGetPreTag || isGetFirstCommitId) {
			return exec(bin, args, options);
		}

		return {
			stdout: "stdout"
		};
	});
});

jest.mock("fs-extra", () => {
	const fs = jest.requireActual("fs-extra");

	return {
		...fs,
		writeJSON: jest.fn().mockResolvedValue(true),
		writeFile: jest.fn().mockResolvedValue(true)
	};
});

jest.mock("inquirer", () => {
	return {
		prompt: jest.fn(args => {
			if (args.name === "release") {
				return Promise.resolve({ release: "custom" });
			}
			return Promise.resolve({ version: "1.0.0-beta.100" });
		})
	};
});

jest.setTimeout(10000000);

import execa from "execa";
import fs from "fs-extra";

import { release, updateCrossDeps } from "../lib/";

describe(" test 'release' and 'releasePackage' ", () => {
	describe(" test release ", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});
		it("should be called 3 times of 'execa' when dryRun", async done => {
			await release({
				dryRun: true
			});

			expect(execa).toHaveBeenCalledTimes(3);

			done();
		});

		it("should be called 3 times of 'execa' when skipping all", async done => {
			await release({
				skipLint: true,
				skipBuild: true,
				skipCommit: true,
				skipPublish: true,
				skipPush: true
			});

			expect(execa).toHaveBeenCalledTimes(3);

			done();
		});

		it("should be called 4 times of 'execa' when not skip lint ", async done => {
			await release({
				skipLint: false,
				skipBuild: true,
				skipCommit: true,
				skipPublish: true,
				skipPush: true
			});

			expect(execa).toHaveBeenCalled();
			expect(execa).toHaveBeenCalledTimes(4);

			done();
		});

		it("should be called 5 times of 'execa' when not skip lint and build ", async done => {
			await release({
				skipLint: false,
				skipBuild: false,
				skipCommit: true,
				skipPublish: true,
				skipPush: true
			});

			expect(execa).toHaveBeenCalled();
			expect(execa).toHaveBeenCalledTimes(5);

			done();
		});

		it("should be called 7 times of 'execa' when skip publish and push ", async done => {
			await release({
				skipLint: false,
				skipBuild: false,
				skipCommit: false,
				skipPublish: true,
				skipPush: true
			});

			expect(execa).toHaveBeenCalledTimes(7);

			done();
		});

		it("should be called 15 times of 'execa' when skip push ", async done => {
			await release({
				skipLint: false,
				skipBuild: false,
				skipCommit: false,
				skipPublish: false,
				skipPush: true
			});

			expect(execa).toHaveBeenCalledTimes(15);

			done();
		});

		it("should be called 18 times of 'execa' when skip nothing ", async done => {
			await release({
				skipLint: false,
				skipBuild: false,
				skipCommit: false,
				skipPublish: false,
				skipPush: false
			});

			expect(execa).toHaveBeenCalledTimes(18);

			done();
		});
	});

	describe(" test releasePackage ", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});
		it("should be called 'execa' 40 times when use version:independent and dryRun", async done => {
			await release({ version: "independent", dryRun: true, pkgShortName: (pkg: string) => "a" + pkg });
			/**
			 *  valid can release package: 1
			 * 	changelog: 4
			 *
			 *  8*(valid can release package + changelog)
			 */
			expect(execa).toHaveBeenCalledTimes(40);

			done();
		});

		it("should be called 41 times when skip lint、publish 、commit and push", async done => {
			await release({
				version: "independent",
				skipPublish: true,
				skipPush: true,
				skipCommit: true
			});

			expect(execa).toHaveBeenCalledTimes(41);

			done();
		});

		it("should be called 49 times when skip lint、commit and push", async done => {
			/**
			 *  lint: 0
			 *  build: 1
			 *  publish: 1
			 *
			 *  valid can release package: 1
			 * 	changelog: 4
			 *
			 *  total= lint + build + 8*(publish) + 8*(valid can release package + changelog)
			 */

			await release({
				version: "independent",
				skipPush: true,
				skipCommit: true
			});

			expect(execa).toHaveBeenCalledTimes(49);

			done();
		});

		it("should be called 45 times when skip lint+push", async done => {
			/**
			 *  lint: 0
			 *  build: 1
			 *  publish: 1
			 *  commit: 2
			 *
			 *  valid can release package: 1
			 * 	changelog: 4
			 *
			 *  total= lint + build + 8*(publish + commit) + 8*(valid can release package + changelog)
			 */

			await release({
				version: "independent",
				skipPush: true
			});

			expect(execa).toHaveBeenCalledTimes(65);

			done();
		});

		it("should be called 75 times when skip lint", async done => {
			/**
			 *  lint: 0
			 *  build: 1
			 *  publish: 1
			 *  commit: 2
			 *  addTag: 1
			 *  push: 2
			 *
			 *  valid can release package: 1
			 * 	changelog: 4
			 *
			 *  total= lint + build + 8*(publish + commit + addTag) + push + 8*(valid can release package + changelog)
			 */

			await release({
				version: "independent"
			});

			expect(execa).toHaveBeenCalledTimes(75);

			done();
		});
	});

	describe(" test `updateCrossDeps`", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});
		it("should be called 8 times of 'fs.writeJSON'", async done => {
			await updateCrossDeps("1.0.0");

			expect(fs.writeJSON).toHaveBeenCalledTimes(8);

			done();
		});
	});

	afterAll(() => {
		jest.unmock("fs-extra");
		jest.unmock("execa");
	});
});
