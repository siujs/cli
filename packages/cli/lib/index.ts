import chalk from "chalk";
import program from "commander";
import validProjectName from "validate-npm-package-name";

import { initApp } from "@siujs/cli-init";
import { adjustSiuConfigCWD, loadPlugins, PluginCommand } from "@siujs/core";
import { filterUnExistsPkgs, isPkgExists } from "@siujs/utils";

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

export async function initCLI(isStrict?: boolean) {
	if (isStrict) {
		await adjustSiuConfigCWD();
	}

	const { applyPlugins, resolveCLIOptions } = await loadPlugins(cliFallback);

	const options = await resolveCLIOptions();

	async function runCmd(cmd: PluginCommand | "init", opts: Record<string, any>) {
		if (cmd === "init") {
			await initApp(opts as any);
			return;
		}

		if (opts.strict) {
			await adjustSiuConfigCWD();
		}

		try {
			await applyPlugins(cmd, opts, cmdFallback(cmd));
		} catch (ex) {
			console.error(ex);
			process.exit(1);
		}
	}

	async function handleWithPkgAction(pkg: string, cmd: any, cmdText: PluginCommand) {
		const arr = await filterUnExistsPkgs(pkg);
		if (arr.length) {
			console.log(chalk.red.bold(`[siu] ERROR: \`${arr.join(",")}\` does not exists!`));
			return;
		}
		await runCmd(cmdText, { pkg, ...cmd.opts() });
	}

	const DEFAULT_COMMAND = {
		create: program
			.command("create <pkg>")
			.description("Create monorepo's package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.action(async (pkg, cmd) => {
				const pkgs = pkg ? pkg.split(",") : [];

				for (let l = pkgs.length; l--; ) {
					validPkgName(pkgs[l]);
					const exists = await isPkgExists(pkgs[l]);
					if (exists) {
						console.log(chalk.red.bold(`[siu] ERROR: \`${pkgs[l]}\` already exists! `));
						return;
					}
				}
				await runCmd("create", { pkg, ...cmd.opts() });
			}),
		deps: program
			.command("deps <deps>")
			.option("-p, --pkg <pkg>", "target package name,e.g. foo、@foo/bar")
			.option("-r, --rm", "is remove deps from package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.description("Add deps to target monorepo's package, e.g. add foo,foo@1.2.2,foo:D,foo@1.2.2:D ")
			.action(async (deps, cmd) => {
				if (cmd.pkg) {
					validPkgName(cmd.pkg);
					const exists = await isPkgExists(cmd.target);
					if (!exists) {
						console.log(chalk.red.bold(`[siu] ERROR: \`${cmd.target}\` does not exists! `));
						return;
					}
				}
				if (!deps) return;
				await runCmd("deps", {
					deps,
					pkg: cmd.pkg,
					action: cmd.rm ? "rm" : "add",
					...cmd.opts()
				});
			}),
		glint: program
			.command("glint")
			.description("Lint for git action")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.option(
				"-h, --hook <hook>",
				"Git lifecycle hook: pre-commit、prepare-commit-msg、commit-msg、post-commit、post-merge"
			)
			.action(async cmd => {
				await runCmd("glint", cmd.opts());
			}),
		test: program
			.command("test [pkg]")
			.description("Test single or multiple monorepo's package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.action(async (pkg, cmd) => handleWithPkgAction(pkg, cmd, "test")),
		doc: program
			.command("doc [pkg]")
			.description("Generate docs of target monorepo's package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.action(async (pkg, cmd) => handleWithPkgAction(pkg, cmd, "doc")),
		serve: program
			.command("serve [pkg]")
			.description("Local developement of target monorepo's package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.action(async (pkg, cmd) => handleWithPkgAction(pkg, cmd, "serve")),
		demo: program
			.command("demo [pkg]")
			.description("Local demo of target monorepo's package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.action(async (pkg, cmd) => handleWithPkgAction(pkg, cmd, "demo")),
		build: program
			.command("build [pkg]")
			.description("Build single or multiple monorepo's package")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.option("-f, --format <format>", "Output format: es、cjs、umd、umd-min")
			.action(async (pkg, cmd) => handleWithPkgAction(pkg, cmd, "build")),
		publish: program
			.command("publish [pkg]")
			.description("Publish all packages or target monorepo's packages")
			.option("-S, --no-strict", "No need to force chdir to `siu.config.(ts|js)`'s root", true)
			.option("-n, --dry-run", "Whether dry run")
			.option("-v, --ver <ver>", "Target version: independent or x.x.x or auto choice")
			.option("-r, --repo <repo>", "Target npm repository url")
			.action(async (pkg, cmd) => handleWithPkgAction(pkg, cmd, "publish"))
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
