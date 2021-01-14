import chalk from "chalk";
import fs from "fs";
import path from "path";

import { exec, execGit, getCommittedFiles, getStagedFiles } from "@siujs/utils";

import { GitClientHooksHandlers } from "./types";

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
		try {
			let cfgPath = findConfigPath(cwd, "prettier");

			const tmpFiles = stagedFiles.map(file => path.normalize(file.replace(cwd, "."))).join(",");

			const files = `${path.resolve(cwd, stagedFiles.length > 1 ? `{${tmpFiles}}` : tmpFiles)}`;

			await exec(
				bin("prettier"),
				[cfgPath ? `--config=${cfgPath}` : "", "--color=always", "--write", files].filter(Boolean),
				{ stdio: "inherit" }
			);

			cfgPath = findConfigPath(cwd, "eslint");

			await exec(bin("eslint"), [cfgPath ? `--config=${cfgPath}` : "", "--fix", ...stagedFiles].filter(Boolean), {
				stdio: "inherit"
			});

			return true;
		} catch (ex) {
			return false;
		}
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
		return this.hnds.preCommit ? await this.hnds.preCommit(files, this.cwd) : true;
	}

	async prepareCommitMsg() {
		let msgPath = process.env.HUSKY_GIT_PARAMS || process.env.GIT_PARAMS;

		if (!msgPath) return false;

		msgPath = msgPath.split(" ").shift();

		const commitMsg = fs.readFileSync(msgPath, "utf-8").trim();

		if (this.hnds.prepareCommitMsg) {
			const newCommitMsg = await this.hnds.prepareCommitMsg(commitMsg, this.cwd);
			if (!newCommitMsg) return false;
			fs.writeFileSync(msgPath, newCommitMsg);
		}

		return true;
	}

	async commitMsg() {
		let msgPath = process.env.HUSKY_GIT_PARAMS || process.env.GIT_PARAMS;

		if (!msgPath) {
			console.log();
			console.error(`${chalk.bgRed.white(" ERROR: ")} ${chalk.red(`Can't find temp commit-msg-path!`)}`);
			return false;
		}

		msgPath = msgPath.split(" ").shift();

		const commitMsg = fs.readFileSync(msgPath, "utf-8").trim();

		if (!commitMsg) {
			console.log();
			console.error(`${chalk.bgRed.white(" ERROR: ")} ${chalk.red(`Empty commit message is not allowed!`)}`);
			return false;
		}

		return this.hnds.commitMsg ? await this.hnds.commitMsg(commitMsg, this.cwd) : true;
	}

	async postCommit() {
		const lines = await execGit(["log", "-1", "--pretty=format:(%H)(%an,%ae)(%ci)(%s)(%b)"]);

		const arr = lines.split(/\(|\)|,/g).filter(Boolean);

		const commitKV = {
			id: arr[0],
			userName: arr[1],
			userEmail: arr[2],
			time: arr[3],
			shortMsg: arr[4],
			msg: arr[4] + "\n" + arr[5],
			files: await getCommittedFiles("HEAD^", "HEAD", this.cwd)
		};

		return this.hnds.postCommit ? await this.hnds.postCommit(commitKV, this.cwd) : true;
	}

	async postMerge() {
		const mergedFiles = await getCommittedFiles("HEAD^", "HEAD", this.cwd);
		return this.hnds.postMerge ? await this.hnds.postMerge(mergedFiles, this.cwd) : true;
	}
}
