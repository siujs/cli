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
