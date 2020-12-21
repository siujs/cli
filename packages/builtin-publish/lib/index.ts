import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import semver from "semver";

import {
	addGitTag,
	addGitTagOfPackage,
	chooseVersion,
	commitChanges,
	commitChangesOfPackage,
	gitPush,
	npmPublish,
	runWhetherDry,
	updateCrossDeps,
	updatePkgVersion
} from "./utils";

const { log } = console;

export interface ReleaseHookArgs {
	/**
	 * current workspace directory
	 */
	cwd: string;
	/**
	 * current package directory name
	 */
	pkg?: string;
}

export interface ReleaseChangelogHookArgs extends ReleaseHookArgs {
	commits: any[];
}
export interface ReleaseOptions {
	/**
	 *
	 * Target version need to release
	 *
	 *  "independent": Get the package to be updated through diff commits
	 *  default: All packages in one version
	 */
	version?: "independent" | string;
	/**
	 * Whether dry run
	 */
	dryRun?: boolean;
	/**
	 * special repository one or more
	 */
	repo?: string;
	/**
	 * Whether skip step: lint
	 */
	skipLint?: boolean;
	/**
	 * Whether skip step: build
	 */
	skipBuild?: boolean;

	hooks?: {
		lint?: () => Promise<void>;
		build?: (cwd: string, pkg?: string) => Promise<void>;
		changelog?: (cwd: string, pkg?: string) => Promise<void>;
	};
}

const officalNpmRepo = "https://registry.npmjs.org";

export async function releasePackage(
	pkg: string,
	version: string,
	opts = {
		dryRun: false,
		repo: officalNpmRepo
	}
) {
	const cwd = path.resolve(process.cwd(), "packages", pkg);

	const targetVersion = version || (await chooseVersion(cwd));

	if (!semver.valid(targetVersion)) {
		throw new Error(`invalid target version: ${targetVersion}`);
	}

	if (opts.dryRun) {
		log(chalk`{yellow [update ${pkg} version]}: Updating package(${pkg}) version to \`${version}\``);
	} else {
		await updatePkgVersion(targetVersion, cwd);
	}

	await commitChangesOfPackage(targetVersion, cwd, opts.dryRun);

	await npmPublish(cwd, opts.repo, opts.dryRun);

	await addGitTagOfPackage(targetVersion, cwd, opts.dryRun);

	await gitPush(opts.dryRun);

	log(chalk.green(`Successfully publish package(${pkg}) version:\`${targetVersion}\`!`));
}

export async function release(opts: ReleaseOptions) {
	const { skipBuild = false, skipLint = false, version, dryRun = false, repo = officalNpmRepo } = opts;

	const cwd = process.cwd();
	const pkgsRoot = path.resolve(cwd, "packages");

	const run = runWhetherDry(dryRun);

	if (!skipLint) {
		await run("yarn", ["lint"]);
	}

	if (!skipBuild) {
		await run("yarn", ["build"]);
	}

	if (version === "independent") {
		// 每个包的独立部署
	} else {
		const targetVersion = version || (await chooseVersion(cwd));

		if (!semver.valid(targetVersion)) {
			throw new Error(`invalid target version: ${targetVersion}`);
		}

		if (dryRun) {
			log(chalk`{yellow [update version]}: Updating all package version to \`${version}\``);
		} else {
			await updatePkgVersion(targetVersion, cwd);
			await updateCrossDeps(targetVersion, cwd);
		}

		await commitChanges(targetVersion, cwd, dryRun);

		const pkgs = await fs.readdir(pkgsRoot);

		for (let l = pkgs.length; l--; ) {
			await npmPublish(path.resolve(pkgsRoot, pkgs[l]), repo, dryRun);
		}

		await addGitTag(targetVersion, cwd, dryRun);

		await gitPush(dryRun);

		log(chalk.green(`Successfully publish version:\`${targetVersion}\`!`));
	}
}
