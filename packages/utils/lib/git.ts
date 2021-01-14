import parser, { Commit } from "conventional-commits-parser";
import { Options } from "execa";
import path from "path";
import rm from "rimraf";

import { exec } from "./exec";

/**
 * Explicitly never recurse commands into submodules, overriding local/global configuration.
 * @see https://git-scm.com/docs/git-config#Documentation/git-config.txt-submodulerecurse
 */
const NO_SUBMODULE_RECURSE = ["-c", "submodule.recurse=false"];

/**
 *
 * Exec git command
 *
 * @param cmd git command string array
 * @param options execa options
 */
export async function execGit(cmd: string[], options: Options<string> = {}) {
	return await exec("git", NO_SUBMODULE_RECURSE.concat(cmd), options);
}

/**
 *
 * Download templates from git
 *
 * @param gitUrl git url
 * @param branch branch name
 * @param dest dest path
 */
export async function downloadGit(gitUrl: string, branch: string, dest: string) {
	await execGit(["clone", "-b", branch, gitUrl, dest]);

	await new Promise((resolve, reject) =>
		rm(path.resolve(dest, "./.git"), (err: Error) => {
			err ? /* istanbul ignore next */ reject(err) : resolve(true);
		})
	);
}

/**
 * get changed file paths which in staged changes
 *
 * @param cwd current workspace directory
 * @param options  git-diff options refer: https://git-scm.com/docs/git-diff#Documentation/git-diff.txt
 *
 *
 * @return {Promise<string[]} changed file paths
 */
export async function getStagedFiles(cwd: string, options: string[] = []): Promise<string[]> {
	const stagedCmds = ["diff", "--staged", "--name-only", "-z", "--diff-filter=ACMR"];

	const lines = await execGit(stagedCmds.concat(options), { cwd });

	return lines
		.replace(/\u0000$/, "")
		.split("\u0000")
		.filter(Boolean)
		.map(it => path.resolve(cwd, it));
}

/**
 *
 * Get prev tag of git
 *
 * @param versionPrefix tag version prefix
 */
export async function getPreTag(versionPrefix?: string): Promise<string> {
	const tagCmds = ["tag", "--list", "--sort", "-v:refname"];

	const tags = await execGit(tagCmds.concat([`${versionPrefix ? `${versionPrefix}v*` : "v*"}`]));

	return tags.split("\n").shift();
}

/**
 * get changed file paths which is commited
 *
 * @param startHash - start commit id
 * @param endHash - end commit id, default: HEAD
 * @param cwd - current workspace directory, default: process.cwd()
 *
 * @return {Promise<string[]} commited file paths
 */
export async function getCommittedFiles(
	startHash: string,
	endHash = "HEAD",
	cwd: string = process.cwd()
): Promise<string[]> {
	const lines = await execGit(["diff", "--name-only", "-z", startHash, endHash], { cwd });
	return lines
		.replace(/\u0000$/, "")
		.split("\u0000")
		.filter(Boolean)
		.map(it => path.resolve(cwd, it));
}

export type GroupedCommitsItem = Commit & {
	extra: {
		hash: string;
		userName: string;
		userEmail: string;
		time: string;
	};
	pullId?: string;
	pullSource?: string;
	breaking: boolean;
};

/**
 *
 * get commit info between `startHash` and `HEAD`
 *
 * @param startHash - start commit id
 * @param endHash - end commit id ,default: HEAD
 *
 */
export async function getGroupedCommits(
	startHash: string,
	endHash = "HEAD"
): Promise<Record<"breaking" | string, GroupedCommitsItem[]>> {
	const lines = await execGit([
		"--no-pager",
		"log",
		`${startHash}...${endHash}`,
		"--format=%B%n-extra-%n%H%n%an%n%ae%n%ci💨💨💨"
	]);

	return lines
		.split("💨💨💨")
		.filter(commit => commit.trim())
		.reduce(
			(prev, commit) => {
				const node = parser.sync(commit, {
					mergePattern: /^Merge pull request #(\d+) from (.*)$/,
					mergeCorrespondence: ["pullId", "pullSource"]
				});
				const extra = (node.extra || "").split("\n");

				const breaking =
					/(BREAKING CHANGES)|(Breaking Changes)/.test(node.body || node.footer) || /!:/.test(node.header);

				const kv = {
					...node,
					extra:
						extra.length >= 4
							? {
									hash: extra[0],
									userName: extra[1],
									userEmail: extra[2],
									time: extra[3]
							  }
							: {},
					breaking
				} as GroupedCommitsItem;

				if (breaking) {
					prev.breaking.push(kv);
				} else if (node.merge) {
					prev.merge = prev.merge || [];
					prev.merge.push(kv);
				} else if (node.type) {
					prev[node.type] = prev[node.type] || [];
					prev[node.type].push(kv);
				}
				return prev;
			},
			{ breaking: [] } as Record<"breaking" | string, GroupedCommitsItem[]>
		);
}

/**
 * Get first commit id
 *
 * @param isShort Whether get short commit hash id
 */
export async function getFirstCommitId(isShort?: boolean): Promise<string> {
	const lines = await execGit(["log", "--reverse", `--format=%${isShort ? "h" : "H"}`]);
	return lines.split("\n").shift();
}

/**
 *
 * Get current remote url
 *
 * @param cwd current workspace directory
 * @param originName  git origin name ,default: origin
 */
export async function getGitRemoteUrl(cwd: string, originName = "origin"): Promise<string> {
	const lines = await execGit(["remote", "get-url", originName], { cwd });
	return lines.split("\n").shift();
}
