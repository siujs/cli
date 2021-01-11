import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import shell from "shelljs";

import { isWindows, startSpinner } from "@siujs/utils";

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
	if (!shell.which("git")) {
		shell.echo(chalk.redBright("Sorry, you need install `git`"));
		shell.exit(1);
	}

	const spinner = startSpinner(chalk.greenBright(`Cloning files... `));

	const { gitPath, branch } = getGitInfo(opts.template, opts.source);

	const dest = path.resolve(opts.cwd, opts.appName);

	await new Promise((resolve, reject) => {
		shell.exec(`git clone -b ${branch} ${gitPath} ${dest}`, { silent: true }, (code, stdout, stderr) => {
			/* istanbul ignore if */
			if (code !== 0) {
				spinner.fail("Failed clone template files, reason: " + stderr);
				shell.exit(1);
			}
			shell
				.rm("-rf", path.resolve(dest, "./.git"))
				.exec("git init", { silent: true, cwd: dest }, (code, stdout, stderr) => {
					code !== 0 ? reject(stderr) : resolve(stdout);
				});
		});
	});

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

	if (!shell.which("yarn")) {
		spinner.warn(chalk.yellowBright(`Warning: Missing \`yarn\`, and we will install it --global`));
		shell.exec(`${isWindows ? "" : "sudo "}npm i -g yarn`);
	}

	await new Promise((resolve, reject) => {
		shell.exec("yarn", { silent: true, cwd: opts.cwd }, code => {
			if (code !== 0) {
				reject(false);
			}
			resolve(true);
		});
	});

	spinner.succeed(chalk.green(`${chalk.bold("Installed")} packages!`));
}
