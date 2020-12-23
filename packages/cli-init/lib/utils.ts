import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import ms from "pretty-ms";
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

	const startTime = Date.now();

	const spinner = startSpinner(chalk.greenBright(`Initializing \`${chalk.bold(opts.appName)}\` files... `));

	const { gitPath, branch } = getGitInfo(opts.template, opts.source);

	const dest = path.resolve(opts.cwd, opts.appName);

	await new Promise((resolve, reject) => {
		shell.exec(`git clone -b ${branch} ${gitPath} ${dest}`, { silent: true }, (code, stdout, stderr) => {
			if (code !== 0) {
				shell.echo("Err: Failed clone template files, reason: " + stderr);
				shell.exit(1);
			}
			shell.cd(dest);
			shell.rm("-rf", "./.git").exec("git init", { silent: true, cwd: dest }, (code, stdout, stderr) => {
				code !== 0 ? reject(stderr) : resolve(stdout);
			});
		});
	});

	const siuConfigPath = path.resolve(dest, "./siu.config.js");

	const hasSiuConfig = await fs.pathExists(siuConfigPath);

	if (!hasSiuConfig) {
		await fs.writeFile(siuConfigPath, `module.exports={ excludePkgs:[], plugins:[] }`);
	}

	spinner.stop(true);

	console.log(
		chalk.green(
			`${chalk.greenBright("✔")} ${chalk.bold("Initialized")} ${chalk.bold(opts.appName)} files! (cost ${ms(
				Date.now() - startTime
			)})`
		)
	);
}

/* istanbul ignore next */
export async function installDeps() {
	const startTime = Date.now();

	const spinner = startSpinner(chalk.greenBright(`☕ Installing packages, it will take a while `));

	if (!shell.which("yarn")) {
		shell.echo(chalk.yellowBright(`Warning: Missing \`yarn\`, and we will install it --global`));
		shell.exec(`${isWindows ? "" : "sudo "}npm i -g yarn`);
	}

	await new Promise((resolve, reject) => {
		shell.exec("git init", { silent: true }, code => {
			if (code !== 0) {
				reject(false);
			}
			shell.exec("yarn", { silent: true }, code => {
				if (code !== 0) {
					reject(false);
				}
				resolve(true);
			});
		});
	});

	spinner.stop(true);

	console.log(
		chalk.green(`${chalk.greenBright("✔")} ${chalk.bold("Installed")} packages in ${ms(Date.now() - startTime)}!`)
	);
}
