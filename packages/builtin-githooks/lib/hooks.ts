import chalk from "chalk";
import fs from "fs";
import path from "path";

import { createDebugger, exec, getCommittedFiles, getGroupedCommits, getStagedFiles } from "@siujs/utils";

import { GitClientHooksHandlers } from "./types";

const debug = createDebugger("siu:githooks");

const ConfigPathsPLaceHolder = [
	".__T__rc.js",
	"__T__.config.js",
	".__T__",
	".__T__rc",
	".__T__rc.json",
	".__T__rc.yml",
	".__T__rc.yaml",
	".__T__rc.json5",
	".__T__rc.cjs",
	"__T__.config.cjs"
];

const getConfigPaths = (target: "prettier" | "eslint") => ConfigPathsPLaceHolder.map(it => it.replace("__T__", target));

function findConfigPath(cwd: string, target: "prettier" | "eslint") {
	const configPaths = getConfigPaths(target);

	for (let i = 0, l = configPaths.length; i < l; i++) {
		const p = path.resolve(cwd, configPaths[i]);
		if (fs.existsSync(p)) return p;
	}
}

const commitRE = /^(revert: )?(feat|wip|fix|to|upd|docs|style|refactor|perf|types|test|wf|chore|ci|build|release)(\(.+\))?: .{1,50}/;

const bin = (name: string) => path.resolve(process.cwd(), "./node_modules/.bin", name);

const DEFAULT_HOOK_HNDS = {
	async preCommit(stagedFiles: string[], cwd: string) {
		let cfgPath = findConfigPath(cwd, "prettier");

		await exec(
			bin("prettier"),
			[cfgPath ? `--config=${cfgPath}` : "", "--color=always", "--write", ...stagedFiles].filter(Boolean),
			{ stdio: "inherit" }
		);

		cfgPath = findConfigPath(cwd, "eslint");

		await exec(bin("eslint"), [cfgPath ? `--config=${cfgPath}` : "", "--fix", ...stagedFiles].filter(Boolean), {
			stdio: "inherit"
		});

		return true;
	},
	async commitMsg(commitMsg: string) {
		if (!commitRE.test(commitMsg)) {
			console.log();
			console.error(
				` ${chalk.bgRed.white(" ERROR: ")} ${chalk.red(`invalid commit message format.`)}\n\n` +
					chalk.red(` Proper commit message format is required for automated changelog generation. Examples:\n\n`) +
					`    ${chalk.green(`feat(xxx): add some logic function or add some option `)}\n` +
					`    ${chalk.green(`fix: handle events on blur (close #28)`)}\n\n`
			);
			return false;
		}
		return true;
	}
};

export class GitClientHooks {
	protected cwd: string;
	protected hnds: GitClientHooksHandlers;
	constructor(cwd: string, hnds?: GitClientHooksHandlers) {
		this.cwd = cwd;
		this.hnds = hnds || DEFAULT_HOOK_HNDS;
	}

	async preCommit() {
		const files = await getStagedFiles(this.cwd);

		debug("staged files:", files);

		return files.length && this.hnds.preCommit ? await this.hnds.preCommit(files, this.cwd) : true;
	}

	async prepareCommitMsg() {
		let msgPath =
			process.env.SIU_GIT_PARAMS || process.env.HUSKY_GIT_PARAMS || process.env.GIT_PARAMS || ".git/COMMIT_EDITMSG";

		debug("[prepare] origin msgPath:", msgPath);

		/* istanbul ignore if */
		if (!msgPath) {
			console.log();
			console.error(`${chalk.bgRed.white(" ERROR: ")} ${chalk.red(`Can't find temp commit-msg-path!`)}`);
			return false;
		}

		msgPath = msgPath.split(" ").shift();

		debug("[prepare] transformed msgPath", msgPath);

		const commitMsg = fs.readFileSync(msgPath, "utf-8").trim();

		debug("[prepare] current commit message:", commitMsg);

		if (this.hnds.prepareCommitMsg) {
			const newCommitMsg = await this.hnds.prepareCommitMsg(commitMsg, this.cwd);

			/* istanbul ignore if */
			if (!newCommitMsg) {
				console.log();
				console.error(`${chalk.bgRed.white(" ERROR: ")} ${chalk.red(`Empty commit message is not allowed!`)}`);
				return false;
			}
			fs.writeFileSync(msgPath, newCommitMsg);
		}

		return true;
	}

	async commitMsg() {
		let msgPath =
			process.env.SIU_GIT_PARAMS || process.env.HUSKY_GIT_PARAMS || process.env.GIT_PARAMS || ".git/COMMIT_EDITMSG";

		debug("origin msgPath:", msgPath);

		/* istanbul ignore if */
		if (!msgPath) {
			console.log();
			console.error(`${chalk.bgRed.white(" ERROR: ")} ${chalk.red(`Can't find temp commit-msg-path!`)}`);
			return false;
		}

		msgPath = msgPath.split(" ").shift();

		debug("transformed msgPath", msgPath);

		const commitMsg = fs.readFileSync(msgPath, "utf-8").trim();

		debug("current commit message:", commitMsg);

		/* istanbul ignore if */
		if (!commitMsg) {
			console.log();
			console.error(`${chalk.bgRed.white(" ERROR: ")} ${chalk.red(`Empty commit message is not allowed!`)}`);
			return false;
		}

		return this.hnds.commitMsg ? await this.hnds.commitMsg(commitMsg, this.cwd) : true;
	}

	async postCommit() {
		const committedInfo = await getGroupedCommits("HEAD^", "HEAD", true);

		debug("current commit key-value:", committedInfo);

		return this.hnds.postCommit
			? await this.hnds.postCommit(Object.values(committedInfo).flat().shift(), this.cwd)
			: true;
	}

	/* istanbul ignore next */
	async postMerge() {
		const mergedFiles = await getCommittedFiles("HEAD^", "HEAD", this.cwd);

		debug("will merged files:", mergedFiles);

		return this.hnds.postMerge ? await this.hnds.postMerge(mergedFiles, this.cwd) : true;
	}
}
