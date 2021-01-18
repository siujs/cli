import { GroupedCommitsItem } from "@siujs/utils";

export interface GitClientHooksHandlers {
	/**
	 * git hook `pre-commit`
	 *
	 * @param stagedFiles file paths in staged changes
	 * @param cwd current workspace directory
	 *
	 * @return {Promise<boolean>}
	 */
	preCommit?: (stagedFiles: string[], cwd: string) => boolean | Promise<boolean>;
	/**
	 * git hook `prepare-commit-msg`
	 *
	 * @param usrInputMsg commit msg of user input
	 * @param cwd current workspace directory
	 *
	 * @return {Promise<string>} new commit msg
	 */
	prepareCommitMsg?: (usrInputMsg: string, cwd: string) => string | Promise<string>;
	/**
	 * git hook `commit-msg`
	 *
	 * @param preparedCommitMsg commit msg of prepareCommitMsg output
	 * @param cwd current workspace directory
	 *
	 * @return {Promise<boolean>} Does the message match the specified template
	 */
	commitMsg?: (preparedCommitMsg: string, cwd: string) => boolean | Promise<boolean>;
	/**
	 * git hook `post-commit`
	 *
	 * @param commitedInfo object of commited
	 * @param cwd current workspace directory
	 *
	 * @return {Promise<void>}
	 */
	postCommit?: (commitedInfo: GroupedCommitsItem, cwd: string) => boolean | Promise<boolean>;
	/**
	 * git hook `post-merge`
	 *
	 * @param mergedFiles files of merged success
	 * @param cwd current workspace directory
	 *
	 * @return {Promise<boolean>}
	 */
	postMerge?: (mergedFiles: string[], cwd: string) => boolean | Promise<boolean>;
}
