import chalk from "chalk";
import execa from "execa";
import fs from "fs-extra";
import inquirer from "inquirer";
import path from "path";
import semver from "semver";

import { getFirstCommitId, getGitRemoteUrl, getGroupedCommits, getPreTag, GroupedCommitsItem } from "@siujs/utils";

const execFnCache = {} as Record<"dryRun" | "run", (bin: string, args: string[], opts?: Record<string, any>) => any>;

export function runWhetherDry(isDryRun?: boolean) {
	return isDryRun
		? execFnCache.dryRun ||
				(execFnCache.dryRun = (bin: string, args: string[], opts = {}) =>
					console.log(chalk.yellow(`[dryrun] ${bin} ${args.join(" ")}`), opts))
		: execFnCache.run ||
				(execFnCache.run = (bin: string, args: string[], opts = {}) => execa(bin, args, { stdio: "inherit", ...opts }));
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
export async function addGitTagOfPackage(version: string, pkgCwd: string, isDryRun?: boolean) {
	const run = runWhetherDry(isDryRun);
	await run("git", ["tag", `${path.basename(pkgCwd)}-v${version}`], { cwd: pkgCwd, stdio: "inherit" });
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
export async function commitChangesOfPackage(version: string, pkgCwd: string, isDryRun?: boolean) {
	const run = runWhetherDry(isDryRun);
	await run("git", ["add", pkgCwd]);
	await run("git", ["commit", "-m", `chore(release): ${path.basename(pkgCwd)}-v${version}`]);
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
export async function updateCrossDeps(version: string, cwd: string) {
	const pkgRoot = path.resolve(cwd, "packages");

	const meta = await fs.readJSON(path.resolve(cwd, "package.json"));
	meta.version = version;

	const pkgDirs = await fs.readdir(pkgRoot);

	const pkgMetas = (
		await Promise.all(pkgDirs.map(dir => fs.readJSON(path.resolve(pkgRoot, dir, "package.json"))))
	).reduce((prev, meta) => {
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
			fs.writeJSON(path.resolve(pkgRoot, pkgDirs[index], "package.json"), pkgMetas[value], { spaces: 2 })
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

	let targetVersion = "";

	// no explicit version, offer suggestions
	const { release } = await inquirer.prompt({
		type: "list",
		name: "release",
		message: "Select release type" + pkg ? ` of '${pkg}'` : "",
		choices: versionIncrements.map(i => `${i} (${inc(i)})`).concat(["custom"])
	});

	if (release === "custom") {
		targetVersion = (
			await inquirer.prompt({
				type: "input",
				name: "version",
				message: "Input custom version",
				default: currentVersion
			})
		).version;
	} else {
		targetVersion = release.match(/\((.*)\)/)[1];
	}

	return targetVersion;
}

function changelogMsgNormalize(item: GroupedCommitsItem, remoteUrl?: string) {
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
		allowTypes?: string[];
		type2Title?: Record<string, string>;
		normalizeCommitMsg?: (item: GroupedCommitsItem, remoteUrl?: string) => string;
	} = {}
) {
	let tag = await getPreTag();

	!tag && (tag = await getFirstCommitId(false));

	const remoteUrl = await getGitRemoteUrl(process.cwd());

	const [date] = new Date().toISOString().split("T");

	const newLog = [`## [v${version}](${remoteUrl}/compare/${tag}...v${version}) (${date})`];

	const groupedCommits = await getGroupedCommits(tag);

	const {
		allowTypes = ["feat", "fix", "perf", "refactor"],
		type2Title = {
			feat: "Features",
			fix: "Bug Fixes",
			perf: "Performance Improvements",
			refactor: "Code Refactoring"
		},
		normalizeCommitMsg = changelogMsgNormalize
	} = opts;

	let arr: string[];

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
 * Update `CHANGELOG.md` content
 *
 * @param version new version string, no `v` prefix
 * @param cwd current workspace directory - monorepo project root of specific monorepo package root
 * @param pkg [option] specific monorepo package name
 * @param isDryRun whether is dry run
 */
export async function updateChangelog(version: string, cwd: string, pkg?: string, isDryRun?: boolean) {
	const newLog = await getNewChangedLog(
		version,
		pkg
			? {
					normalizeCommitMsg(item: GroupedCommitsItem, remoteUrl?: string) {
						if (pkg && item.scope !== pkg) return "";
						return changelogMsgNormalize(item, remoteUrl);
					}
			  }
			: {}
	);

	if (isDryRun) return newLog;

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
