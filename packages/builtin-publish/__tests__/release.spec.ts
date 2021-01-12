jest.mock("execa", () => {
	return jest.fn((bin, args, options) => {
		console.log(bin, args, options);
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
		it("should not be called of 'execa' when dryRun", async done => {
			await release({
				dryRun: true
			});

			expect(execa).not.toHaveBeenCalled();

			done();
		});

		it("should not be called of 'execa' when skipping all", async done => {
			await release({
				skipLint: true,
				skipBuild: true,
				skipCommit: true,
				skipPublish: true,
				skipPush: true
			});

			expect(execa).not.toHaveBeenCalled();

			done();
		});

		it("should be called 1 times of 'execa' when not skip lint ", async done => {
			await release({
				skipLint: false,
				skipBuild: true,
				skipCommit: true,
				skipPublish: true,
				skipPush: true
			});

			expect(execa).toHaveBeenCalled();
			expect(execa).toHaveBeenCalledTimes(1);

			done();
		});

		it("should be called 2 times of 'execa' when not skip lint and build ", async done => {
			await release({
				skipLint: false,
				skipBuild: false,
				skipCommit: true,
				skipPublish: true,
				skipPush: true
			});

			expect(execa).toHaveBeenCalled();
			expect(execa).toHaveBeenCalledTimes(2);

			done();
		});

		it("should be called 4 times of 'execa' when skip publish and push ", async done => {
			await release({
				skipLint: false,
				skipBuild: false,
				skipCommit: false,
				skipPublish: true,
				skipPush: true
			});

			expect(execa).toHaveBeenCalled();
			expect(execa).toHaveBeenCalledTimes(4);

			done();
		});

		it("should be called 12 times of 'execa' when skip push ", async done => {
			await release({
				skipLint: false,
				skipBuild: false,
				skipCommit: false,
				skipPublish: false,
				skipPush: true
			});

			expect(execa).toHaveBeenCalled();
			expect(execa).toHaveBeenCalledTimes(12);

			done();
		});

		it("should be called 12 times of 'execa' when skip nothing ", async done => {
			await release({
				skipLint: false,
				skipBuild: false,
				skipCommit: false,
				skipPublish: false,
				skipPush: false
			});

			expect(execa).toHaveBeenCalled();
			expect(execa).toHaveBeenCalledTimes(15);

			done();
		});
	});

	describe(" test releasePackage ", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});
		it("should not be called 'execa' when use version:independent and dryRun", async done => {
			await release({ version: "independent", dryRun: true });

			expect(execa).not.toHaveBeenCalled();

			done();
		});

		it("should be called 1 times when skip lint、publish 、commit and push", async done => {
			await release({
				version: "independent",
				skipPublish: true,
				skipPush: true,
				skipCommit: true
			});

			expect(execa).toHaveBeenCalled();
			expect(execa).toHaveBeenCalledTimes(1);

			done();
		});

		it("should be called 9 times when skip lint、commit and push", async done => {
			/**
			 *  lint: 0
			 *  build: 1
			 *  publish: 1
			 *
			 *  total= lint + build + 8*(publish)
			 */

			await release({
				version: "independent",
				skipPush: true,
				skipCommit: true
			});

			expect(execa).toHaveBeenCalled();
			expect(execa).toHaveBeenCalledTimes(9);

			done();
		});

		it("should be called 25 times when skip lint+push", async done => {
			/**
			 *  lint: 0
			 *  build: 1
			 *  publish: 1
			 *  commit: 2
			 *
			 *  total= lint + build + 8*(publish + commit)
			 */

			await release({
				version: "independent",
				skipPush: true
			});

			expect(execa).toHaveBeenCalled();
			expect(execa).toHaveBeenCalledTimes(25);

			done();
		});

		it("should be called 35 times when skip lint", async done => {
			/**
			 *  lint: 0
			 *  build: 1
			 *  publish: 1
			 *  commit: 2
			 *  addTag: 1
			 *  push: 2
			 *
			 *  total= lint + build + 8*(publish + commit + addTag) + push
			 */

			await release({
				version: "independent"
			});

			expect(execa).toHaveBeenCalled();
			expect(execa).toHaveBeenCalledTimes(35);

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
