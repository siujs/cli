import chalk from "chalk";
import fs from "fs-extra";
import inquirer from "inquirer";
import path from "path";
import semver from "semver";

import {
	exec,
	getFirstCommitId,
	getGitRemoteUrl,
	getGroupedCommits,
	getPackageDirs,
	getPreTag,
	GroupedCommitsItem
} from "@siujs/utils";

const execFnCache = {} as Record<"dryRun" | "run", (bin: string, args: string[], opts?: Record<string, any>) => any>;

export function runWhetherDry(isDryRun?: boolean) {
	return isDryRun
		? execFnCache.dryRun ||
				(execFnCache.dryRun = (bin: string, args: string[], opts = {}) =>
					console.log(chalk.yellow(`[dryrun] ${bin} ${args.join(" ")}`), opts))
		: execFnCache.run ||
				(execFnCache.run = (bin: string, args: string[], opts = {}) => exec(bin, args, { stdio: "inherit", ...opts }));
}

/**
 *
 * Push git commits to server repo
 *
 * 	steps:
 * 		`git push`: push commits
 *  	`git push --tags`: push local tags
 *
 * @param isDryRun whether is dry run
 */
export async function gitPush(isDryRun: boolean) {
	const run = runWhetherDry(isDryRun);
	await run("git", ["push"]);
	await run("git", ["push", "--tags"]);
}

/**
 *
 * Publish package to npm repository
 *
 * @param cwd current workspace directory
 * @param registry specific npm registory url string
 * @param isDryRun whether is dry run
 */
export async function npmPublish(cwd: string, registry: string, isDryRun?: boolean) {
	const run = runWhetherDry(isDryRun);
	await run("npm", ["publish", "--access", "public", "--registry", registry].filter(Boolean), {
		cwd,
		stdio: "inherit"
	});
}

/**
 *
 * Add local git tag
 *
 * @param version new version string, no `v` prefix
 * @param cwd current workspace directory - monorepo project root
 * @param isDryRun whether is dry run
 */
export async function addGitTag(version: string, cwd: string, isDryRun?: boolean) {
	const run = runWhetherDry(isDryRun);
	await run("git", ["tag", `v${version}`], { cwd, stdio: "inherit" });
}

/**
 *
 * Add local git tag only for monorepo package when use `independent` mode
 *
 * @param version new version string, no `v` prefix
 * @param pkgCwd current workspace directory - specific monorepo package root
 * @param isDryRun whether is dry run
 */
export async function addGitTagOfPackage(
	version: string,
	pkgCwd: string | { cwd: string; pkgShortName: string },
	isDryRun?: boolean
) {
	let cwd = "",
		pkgShortName;
	if (typeof pkgCwd === "string") {
		cwd = pkgCwd;
		pkgShortName = path.basename(cwd);
	} else {
		cwd = pkgCwd.cwd;
		pkgShortName = pkgCwd.pkgShortName;
	}

	await runWhetherDry(isDryRun)("git", ["tag", `${pkgShortName}-v${version}`], { cwd, stdio: "inherit" });
}

/**
 *
 * Add and commit local changes to git store
 *
 * @param version new version string, no `v` prefix
 * @param cwd current workspace directory - monorepo project root
 * @param isDryRun whether is dry run
 */
export async function commitChanges(version: string, cwd: string, isDryRun?: boolean) {
	const run = runWhetherDry(isDryRun);
	await run("git", ["add", cwd]);
	await run("git", ["commit", "-m", `release: v${version}`]);
}

/**
 *
 * Add and commit local changes to git store only for monorepo package when use `independent` mode
 *
 * @param version new version string, no `v` prefix
 * @param pkgCwd current  workspace directory - specific monorepo package root
 * @param isDryRun whether is dry run
 */
export async function commitChangesOfPackage(
	version: string,
	pkgCwd: string | { cwd: string; pkgShortName: string },
	isDryRun?: boolean
) {
	const run = runWhetherDry(isDryRun);
	let cwd = "",
		pkgShortName;
	if (typeof pkgCwd === "string") {
		cwd = pkgCwd;
		pkgShortName = path.basename(cwd);
	} else {
		cwd = pkgCwd.cwd;
		pkgShortName = pkgCwd.pkgShortName;
	}

	await run("git", ["add", cwd]);
	await run("git", ["commit", "-m", `chore(release): ${pkgShortName}-v${version}`]);
}

/**
 *
 * Update `version` field in root package.json
 *
 * @param version new version string, no `v` prefix
 * @param cwd current workspace directory - monorepo project root
 */
export async function updatePkgVersion(version: string, cwd: string) {
	const metaPath = path.resolve(cwd, "package.json");

	const pkgData = await fs.readJSON(metaPath);

	pkgData.version = version;

	await fs.writeJSON(metaPath, pkgData, { spaces: 2 });
}

/**
 *
 * Update `version` field of interdependent packages
 *
 * @param version new version string, no `v` prefix
 * @param cwd current workspace directory - monorepo project root
 */
export async function updateCrossDeps(
	version: string,
	extra?: {
		cwd: string;
		workspace?: string;
		pkgs?: string[];
		pkgDatas?: any[];
	}
) {
	extra = {
		cwd: process.cwd(),
		workspace: "packages",
		...(extra || {})
	};

	const pkgsRoot = path.resolve(extra.cwd, extra.workspace);

	if (!extra.pkgs || !extra.pkgs.length) {
		extra.pkgs = await getPackageDirs(extra.cwd, extra.workspace);
	}

	if (!extra.pkgDatas || !extra.pkgDatas.length) {
		extra.pkgDatas = (
			await Promise.all(extra.pkgs.map(dir => fs.readJSON(path.resolve(pkgsRoot, dir, "package.json"))))
		).filter(p => !p.private);
	}

	const pkgMetas = extra.pkgDatas.reduce((prev, meta) => {
		prev[meta.name] = meta;
		return prev;
	}, {}) as Record<string, Record<string, any>>;

	const depTypes = ["dependencies", "peerDependencies"];
	const metas = Object.values(pkgMetas);

	depTypes.forEach(depType => {
		metas.forEach(meta => {
			meta.version = version;

			if (!meta[depType]) return;

			Object.keys(meta[depType]).forEach(key => {
				if (pkgMetas[key]) {
					meta[depType][key] = version;
				}
			});
		});
	});

	await Promise.all([
		...Object.keys(pkgMetas).map((value, index) =>
			fs.writeJSON(path.resolve(pkgsRoot, extra.pkgs[index], "package.json"), pkgMetas[value], { spaces: 2 })
		)
	]);
}

/**
 *
 * @param cwd current workspace directory - monorepo project root  or  specific monorepo package root
 */
export async function chooseVersion(cwd: string, pkg?: string) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const currentVersion = require(path.resolve(cwd, "package.json")).version;

	const preIdArr = semver.prerelease(currentVersion);

	const preId = preIdArr && preIdArr[0];

	const versionIncrements = [
		"patch",
		"minor",
		"major",
		...(preId ? ["prepatch", "preminor", "premajor", "prerelease"] : [])
	] as semver.ReleaseType[];

	const inc = (i: semver.ReleaseType) => semver.inc(currentVersion, i, preId);

	// no explicit version, offer suggestions
	const { release } = await inquirer.prompt({
		type: "list",
		name: "release",
		message: "Select release type" + (pkg ? ` of '${pkg}'` : ""),
		choices: versionIncrements.map(i => `${i} (${inc(i)})`).concat(["custom", "cancel"])
	});

	switch (release) {
		case "custom":
			return (
				await inquirer.prompt({
					type: "input",
					name: "version",
					message: "Input custom version",
					default: currentVersion
				})
			).version;
		/* istanbul ignore next */
		case "cancel":
			return;
		default:
			return release.match(/\((.*)\)/)[1];
	}
}

/**
 *
 *
 *
 * @param item commit item
 * @param remoteUrl [optional] git remote url
 */
export function normalizeChangeLogInlineMsg(item: GroupedCommitsItem, remoteUrl?: string) {
	const ref = /\(#\d+\)/.test(item.header)
		? ""
		: ` ([${item.extra.hash.substring(0, 7)}](${remoteUrl}/commit/${item.extra.hash}))`;
	return (item.scope ? ` **${item.scope}**: ` : "") + item.subject.trim() + ref;
}

/**
 *
 * Get new changelog content
 *
 * @param version new version string, no `v` prefix
 * @param opts generation options
 */
export async function getNewChangedLog(
	version: string,
	opts: {
		cwd?: string;
		versionPrefix?: string;
		allowTypes?: string[];
		type2Title?: Record<string, string>;
		normalizeCommitMsg?: (item: GroupedCommitsItem, remoteUrl?: string) => string;
	} = {
		cwd: process.cwd()
	}
) {
	let tag,
		remoteUrl = "";

	[tag, remoteUrl] = await Promise.all([getPreTag(opts.versionPrefix), getGitRemoteUrl(opts.cwd || process.cwd())]);

	!tag && (tag = await getFirstCommitId(false));

	const groupedCommits = await getGroupedCommits(tag);

	const {
		allowTypes = ["feat", "fix", "perf", "refactor"],
		type2Title = {
			feat: "Features",
			fix: "Bug Fixes",
			perf: "Performance Improvements",
			refactor: "Code Refactoring"
		},
		normalizeCommitMsg = normalizeChangeLogInlineMsg
	} = opts;

	let arr: string[];

	const [date] = new Date().toISOString().split("T");

	const newLog = [`## [v${version}](${remoteUrl}/compare/${tag}...v${version}) (${date})`];

	if (groupedCommits.breaking.length) {
		arr = groupedCommits.breaking.map(item => normalizeCommitMsg(item, remoteUrl)).filter(Boolean);
		if (arr.length) {
			newLog.push(`### BREAKING CHANGES\n\n- ${arr.join("\n- ")}`.trim());
		}
	}

	return Object.keys(groupedCommits)
		.filter(key => allowTypes.includes(key))
		.reduce((prev, type) => {
			arr = groupedCommits[type].map(item => normalizeCommitMsg(item, remoteUrl)).filter(Boolean);
			arr.length && prev.push(`### ${type2Title[type] || type}\n\n- ${arr.join("\n- ")}`.trim());
			return prev;
		}, newLog)
		.filter(Boolean)
		.join("\n\n");
}

/**
 *
 * Append new content to CHANGELOG.md
 *
 * @param newLog new changelog content
 * @param cwd current workspace directory
 *
 * @returns full content
 */
export async function appendChangedLog(newLog: string, cwd: string) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const meta = require(path.resolve(cwd, "package.json"));

	const title = `# ${meta.name} ChangeLog`;

	const logPath = path.resolve(cwd, "CHANGELOG.md");
	const logFile = (await fs.readFile(logPath).catch(() => "")).toString();
	const oldLog = logFile.startsWith(title) ? logFile.slice(title.length).trim() : logFile;

	const content = [title, newLog, oldLog].filter(Boolean).join("\n\n");

	await fs.writeFile(logPath, content, {
		encoding: "utf-8"
	});

	return content;
}

/**
 *
 * Update `CHANGELOG.md` content
 *
 * @param version new version string, no `v` prefix
 * @param cwd current workspace directory - monorepo project root of specific monorepo package root
 * @param pkg [option] specific monorepo package name
 * @param isDryRun whether is dry run
 */
export async function updateChangelog(
	version: string,
	cwd: string,
	pkg?: string | { pkg: string; pkgShortName: string; needScope?: boolean },
	isDryRun?: boolean
) {
	let pkgName = "",
		pkgShortName = "";

	let needScope = true;

	if (typeof pkg === "string") {
		pkgName = pkg;
		needScope = true;
	} else {
		pkg = pkg || { pkg: "", pkgShortName: "" };
		pkgName = pkg.pkg;
		pkgShortName = pkg.pkgShortName;
		needScope = pkg.needScope;
	}

	const opts = pkgName
		? {
				versionPrefix: (pkgShortName || pkgName) + "-",
				normalizeCommitMsg: (item: GroupedCommitsItem, remoteUrl?: string) =>
					!item.scope || pkgName === item.scope || item.scope === pkgShortName
						? normalizeChangeLogInlineMsg(
								needScope ? item : ({ ...item, scope: null } as GroupedCommitsItem),
								remoteUrl
						  )
						: ""
		  }
		: {};

	const newLog = await getNewChangedLog(version, opts);

	if (isDryRun) return newLog;

	return await appendChangedLog(newLog, cwd);
}
