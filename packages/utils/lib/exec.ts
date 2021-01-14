import execa from "execa";

const isWindows = process.platform === "win32";

/**
 *
 * Detect global command , whether installed
 *
 * @param cmd Global command name, e.g: yarn、git、node、npm and so on;
 */
export async function detectGlobalCommand(cmd: string) {
	try {
		await execa(cmd, ["--help"]);
		return true;
	} catch {
		return false;
	}
}

/**
 *
 * npm install -g package
 *
 * @param cmd Global command name, e.g: yarn、git、node、npm and so on;
 */
/* istanbul ignore next */
export async function installGlobalNodeModule(cmd: string) {
	try {
		isWindows ? await execa("sudo", ["npm", "i", "-g", cmd]) : await execa("npm", ["i", "-g", cmd]);
	} catch (err) {
		/* istanbul ignore next */
		throw err;
	}
}

/**
 *
 * Exec command
 *
 * @param file command path
 * @param cmdArgs arguments of command
 * @param options execa options
 */
export async function exec(file: string, cmdArgs: string[], options?: execa.Options<string>): Promise<string>;
export async function exec(file: string, options?: execa.Options<string>): Promise<string>;
export async function exec(file: string, cmdArgs?: string[] | execa.Options<string>, options?: execa.Options<string>) {
	try {
		const isCmdArgArr = Array.isArray(cmdArgs);

		const args = isCmdArgArr ? <string[]>cmdArgs : [];
		const opts = options || (isCmdArgArr ? {} : (cmdArgs as execa.Options<string>) || {});

		const { stdout } = await execa(file, args, {
			...opts,
			all: true,
			cwd: opts.cwd || process.cwd()
		});
		return stdout;
	} catch (ex) {
		/* istanbul ignore next */
		throw new Error(ex);
	}
}
