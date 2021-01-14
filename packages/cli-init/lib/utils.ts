import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

import { detectGlobalCommand, downloadGit, exec, execGit, installGlobalNodeModule, startSpinner } from "@siujs/utils";

const HostMap = {
	github: "github.com",
	gitee: "gitee.com"
};

export function getGitInfo(template: string, source?: "github" | "gitee") {
	const tmplArr = template.split("#");

	const branch = tmplArr.length > 1 ? tmplArr[tmplArr.length - 1] : source !== "gitee" ? "main" : "master";

	const isGitStylePath = template.startsWith("git@");

	const isHttpPath = template.startsWith("http://") || template.startsWith("https://");

	const gitPath =
		isGitStylePath || isHttpPath
			? tmplArr[0]
			: `https://${HostMap[source || "github"]}/${tmplArr[0].replace(/^@/g, "")}`;

	return {
		gitPath,
		branch
	};
}

export interface InitAppOptios {
	cwd: string;
	appName: string;
	template: string;
	source?: "github" | "gitee";
	skipInstall?: boolean;
}

export async function downloadTpl(opts: InitAppOptios) {
	/* istanbul ignore if */
	if (!(await detectGlobalCommand("git"))) {
		console.log(chalk.redBright("Sorry, you need install `git`"));
		return;
	}

	const spinner = startSpinner(chalk.greenBright(`Cloning files... `));

	const { gitPath, branch } = getGitInfo(opts.template, opts.source);

	const dest = path.resolve(opts.cwd, opts.appName);

	try {
		await downloadGit(gitPath, branch, dest);
		await execGit(["init"], { cwd: dest });
	} catch (err) {
		/* istanbul ignore next */
		return spinner.fail("Failed clone template files, reason: " + err);
	}

	const siuConfigPath = path.resolve(dest, "./siu.config.js");

	const hasSiuConfig = await fs.pathExists(siuConfigPath);

	/* istanbul ignore if */
	if (!hasSiuConfig) {
		await fs.writeFile(siuConfigPath, `module.exports={ excludePkgs:[], plugins:[] }`);
	}
	spinner.succeed(chalk.green(`${chalk.bold("Cloned")} files in ${chalk.bold(path.resolve(opts.cwd, opts.appName))}!`));
}

/* istanbul ignore next */
export async function installDeps(opts: { cwd: string }) {
	const spinner = startSpinner(chalk.greenBright(`☕ Installing packages, it will take a while `));

	if (!(await detectGlobalCommand("yarn"))) {
		spinner.warn(chalk.yellowBright(`Warning: Missing \`yarn\`, and we will install it --global`));
		await installGlobalNodeModule("yarn");
	}

	await exec("yarn", { cwd: opts.cwd, stdio: "ignore" });

	spinner.succeed(chalk.green(`${chalk.bold("Installed")} packages!`));
}
