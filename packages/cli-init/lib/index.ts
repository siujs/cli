import chalk from "chalk";
import ms from "pretty-ms";
import shell from "shelljs";

import { downloadTpl, InitAppOptios, installDeps } from "./utils";

export async function initApp(opts: InitAppOptios) {
	shell.mkdir(opts.cwd);

	shell.cd(opts.cwd);

	const startTime = Date.now();

	await downloadTpl(opts);

	!opts.skipInstall && (await installDeps());

	console.log(
		chalk.green(
			`${chalk.greenBright("✔")} \`${chalk.bold(opts.appName)}\` Created successfully in ${chalk.bold(
				ms(Date.now() - startTime)
			)}!`
		)
	);
}
