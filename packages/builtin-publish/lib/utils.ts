import chalk from "chalk";
import execa from "execa";
import fs from "fs-extra";
import inquirer from "inquirer";
import path from "path";
import semver from "semver";

import { getFirstCommitId, getGroupedCommits, getPreTag, GroupedCommitsItem } from "@siujs/utils";

const execFnCache = {} as Record<"dryRun" | "run", (bin: string, args: string[], opts?: Record<string, any>) => any>;

export function runWhetherDry(isDryRun?: boolean) {
	return isDryRun
		? execFnCache.dryRun ||
				(execFnCache.dryRun = (bin: string, args: string[], opts = {}) =>
					console.log(chalk.yellow(`[dryrun] ${bin} ${args.join(" ")}`), opts))
		: execFnCache.run ||
				(execFnCache.run = (bin: string, args: string[], opts = {}) => execa(bin, args, { stdio: "inherit", ...opts }));
}

export async function gitPush(isDryRun: boolean) {
	const run = runWhetherDry(isDryRun);
	await run("git", ["push"]);
	await run("git", ["push", "--tags"]);
}

export async function npmPublish(cwd: string, registry: string, isDryRun?: boolean) {
	const run = runWhetherDry(isDryRun);
	await run("npm", ["publish", "--access", "public", "--registry", registry].filter(Boolean), {
		cwd,
		stdio: "inherit"
	});
}

export async function addGitTag(version: string, cwd: string, isDryRun?: boolean) {
	const run = runWhetherDry(isDryRun);
	await run("git", ["tag", version], { cwd, stdio: "inherit" });
}
export async function addGitTagOfPackage(version: string, pkgCwd: string, isDryRun?: boolean) {
	const run = runWhetherDry(isDryRun);
	await run("git", ["tag", `${path.basename(pkgCwd)}-${version}`], { cwd: pkgCwd, stdio: "inherit" });
}

export async function commitChanges(version: string, cwd: string, isDryRun?: boolean) {
	const run = runWhetherDry(isDryRun);
	await run("git", ["add", cwd]);
	await run("git", ["commit", "-m", `release: ${version}`]);
}

export async function commitChangesOfPackage(version: string, pkgCwd: string, isDryRun?: boolean) {
	const run = runWhetherDry(isDryRun);
	await run("git", ["add", pkgCwd]);
	await run("git", ["commit", "-m", `chore(release): ${path.basename(pkgCwd)} ${version}`]);
}

export async function updatePkgVersion(version: string, cwd: string) {
	const metaPath = path.resolve(cwd, "package.json");

	const pkgData = await fs.readJSON(metaPath);

	pkgData.version = version;

	await fs.writeJSON(metaPath, pkgData, { spaces: 2 });
}

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
				if (pkgMetas[depType] && pkgMetas[depType][key]) {
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

export async function chooseVersion(cwd: string) {
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
		message: "Select release type",
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

export async function getNewChangedLog(version: string, pkg?: string, needShowOthers?: boolean) {
	const getCommitMessage = (item: GroupedCommitsItem) => {
		if (pkg && item.scope !== pkg) return "";
		const ref = /\(#\d+\)/.test(item.header) ? "" : ` (${item.extra.hash.substring(0, 7)})`;
		return item.header.trim() + ref;
	};

	let tag = await getPreTag();

	if (!tag) {
		tag = await getFirstCommitId(false);
	}

	const groupedCommits = await getGroupedCommits(tag);

	const [date] = new Date().toISOString().split("T");

	const newLog = [`## v${version}`, `_${date}_`];

	let arr: string[];

	if (groupedCommits.breaking.length) {
		arr = groupedCommits.breaking.map(getCommitMessage).filter(Boolean);
		if (arr.length) {
			newLog.push(`### Breaking Changes\n\n- ${arr.join("\n- ")}`.trim());
		}
	}

	if (groupedCommits.features.length) {
		arr = groupedCommits.features.map(getCommitMessage).filter(Boolean);
		if (arr.length) {
			newLog.push(`### Features\n\n- ${arr.join("\n- ")}`.trim());
		}
	}

	if (groupedCommits.fixed.length) {
		arr = groupedCommits.fixed.map(getCommitMessage).filter(Boolean);
		if (arr.length) {
			newLog.push(`### Bug Fixs\n\n- ${arr.join("\n- ")}`.trim());
		}
	}

	if (needShowOthers && groupedCommits.others.length) {
		arr = groupedCommits.others.map(getCommitMessage).filter(Boolean);
		if (arr.length) {
			newLog.push(`### Others\n\n- ${arr.join("\n- ")}`.trim());
		}
	}

	return newLog.filter(Boolean).join("\n\n");
}

export async function updateChangelog(version: string, cwd: string, pkg?: string, isDryRun?: boolean) {
	const newLog = await getNewChangedLog(version, pkg);

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
