import parser, { Commit } from "conventional-commits-parser";
import path from "path";
import sh from "shelljs";

/**
 *
 * Download templates from git
 *
 * @param gitUrl git url
 * @param branch branch name
 * @param dest dest path
 */
export function downloadGit(gitUrl: string, branch: string, dest: string) {
	return new Promise((resolve, reject) => {
		sh.exec(`git clone -b ${branch} ${gitUrl} ${dest}`, { silent: true }, (code, stdout, stderr) => {
			if (code === 0) {
				/**
				 * remove unused directory `.git`
				 */
				sh.rm("-rf", path.resolve(dest, "./.git"));
				resolve(stdout);
			} else {
				/* istanbul ignore next */
				reject(stderr);
			}
		});
	});
}

/**
 * get changed file paths which in staged changes
 *
 * @param {string} cwd current workspace directory
 *
 * @return {Promise<string[]} changed file paths
 */
export function getStagedFiles(cwd: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		sh.exec("git diff --name-only --cached", { silent: true }, (code, stdout, stderr) => {
			if (code === 0) {
				return resolve(
					stdout
						.split("\n")
						.filter(Boolean)
						.map(it => path.resolve(cwd, it))
				);
			}
			reject(stderr);
		});
	});
}

/**
 *
 * Get prev tag of git
 *
 * @param versionPrefix tag version prefix
 */
export function getPreTag(versionPrefix?: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = sh.exec(`git tag --list ${versionPrefix ? `${versionPrefix}v*` : "v*"} --sort -v:refname`, {
			async: true,
			silent: true
		});

		let tags = "";

		child.stdout
			.on("data", data => {
				tags = data + "\n";
			})
			.on("end", () => {
				const [latestTag] = tags.split("\n");

				resolve(latestTag);
			})
			.on("error", (err: Error) => {
				reject(err);
			});
	});
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
export function getCommittedFiles(startHash: string, endHash = "HEAD", cwd: string = process.cwd()): Promise<string[]> {
	return new Promise((resolve, reject) => {
		sh.exec(`git diff --name-only ${startHash} ${endHash}`, { silent: true }, (code, stdout, stderr) => {
			if (code === 0) {
				return resolve(
					stdout
						.split("\n")
						.filter(Boolean)
						.map(it => path.resolve(cwd, it))
				);
			}
			/* istanbul ignore if */
			reject(stderr);
		});
	});
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
export function getGroupedCommits(
	startHash: string,
	endHash = "HEAD"
): Promise<Record<"breaking" | string, GroupedCommitsItem[]>> {
	return new Promise((resolve, reject) => {
		sh.exec(
			`git --no-pager log ${startHash}..${endHash} --format=%B%n-extra-%n%H%n%an%n%ae%n%ci💨💨💨`,
			{ silent: true },
			(code, stdout, stderr) => {
				if (code !== 0) {
					return reject(stderr);
				}
				const commits = stdout
					.split("💨💨💨")
					.filter(commit => commit.trim())
					.reduce(
						(prev, commit) => {
							const node = parser.sync(commit, {
								mergePattern: /^Merge pull request #(\d+) from (.*)$/,
								mergeCorrespondence: ["pullId", "pullSource"]
							});
							const extra = node.extra.split("\n");

							const breaking =
								/(BREAKING CHANGE)|(Breaking Change)/.test(node.body || node.footer) || /!:/.test(node.header);

							const kv = {
								...node,
								extra: {
									hash: extra[0],
									userName: extra[1],
									userEmail: extra[2],
									time: extra[3]
								},
								breaking
							} as GroupedCommitsItem;

							if (breaking) {
								prev.breaking.push(kv);
							} else if (node.merge) {
								prev.merge = prev.merge || [];
								prev.merge.push(kv);
							} else {
								prev[node.type] = prev[node.type] || [];
								prev[node.type].push(kv);
							}
							return prev;
						},
						{ breaking: [] } as Record<"breaking" | string, GroupedCommitsItem[]>
					);

				resolve(commits);
			}
		);
	});
}

/**
 * Get first commit id
 */
export function getFirstCommitId(isShort?: boolean): Promise<string> {
	return new Promise((resolve, reject) => {
		sh.exec(`git log --format=%${isShort ? "h" : "H"} --reverse`, { silent: true }, (code, stdout, stderr) => {
			/* istanbul ignore if */
			if (stderr) return reject(stderr);

			const ids = stdout.split("\n").filter(Boolean);
			resolve(ids[0]);
		});
	});
}

/**
 *
 * Get current remote url
 *
 * @param cwd current workspace directory
 * @param originName  git origin name ,default: origin
 */
export async function getGitRemoteUrl(cwd: string, originName = "origin"): Promise<string> {
	return new Promise((resolve, reject) => {
		sh.exec(`git remote get-url ${originName}`, { silent: true, cwd }, (code, stdout, stderr) => {
			/* istanbul ignore if */
			if (stderr) return reject(stderr);
			const urls = stdout.split("\n").filter(Boolean);
			resolve(urls[0]);
		});
	});
}
