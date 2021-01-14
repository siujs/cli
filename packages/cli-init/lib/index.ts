import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import ms from "pretty-ms";

import { createDebugger } from "@siujs/utils";

import { downloadTpl, InitAppOptios, installDeps } from "./utils";

const debug = createDebugger("siu:init");

export async function initApp(opts: InitAppOptios) {
	debug("options:", opts);

	await fs.mkdir(opts.cwd, { recursive: true });

	const startTime = Date.now();

	await downloadTpl(opts);

	!opts.skipInstall && (await installDeps({ cwd: path.resolve(opts.cwd, opts.appName) }));

	console.log(chalk.green(` Done in ${chalk.bold(ms(Date.now() - startTime))}!`));
}
