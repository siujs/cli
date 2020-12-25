import chalk from "chalk";
import path from "path";
import semver from "semver";

import { getCommittedFiles, getPreTag, getSortedPkgByPriority } from "@siujs/utils";

import {
	addGitTag,
	addGitTagOfPackage,
	chooseVersion,
	commitChanges,
	commitChangesOfPackage,
	gitPush,
	npmPublish,
	runWhetherDry,
	updateChangelog,
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
	 *
	 * Target packages need to release
	 *
	 *  e.g : foo、foo,bar
	 *
	 */
	pkg?: string;
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
	/**
	 * Whether skip step: push
	 */
	skipPush?: boolean;
	/**
	 * custom hooks
	 */
	hooks?: {
		lint?: (opts: { cwd: string; dryRun?: boolean }) => Promise<void>;
		build?: (opts: { cwd: string; dryRun?: boolean }) => Promise<void>;
		changelog?: (opts: { cwd: string; version: string; dryRun?: boolean; pkg?: string }) => Promise<void>;
		publish?: (opts: { cwd: string; repo: string; dryRun?: boolean }) => Promise<void>;
	};
}

const DEFAULT_HOOKS = {
	async lint({ cwd, dryRun }: { cwd: string; dryRun?: boolean }) {
		await runWhetherDry(dryRun)("yarn", ["lint"], { cwd });
	},
	async build({ cwd, dryRun }: { cwd: string; dryRun?: boolean }) {
		await runWhetherDry(dryRun)("yarn", ["build"], { cwd });
	},
	async changelog({ cwd, version, pkg, dryRun }: { cwd: string; version: string; pkg?: string; dryRun?: boolean }) {
		const content = await updateChangelog(version, cwd, pkg, dryRun);
		if (dryRun) {
			log(chalk`{yellow [dryrun] New ChangeLog}: \n ${content}`);
		}
	},
	async publish({ cwd, repo, dryRun }: { cwd: string; repo: string; dryRun?: boolean }) {
		await npmPublish(cwd, repo, dryRun);
	}
} as {
	lint?: (opts: { cwd: string; dryRun?: boolean }) => Promise<void>;
	build?: (opts: { cwd: string; dryRun?: boolean }) => Promise<void>;
	changelog?: (opts: { cwd: string; version: string; dryRun?: boolean; pkg?: string }) => Promise<void>;
	publish?: (opts: { cwd: string; repo: string; dryRun?: boolean }) => Promise<void>;
};

const officalNpmRepo = "https://registry.npmjs.org";

const DEFAULT_OPTIONS = {
	pkg: "",
	skipBuild: false,
	skipLint: false,
	skipPush: false,
	dryRun: false,
	repo: officalNpmRepo,
	hooks: DEFAULT_HOOKS
};

export async function releasePackage(pkg: string, opts: Omit<ReleaseOptions, "version">) {
	const cwd = path.resolve(process.cwd(), "packages", pkg);

	const tag = await getPreTag(`${pkg}-`);

	let targetVersion: string;

	if (!tag) {
		targetVersion = await chooseVersion(cwd);
	} else {
		const commitFiles = await getCommittedFiles(tag, "HEAD", cwd);

		const hasPkgFile = commitFiles.filter(p => {
			p.endsWith("package.json") || p.startsWith(`packages/${pkg}/lib`) || p.startsWith(`packages/${pkg}/src`);
		});

		if (hasPkgFile) {
			targetVersion = await chooseVersion(cwd);
		}
	}

	if (!targetVersion) return;

	if (!semver.valid(targetVersion)) {
		throw new Error(`invalid target version: ${targetVersion}`);
	}

	if (opts.dryRun) {
		log(chalk`{yellow [dryrun] update ${pkg} version}: Updating package(${pkg}) version to \`${targetVersion}\``);
	} else {
		await updatePkgVersion(targetVersion, cwd);
	}

	opts.hooks &&
		opts.hooks.changelog &&
		(await opts.hooks.changelog({ cwd, version: targetVersion, dryRun: opts.dryRun, pkg }));

	await commitChangesOfPackage(targetVersion, cwd, opts.dryRun);

	opts.hooks && opts.hooks.publish && (await opts.hooks.publish({ cwd, repo: opts.repo, dryRun: opts.dryRun }));

	if (!opts.skipPush) {
		await addGitTagOfPackage(targetVersion, cwd, opts.dryRun);
		await gitPush(opts.dryRun);
	}

	log(chalk.green(`Successfully publish package(${pkg}) version:\`${targetVersion}\`!`));
}

export async function release(opts: ReleaseOptions) {
	opts = {
		...DEFAULT_OPTIONS,
		...opts,
		hooks: {
			...DEFAULT_HOOKS,
			...(opts.hooks || {})
		}
	};

	const { pkg, skipBuild, skipLint, skipPush, version, dryRun, repo = officalNpmRepo, hooks } = opts;

	if (dryRun) {
		log(chalk`{magenta DRY RUN}: No files will be modified`);
	}

	const cwd = process.cwd();
	const pkgsRoot = path.resolve(cwd, "packages");

	if (!skipLint) {
		hooks && hooks.lint && (await hooks.lint({ cwd, dryRun }));
	}

	if (!skipBuild) {
		hooks && hooks.build && (await hooks.build({ cwd, dryRun }));
	}

	if (version === "independent" || (!version && pkg)) {
		let dirs: string[];

		if (!pkg) {
			dirs = await getSortedPkgByPriority();
		} else {
			dirs = pkg.split(",");
		}

		for (let l = dirs.length; l--; ) {
			await releasePackage(dirs[l], opts);
		}
	} else {
		const targetVersion = version || (await chooseVersion(cwd));

		if (!semver.valid(targetVersion)) {
			throw new Error(`invalid target version: ${targetVersion}`);
		}

		if (dryRun) {
			log(chalk`{yellow [dryrun] update version}: Updating all package version to \`${targetVersion}\``);
		} else {
			await updatePkgVersion(targetVersion, cwd);
			await updateCrossDeps(targetVersion, cwd);
		}

		hooks && hooks.changelog && (await hooks.changelog({ version: targetVersion, cwd, dryRun }));

		await commitChanges(targetVersion, cwd, dryRun);

		const pkgs = await getSortedPkgByPriority();

		for (let l = 0; l < pkgs.length; l++) {
			hooks && hooks.publish && (await hooks.publish({ repo, cwd: path.resolve(pkgsRoot, pkgs[l]), dryRun }));
		}

		if (!skipPush) {
			await addGitTag(targetVersion, cwd, dryRun);
			await gitPush(dryRun);
		}

		log(chalk.green(`Successfully publish version:\`${targetVersion}\`!`));
	}
}

export * from "./utils";
