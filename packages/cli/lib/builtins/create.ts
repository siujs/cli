import chalk from "chalk";
import fs from "fs-extra";
import inquirer from "inquirer";
import path from "path";
import sh from "shelljs";

import { HookHandlerContext, PluginApi, ValueOf } from "@siujs/core";
import { getPkgDirName } from "@siujs/utils";

export function asCreationFallback(api: ValueOf<PluginApi>) {
	api.start(async (ctx: HookHandlerContext) => {
		const deps = ctx.opts<string>("deps");

		const pkgsRoot = ctx.pkg().pkgsRoot;

		const dirs = await fs.readdir(pkgsRoot);

		const metas = await Promise.all(dirs.map(dir => fs.readJSON(path.resolve(pkgsRoot, dir, "package.json"))));

		if (!deps && dirs.length) {
			const { deps } = await inquirer.prompt([
				{
					name: "deps",
					type: "checkbox",
					message: `Chooice siblings packages as deps?`,
					choices: metas.map(it => it.name)
				}
			]);

			if (deps) {
				ctx.keys("deps", deps);
			}
		} else {
			const depArr = deps.split(",");

			const kv = metas.reduce((prev, meta) => {
				prev[getPkgDirName(meta.name)] = meta.name;

				return prev;
			}, {} as Record<string, string>);

			ctx.keys(
				"deps",
				depArr.map(dir => kv[dir] || dir)
			);
		}
	});

	api.process(async (ctx: HookHandlerContext) => {
		const deps = ctx.keys<string[]>("deps");
		const pkgData = ctx.pkg();

		sh.mkdir(pkgData.path, path.resolve(pkgData.path, "lib"), path.resolve(pkgData.path, "__tests__"));

		sh.touch(path.resolve(pkgData.path, "lib/index.ts"));
		sh.touch(path.resolve(pkgData.path, "package.json"));

		await fs.writeJSON(
			path.resolve(pkgData.path, "package.json"),
			{
				name: pkgData.name,
				version: "0.0.0",
				description: pkgData.name,

				license: "MIT",
				directories: {
					lib: "lib",
					test: "__tests__"
				},
				files: ["lib"],
				dependencies:
					deps && deps.length
						? deps.reduce((prev, dep) => {
								prev[dep] = `file:../${getPkgDirName(dep)}`;
								return prev;
						  }, {} as any)
						: {}
			},
			{ spaces: 2 }
		);

		console.log(chalk`{green Successfully created {bold ${pkgData.dirName}}}!`);
	});

	api.error((ctx: HookHandlerContext) => {
		const ex = ctx.ex();
		console.log("ex:", ex);
		sh.rm("-rf", ctx.pkg().path);
	});
}
