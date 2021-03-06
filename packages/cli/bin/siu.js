#!/usr/bin/env node

const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const program = require("commander");
const { prompt } = require("inquirer");

const { validPkgName, initCLI, runCmd } = require("../dist/index");

program.version(fs.readJSONSync(path.resolve(__dirname, "../package.json")).version);

(async () => {
	const runCmd = await initCLI();

	program
		.command("init <template> <app>")
		.option("-s,--source <source>", "source of template: gitlab、github、gitee or self private git-repo url")
		.option("--skipInstall", "Skip instaling node_modules", false)
		.description("Generate project from a remote template")
		.action(async (template, app, cmd) => {
			const usrStdin = {
				appName: app,
				cwd: process.cwd(),
				template,
				source: cmd.source,
				skipInstall: cmd.skipInstall
			};
			const isCurrent = app === ".";

			const name = isCurrent ? path.basename(usrStdin.cwd) : app;

			validPkgName(name);

			if (isCurrent) {
				const { ok } = await prompt([
					{
						name: "ok",
						type: "confirm",
						message: `Generate project in current directory?`
					}
				]);

				if (!ok) return;
			} else if (fs.pathExistsSync(path.resolve(usrStdin.cwd, usrStdin.appName))) {
				console.log(chalk.red(`Target directory is not empty!`));
				return;
			}

			await runCmd("init", usrStdin);
		});

	program.parse(process.argv);

	if (!process.argv.slice(2).length) {
		program.outputHelp();
	}
})();
