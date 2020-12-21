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
export async function getPreTag(versionPrefix?: string) {
	return new Promise((resolve, reject) => {
		const child = sh.exec(`git tags --list ${versionPrefix ? `${versionPrefix}v*` : "v*"} --sort --v:refname`, {
			async: true
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
 * @param prevCommitId - prev commit id
 * @param cwd - current workspace directory
 *
 * @return {Promise<string[]} commited file paths
 */
export function getCommitedFilePaths(prevCommitId: string, cwd: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		sh.exec(`git diff --name-only ${prevCommitId} HEAD`, { silent: true }, (code, stdout, stderr) => {
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

export type CommitsMsgInfo = Commit & {
	extra: {
		hash: string;
		userName: string;
		userEmail: string;
		time: string;
	};
	breaking: boolean;
};

/**
 *
 * get commit info between `preCommitId` and `HEAD`
 *
 * @param preCommitId prev commit id
 *
 */
export function getCommitsMsgInfos(
	preCommitId: string
): Promise<Record<"breaking" | "fixed" | "features" | "others", CommitsMsgInfo[]>> {
	return new Promise((resolve, reject) => {
		sh.exec(
			`git --no-pager log ${preCommitId}..HEAD --format=%B%n-extra-%n%H%n%an%n%ae%n%ci💨💨💨`,
			(code, stdout, stderr) => {
				if (code !== 0) {
					return reject(stderr);
				}
				const commits = stdout
					.split("💨💨💨")
					.filter(commit => commit.trim())
					.reduce(
						(prev, commit) => {
							const node = parser.sync(commit);
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
							} as CommitsMsgInfo;

							if (breaking) {
								prev.breaking.push(kv);
							} else if (node.type === "fix") {
								prev.fixed.push(kv);
							} else if (node.type === "feat") {
								prev.features.push(kv);
							} else {
								prev.others.push(kv);
							}
							return prev;
						},
						{ breaking: [], fixed: [], features: [], others: [] } as Record<
							"breaking" | "fixed" | "features" | "others",
							CommitsMsgInfo[]
						>
					);

				resolve(commits);
			}
		);
	});
}