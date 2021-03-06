import chalk from "chalk";
import program from "commander";
import fs from "fs-extra";
import inquirer from "inquirer";
import path from "path";
import validProjectName from "validate-npm-package-name";

import { fixedCWD, loadPlugins, PluginCommand, SiuConfig } from "@siujs/core";
import { camelize, filterUnExistsPkgs, getPackageDirs, isPkgExists } from "@siujs/utils";

import { cliFallback, cmdFallback } from "./builtins";

/**
 *
 * valid package name
 *
 * @param name input name
 */
export function validPkgName(name: string) {
	const result = validProjectName(name);

	if (!result.validForNewPackages) {
		console.error(chalk.red(`Invalid name: "${name}"`));

		if ("errors" in result) {
			result.errors.forEach(err => {
				console.error(chalk.red.dim("Error: " + err));
			});
		}

		if ("warnings" in result) {
			result.warnings.forEach(warn => {
				console.error(chalk.red.dim("Warning: " + warn));
			});
		}

		process.exit(1);
	}
}

export async function validWorkspace(workspace = "packages") {
	const wkPath = path.resolve(process.cwd(), workspace);

	const flag = await fs.pathExists(wkPath);

	if (!flag) {
		console.log(chalk.red.bold(`[siu] ERROR: "${wkPath}" does not exists!`));
		process.exit(1);
	}
}

function isNullOrUndefined(obj: any) {
	const typeStr = Object.prototype.toString.call(obj);
	return typeStr === "[object Null]" || typeStr === "[object Undefined]";
}

export async function initCLI(isStrict?: boolean) {
	if (isStrict) {
		await fixedCWD();
	}

	const { applyPlugins, resolveCLIOptions } = await loadPlugins(cliFallback);

	const options = await resolveCLIOptions();

	async function runCmd(cmd: PluginCommand | "init", opts: Record<string, any>) {
		if (cmd === "init") {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			await require("@siujs/cli-init").initApp(opts as any);
			return;
		}

		if (opts.strict) {
			await fixedCWD();
		}

		try {
			const cliOpts = options[cmd];
			if (cliOpts) {
				const prompts = cliOpts.filter(o => !!o.prompt).map(o => o.prompt);
				if (prompts.length) {
					for (let l = prompts.length; l--; ) {
						const prompt = prompts[l],
							targetKey = (prompts[l].questions as any).name;

						if (!isNullOrUndefined(opts[targetKey])) continue;
						const output = (await inquirer.prompt(prompt.questions, prompt.initialAnswers)) as Record<string, any>;

						opts[targetKey] = prompt.answerTransform ? prompt.answerTransform(output[targetKey]) : output[targetKey];
					}
				}
			}

			await applyPlugins(cmd, opts, cmdFallback(cmd));
		} catch (ex) {
			console.error(ex);
			process.exit(1);
		}
	}

	async function handleWithPkgAction(pkg: string, opts: Record<string, any>, cmdText: PluginCommand) {
		await validWorkspace(opts.workspace);

		const arr = await filterUnExistsPkgs(pkg);
		if (arr.length) {
			console.log(chalk.red.bold(`[siu] ERROR: \`${arr.join(",")}\` does not exists!`));
			return;
		}
		await runCmd(cmdText, { pkg, ...opts });
	}

	const DEFAULT_COMMAND = {
		create: program
			.command("create <pkg>")
			.description("Create monorepo's package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.option("-w, --workspace [workspace]", "Specific workspace directory name", "packages")
			.action(async (pkg, options) => {
				await validWorkspace(options.workspace);

				const pkgs = pkg ? pkg.split(",") : [];

				for (let l = pkgs.length; l--; ) {
					validPkgName(pkgs[l]);
					const exists = await isPkgExists(pkgs[l]);
					if (exists) {
						console.log(chalk.red.bold(`[siu] ERROR: \`${pkgs[l]}\` already exists! `));
						return;
					}
				}

				await runCmd("create", { pkg, ...options });
			}),
		deps: program
			.command("deps <deps>")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.option("-w, --workspace [workspace]", "Specific workspace directory name", "packages")
			.option("-p, --pkg <pkg>", "target package name,e.g. foo、@foo/bar")
			.option("-r, --rm", "is remove deps from package")
			.description("Add deps to target monorepo's package, e.g. add foo,foo@1.2.2,foo:D,foo@1.2.2:D ")
			.action(async (deps, options) => {
				await validWorkspace(options.workspace);

				if (options.pkg) {
					validPkgName(options.pkg);
					const exists = await isPkgExists(options.pkg);
					if (!exists) {
						console.log(chalk.red.bold(`[siu] ERROR: \`${options.target}\` does not exists! `));
						return;
					}
				}
				if (!deps) return;

				if (!options.pkg) {
					const { pkg } = await inquirer.prompt({
						name: "pkg",
						type: "list",
						message: "Select package that need install deps:",
						choices: await getPackageDirs()
					});
					options.pkg = pkg;
				}

				await runCmd("deps", {
					deps,
					action: options.rm ? "rm" : "add",
					...options
				});
			}),
		glint: program
			.command("glint [COMMIT_EDITMSG]")
			.description("Lint for git action")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.option(
				"-h, --hook <hook>",
				"Git lifecycle hook: pre-commit、prepare-commit-msg、commit-msg、post-commit、post-merge"
			)
			.action(async (COMMIT_EDITMSG, options) => {
				if (!options.hook) {
					const { hook } = await inquirer.prompt({
						name: "hook",
						type: "list",
						message: "Select git lifecycle hook:",
						choices: ["pre-commit", "prepare-commit-msg", "commit-msg", "post-commit", "post-merge"]
					});
					options.hook = camelize(hook);
				} else {
					options.hook = camelize(options.hook);
				}

				options.commitEditMsg = COMMIT_EDITMSG;

				await runCmd("glint", options);
			}),
		test: program
			.command("test [pkg]")
			.description("Test single or multiple monorepo's package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.option("-w, --workspace [workspace]", "Specific workspace directory name", "packages")
			.action(async (pkg, options) => handleWithPkgAction(pkg, options, "test")),
		doc: program
			.command("doc [pkg]")
			.description("Generate docs of target monorepo's package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.option("-w, --workspace [workspace]", "Specific workspace directory name", "packages")
			.action(async (pkg, options) => handleWithPkgAction(pkg, options, "doc")),
		serve: program
			.command("serve [pkg]")
			.description("Local developement of target monorepo's package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.option("-w, --workspace [workspace]", "Specific workspace directory name", "packages")
			.action(async (pkg, options) => handleWithPkgAction(pkg, options, "serve")),
		demo: program
			.command("demo [pkg]")
			.description("Local demo of target monorepo's package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.option("-w, --workspace [workspace]", "Specific workspace directory name", "packages")
			.action(async (pkg, options) => handleWithPkgAction(pkg, options, "demo")),
		build: program
			.command("build [pkg]")
			.description("Build single or multiple monorepo's package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.option("-w, --workspace [workspace]", "Specific workspace directory name", "packages")
			.option("-f, --format <format>", "Output format: es、cjs、umd、umd-min")
			.action(async (pkg, options) => {
				await validWorkspace(options.workspace);

				if (!options.format) {
					const { format } = await inquirer.prompt({
						name: "format",
						type: "checkbox",
						message: "Select output formats:",
						choices: ["es", "cjs", "umd", "umd-min"]
					});
					options.format = format ? format.join(",") : "";
				}

				handleWithPkgAction(pkg, options, "build");
			}),
		publish: program
			.command("publish [pkg]")
			.description("Publish all packages or target monorepo's packages")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.option("-w, --workspace [workspace]", "Specific workspace directory name", "packages")
			.option("-n, --dry-run", "Whether dry run")
			.option("-v, --ver <ver>", "Target version: independent or x.x.x or auto choice")
			.option("-r, --repo <repo>", "Target npm repository url")
			.action(async (pkg, options) => handleWithPkgAction(pkg, options, "publish"))
	};

	Object.keys(DEFAULT_COMMAND).forEach((key: PluginCommand) => {
		const opts = options[key];

		if (!opts || !opts.length) return;

		const command = DEFAULT_COMMAND[key];

		opts.forEach(opt => {
			command.option(opt.flags, opt.description, opt.defaultValue, opt.fn);
		});
	});

	return runCmd;
}

export function defineConfig(config: SiuConfig): SiuConfig {
	return config;
}
