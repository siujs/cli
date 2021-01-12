import chalk from "chalk";
import fs from "fs-extra";
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
	 * Whether skip step: publish
	 */
	skipPublish?: boolean;
	/**
	 * Whether skip step: commit
	 */
	skipCommit?: boolean;
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
	/**
	 * current workspace name, default: packages
	 */
	workspace?: string;
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
	workspace: "packages",
	pkg: "",
	dryRun: false,
	repo: officalNpmRepo,
	hooks: DEFAULT_HOOKS,
	skipLint: true,
	skipBuild: false,
	skipPublish: false,
	skipCommit: false,
	skipPush: false
};

export async function releasePackage(pkg: string, opts: Omit<ReleaseOptions, "version"> & { valid?: boolean }) {
	const workspace = opts.workspace || DEFAULT_OPTIONS.workspace;

	const cwd = path.resolve(process.cwd(), workspace, pkg);

	if (opts.valid !== false) {
		const isOK = await fs.pathExists(path.resolve(cwd, "package.json"));
		/* istanbul ignore if */
		if (!isOK) {
			console.warn(chalk.yellow(`[siu] Warning: '${pkg}'`) + "is not a valid package,missing package.json");
			return;
		}

		const meta = await fs.readJSON(path.resolve(cwd, "package.json"));
		/* istanbul ignore if */
		if (meta && meta.private) {
			console.warn(
				chalk.yellow(`[siu] Warning: '${pkg}'`) + "is a private package that does not allowed to be published"
			);
			return;
		}
	}

	const tag = await getPreTag(`${pkg}-`);

	let targetVersion: string;

	/* istanbul ignore if */
	if (tag) {
		const commitFiles = await getCommittedFiles(tag, "HEAD", cwd);

		const hasPkgFile = commitFiles.filter(p => {
			p.endsWith("package.json") || p.startsWith(`${workspace}/${pkg}/lib`) || p.startsWith(`${workspace}/${pkg}/src`);
		});

		if (hasPkgFile) {
			targetVersion = await chooseVersion(cwd, pkg);
		}
	} else {
		targetVersion = await chooseVersion(cwd, pkg);
	}

	/* istanbul ignore if */
	if (!targetVersion) return;

	/* istanbul ignore if */
	if (!semver.valid(targetVersion)) {
		throw new Error(`invalid target version: ${targetVersion}`);
	}

	opts.dryRun
		? log(chalk`{yellow [dryrun] update ${pkg} version}: Updating package(${pkg}) version to \`${targetVersion}\``)
		: await updatePkgVersion(targetVersion, cwd);

	!opts.skipPublish &&
		opts.hooks &&
		opts.hooks.publish &&
		(await opts.hooks.publish({ cwd, repo: opts.repo, dryRun: opts.dryRun }));

	opts.hooks &&
		opts.hooks.changelog &&
		(await opts.hooks.changelog({ cwd, version: targetVersion, dryRun: opts.dryRun, pkg }));

	!opts.skipCommit && (await commitChangesOfPackage(targetVersion, cwd, opts.dryRun));

	!opts.skipPush && (await addGitTagOfPackage(targetVersion, cwd, opts.dryRun));

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

	const { pkg, version, dryRun, repo = officalNpmRepo, hooks, ...skips } = opts;

	if (dryRun) {
		log(chalk`{magenta DRY RUN}: No files will be modified`);
	}

	const cwd = process.cwd();

	!skips.skipLint && hooks && hooks.lint && (await hooks.lint({ cwd, dryRun }));

	!skips.skipBuild && hooks && hooks.build && (await hooks.build({ cwd, dryRun }));

	if (version === "independent" || (!version && pkg)) {
		const pkgs = pkg ? pkg.split(",") : await getSortedPkgByPriority(process.cwd(), opts.workspace);
		for (let l = pkgs.length; l--; ) {
			await releasePackage(pkgs[l], opts);
		}
		!skips.skipPush && (await gitPush(dryRun));
	} else {
		const pkgsRoot = path.resolve(cwd, opts.workspace || DEFAULT_OPTIONS.workspace);

		const targetVersion = version || (await chooseVersion(cwd));

		/* istanbul ignore if */
		if (!targetVersion) return;

		/* istanbul ignore if */
		if (!semver.valid(targetVersion)) {
			throw new Error(`invalid target version: ${targetVersion}`);
		}

		const pkgs = await getSortedPkgByPriority(process.cwd(), opts.workspace);

		const pkgDatas = await Promise.all(pkgs.map(pkg => fs.readJSON(path.resolve(pkgsRoot, pkg, "package.json"))));

		// private:true package can't be published
		for (let l = pkgs.length; l--; ) {
			/* istanbul ignore if */
			if (pkgDatas[l].private) {
				log(chalk`{magenta Warning}: "${pkgs[l]}" is a private package that does not allowed to be published`);
				pkgs.splice(l, 1);
				pkgDatas.splice(l, 1);
			}
		}

		/* istanbul ignore if */
		if (!pkgs.length) {
			log(chalk`{red [siu] Error:} No package that to be published!`);
			return;
		}

		if (dryRun) {
			log(chalk`{yellow [dryrun] update version}: Updating all package version to \`${targetVersion}\``);
		} else {
			await updatePkgVersion(targetVersion, cwd);
			await updateCrossDeps(targetVersion, {
				cwd,
				pkgs,
				pkgDatas
			});
		}

		if (!skips.skipPublish) {
			for (let i = 0; i < pkgs.length; i++) {
				hooks && hooks.publish && (await hooks.publish({ repo, cwd: path.resolve(pkgsRoot, pkgs[i]), dryRun }));
			}
		}

		hooks && hooks.changelog && (await hooks.changelog({ version: targetVersion, cwd, dryRun }));

		!skips.skipCommit && (await commitChanges(targetVersion, cwd, dryRun));

		if (!skips.skipPush) {
			await addGitTag(targetVersion, cwd, dryRun);
			await gitPush(dryRun);
		}

		log(chalk.green(`Successfully publish version:\`${targetVersion}\`!`));
	}
}

export * from "./utils";
